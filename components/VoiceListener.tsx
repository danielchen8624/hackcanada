'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VoiceOverlay from './VoiceOverlay';
import { speak } from '@/lib/tts';

type VoiceMode = 'DORMANT' | 'ACTIVE';

interface Command {
  intent: string;
  action: string;
  targetId: string | null;
  payload: { text: string | null };
  requiresConfirm: boolean;
  confirmPrompt: string | null;
  spokenResponse: string | null;
}

// Exact dismissal — short replies like "no", "done"
const DISMISS_EXACT = /^(no|nope|no thanks|no thank you|i'm good|i'm done|that's all|nothing|goodbye|bye|done|all good|not right now|nah)$/i;
// Exit keywords — matched anywhere so trailing noise ("exit uh") still works
const EXIT_WORDS = /\b(exit|stop|quit|turn off|shut up|close)\b/i;

// Wake word patterns - various ways "hey northreport" might be heard (sorted by length for correct matching)
const WAKE_PATTERNS = [
  'hey northreport', 'hey safe pulse', 'hey safe post', 'hey safepost',
  'hey pulse', 'a pulse', 'hey poles', 'hey polls',
  'hey safe polls', 'a northreport', 'hey save pulse', 'hey staples',
  'hey stables', 'hey safe', 'hey saves', 'hey safety', 'hey staple',
  'hey say pulse', 'hey say post',
  "he's safe both", "he's safe", "he is safe", "safe both",
  "say pulse", "safe pulse", "safe post", "safe poles",
  "say poles", "say post", "say posts", "hey state", "hey stay"
].sort((a, b) => b.length - a.length);

// Strip wake patterns from command text
function stripWakeWords(text: string): string {
  let result = text.toLowerCase();

  // First pass: remove known wake patterns
  for (const pattern of WAKE_PATTERNS) {
    // Global replace for robust removal
    // Escape special chars if any (none in current patterns but good practice)
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, ' ').trim();
  }

  // Cleanup extra spaces
  return result.replace(/\s+/g, ' ').trim();
}

// Check if text contains a wake word
function containsWakeWord(text: string): boolean {
  const lower = text.toLowerCase();
  return WAKE_PATTERNS.some(pattern => lower.includes(pattern));
}

export default function VoiceListener({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<VoiceMode>('DORMANT');
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<Command | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'restarting' | 'stopped'>('idle');
  const [confirmPending, setConfirmPending] = useState<Command | null>(null);

  // Refs for persistent state across renders
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const modeRef = useRef<VoiceMode>('DORMANT'); // Use ref to avoid effect re-runs
  const commandBufferRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processCommandRef = useRef<(text: string) => void>(() => {});
  const endSessionRef = useRef<() => void>(() => {});
  const isSpeakingRef = useRef(false);
  const postResponseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stoppedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownUntilRef = useRef(0); // timestamp — ignore wake words until this time

  // Sync mode ref with state
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || !enabled) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setStatus('listening');
    } catch {
      // Already started
    }
  }, [enabled]);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = false;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setStatus('idle');
  }, []);

  // End the voice session: go DORMANT, keep recognition running so wake word
  // detection continues without stopping/restarting the mic (avoids icon blink).
  const endSession = useCallback(() => {
    setMode('DORMANT');
    modeRef.current = 'DORMANT';
    setTranscript('');
    commandBufferRef.current = '';
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
    setStatus('listening');
  }, []);

  // Wrapper for speak() that blocks mic input during playback to prevent feedback loop
  const speakWithBlock = useCallback(async (text: string) => {
    isSpeakingRef.current = true;
    // Clear any pending command to avoid re-triggering
    commandBufferRef.current = '';
    setTranscript('');

    try {
      await speak(text);
    } finally {
      // Wait longer after speaking to avoid picking up echo (2 seconds)
      setTimeout(() => {
        isSpeakingRef.current = false;
        commandBufferRef.current = ''; // Clear again just in case
      }, 2000);
    }
  }, []);

  const executeCommand = useCallback(
    (cmd: Command) => {
      switch (cmd.action) {
        case 'open_feed':
        case 'open_posts':
          router.push('/feed?type=post');
          break;
        case 'open_stories':
          router.push('/feed?type=story');
          break;
        case 'open_reports':
          router.push('/feed?type=report');
          break;
        case 'open_map':
          router.push('/map');
          break;
        case 'open_dashboard':
          router.push('/dashboard');
          break;
        case 'open_311_filing':
          router.push('/dashboard/auto-file');
          break;
        case 'go_back':
          router.back();
          break;
        case 'analyze_report':
          // Dispatch custom event for SmartReportAgent to pick up
          window.dispatchEvent(new CustomEvent('northreport:analyze'));
          break;
        default:
          if (cmd.spokenResponse) {
            speakWithBlock(cmd.spokenResponse);
          }
      }
    },
    [router, speakWithBlock]
  );

  // Send command to Gemini and execute result
  const processCommand = useCallback(
    async (text: string) => {
      const cleanedText = stripWakeWords(text);
      console.log('[VOICE] Processing command:', cleanedText);

      if (!cleanedText || cleanedText.length < 2) {
        console.log('[VOICE] Command too short, ignoring');
        return;
      }

      // Dismiss / exit intent → end session
      if (DISMISS_EXACT.test(cleanedText.trim()) || EXIT_WORDS.test(cleanedText.trim())) {
        console.log('[VOICE] Dismiss/exit detected, ending session');
        await speakWithBlock('Got it. Say Hey NorthReport whenever you need me.');
        endSession();
        return;
      }

      setStatus('processing');
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: cleanedText,
            currentRoute: window.location.pathname,
            selectedItemId: null,
            selectedItemSource: null,
          }),
        });
        const cmd: Command = await res.json();
        console.log('[VOICE] Gemini response:', cmd);
        setLastCommand(cmd);

        if (cmd.intent === 'unknown') {
          speakWithBlock(cmd.spokenResponse || "I didn't understand that. Try again.");
        } else if (cmd.requiresConfirm) {
          setConfirmPending(cmd);
          speakWithBlock(cmd.confirmPrompt || `Please confirm: ${cmd.action}`);
        } else {
          // EXECUTE NAVIGATION FIRST
          executeCommand(cmd);

          // THEN SPEAK (if needed)
          if (cmd.spokenResponse) {
            // We use a slight delay for the speak to allow router transition to start
            setTimeout(() => speakWithBlock(cmd.spokenResponse!), 100);
          }
        }
      } catch (err) {
        console.error('[VOICE] Error:', err);
        speakWithBlock('Sorry, something went wrong.');
      }

      // Stay ACTIVE — user can give multiple commands in a session.
      // Reset buffer but keep mode ACTIVE with a 5s inactivity timer.
      setTranscript('');
      commandBufferRef.current = '';
      setStatus('listening');

      // Set 5s post-command timer — if no new wake word or speech, go DORMANT
      if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
      postResponseTimerRef.current = setTimeout(() => {
        console.log('[VOICE] 5s post-command silence — going dormant');
        setMode('DORMANT');
        modeRef.current = 'DORMANT';
        setTranscript('');
        setStatus('listening');
      }, 5000);
    },
    [executeCommand, speakWithBlock, endSession]
  );

  // Keep refs current so the effect doesn't need them as dependencies
  useEffect(() => { processCommandRef.current = processCommand; }, [processCommand]);
  useEffect(() => { endSessionRef.current = endSession; }, [endSession]);

  // Main speech recognition effect — only re-runs when enabled changes
  useEffect(() => {
    console.log('[VOICE] Effect triggered. enabled:', enabled);
    if (!enabled || typeof window === 'undefined') {
      console.log('[VOICE] Skipping init — enabled is false or SSR');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    let cleanup = false;

    // Request microphone permission first, then start recognition
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (cleanup) { stream.getTracks().forEach(t => t.stop()); return; }
        stream.getTracks().forEach(t => t.stop()); // Release the permission stream

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    console.log('[VOICE] SpeechRecognition initialized');

    recognition.onend = () => {
      // Only restart if we're supposed to be listening — immediate restart
      // to avoid a gap that causes the mic icon to blink off/on
      if (isListeningRef.current && !cleanup) {
        try {
          recognition.start();
        } catch {
          // If immediate start fails (e.g. already started), retry once after a tick
          setTimeout(() => {
            if (isListeningRef.current) {
              try { recognition.start(); } catch { /* give up */ }
            }
          }, 50);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.log('[VOICE] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        isListeningRef.current = false;
        setStatus('idle');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted' && !cleanup) {
        // For other errors, try to restart after a short delay
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch { /* ignore */ }
          }
        }, 300);
      }
      // For 'no-speech' and 'aborted', onend will handle restart
    };

    recognition.onresult = (event: any) => {
      // Get the latest transcript
      const results = Array.from(event.results) as any[];
      const fullTranscript = results
        .map((r: any) => r[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim();

      // Update UI transcript
      setTranscript(modeRef.current === 'DORMANT' ? fullTranscript : stripWakeWords(fullTranscript));

      // Ignore if TTS is playing
      if (isSpeakingRef.current) return;

      // === DORMANT MODE: Listen for wake word ===
      if (modeRef.current === 'DORMANT') {
        if (containsWakeWord(fullTranscript) && Date.now() > cooldownUntilRef.current) {
          console.log('[VOICE] Wake word detected!');

          const commandAfterWake = stripWakeWords(fullTranscript);

          // "Hey NorthReport exit/stop/quit" → end session immediately, skip ACTIVE
          if (commandAfterWake && EXIT_WORDS.test(commandAfterWake)) {
            console.log('[VOICE] Exit in wake phrase — ending session');
            endSession();
            return;
          }

          // Cancel post-response shutdown — user is re-engaging
          if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);

          // Switch to ACTIVE mode
          setMode('ACTIVE');
          modeRef.current = 'ACTIVE';
          commandBufferRef.current = '';
          setTranscript('');

          // Extract any command that came after the wake word
          if (commandAfterWake && commandAfterWake.length > 2) {
            console.log('[VOICE] Command after wake word:', commandAfterWake);
            commandBufferRef.current = commandAfterWake;
          }

          // Start 5-second inactivity timer
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = setTimeout(() => {
            console.log('[VOICE] 5s inactivity - returning to DORMANT');
            if (commandBufferRef.current) {
              // If there's a buffered command, process it
              processCommandRef.current(commandBufferRef.current);
            } else {
              // Otherwise just go back to sleep
              setMode('DORMANT');
              modeRef.current = 'DORMANT';
              setTranscript('');
            }
          }, 5000);

          // Play activation sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleURhdGEAAAAAA==');
            audio.play().catch(() => { });
          } catch {
            // ignore
          }
        }
      }
      // === ACTIVE MODE: Accumulate command and send after silence ===
      else if (modeRef.current === 'ACTIVE') {
        // Check for exit / bye / stop commands → fully stop listening
        const exitCmd = stripWakeWords(fullTranscript).trim();
        if (
          fullTranscript.includes('bye northreport') || fullTranscript.includes('bye safe pulse') ||
          EXIT_WORDS.test(exitCmd)
        ) {
          console.log('[VOICE] Exit/bye detected — ending session');
          endSession();
          return;
        }

        // Accumulate command (strip wake words)
        const currentCommand = stripWakeWords(fullTranscript);
        if (currentCommand && currentCommand !== commandBufferRef.current) {
          console.log('[VOICE] Command buffer updated:', currentCommand);
          commandBufferRef.current = currentCommand;
          setTranscript(currentCommand);

          // Reset 5-second inactivity timer (user is speaking)
          if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = setTimeout(() => {
            if (commandBufferRef.current) {
              processCommandRef.current(commandBufferRef.current);
            } else {
              setMode('DORMANT');
              modeRef.current = 'DORMANT';
              setTranscript('');
            }
          }, 5000);

          // Start/reset 3-second silence timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            console.log('[VOICE] 3s silence - sending command:', commandBufferRef.current);
            if (commandBufferRef.current) {
              processCommandRef.current(commandBufferRef.current);
            }
          }, 3000);
        }
      }
    };

    // Start listening
    try {
      recognition.start();
      isListeningRef.current = true;
      setStatus('listening');
      console.log('[VOICE] Speech recognition started');
    } catch (e) {
      console.error('[VOICE] Failed to start:', e);
    }
      })
      .catch((err) => {
        console.warn('[VOICE] Microphone permission denied:', err);
      });

    return () => {
      cleanup = true;
      isListeningRef.current = false;
      try { recognition?.abort(); } catch { /* ignore */ }
      try { recognition?.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
      if (stoppedTimerRef.current) clearTimeout(stoppedTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return null;

  return (
    <VoiceOverlay
      isActive={mode === 'ACTIVE' || status === 'stopped'}
      status={status}
      transcript={transcript}
      lastCommand={lastCommand}
      confirmPending={confirmPending}
      onClose={() => {
        endSession();
      }}
      onConfirm={() => {
        if (confirmPending) {
          executeCommand(confirmPending);
          if (confirmPending.spokenResponse) speakWithBlock(confirmPending.spokenResponse);
          setConfirmPending(null);
        }
      }}
      onCancel={() => {
        setConfirmPending(null);
        speakWithBlock('Cancelled.');
      }}
    />
  );
}
