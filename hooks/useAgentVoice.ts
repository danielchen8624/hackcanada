'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { containsWakeWord, stripWakeWords } from '@/lib/voicePatterns';
import { speak } from '@/lib/tts';

export type VoiceMode = 'idle' | 'listening' | 'processing';

interface ReportState {
  department?: string;
  severity?: string;
  technical_description?: string;
  bylaw_reference?: string;
}

interface AgentCommandResult {
  intent: 'refine' | 'file' | 'cancel' | 'ask';
  updatedDescription: string | null;
  spoken_response: string;
}

interface UseAgentVoiceOptions {
  enabled: boolean;
  reportState: ReportState | null;
  initialGreeting: string | null;
  onRefine: (newDescription: string) => void;
  onFile: () => void;
  onCancel: () => void;
  onAnalyze?: () => void;
}

// Exact dismissal — short replies like "no", "done"
const DISMISS_EXACT = /^(no|nope|no thanks|no thank you|i'm good|i'm done|that's all|nothing|goodbye|bye|done|all good|not right now|nah)$/i;
// Exit keywords — matched anywhere so trailing noise ("exit uh") still works
const EXIT_WORDS = /\b(exit|stop|quit|turn off|shut up|close)\b/i;

// Keywords that indicate "analyze" intent when no report exists yet
const ANALYZE_WORDS = /\b(analyze|analyse|scan|check|identify|inspect|look at|what is|ai agent|agent)\b/i;

export function useAgentVoice({
  enabled,
  reportState,
  initialGreeting,
  onRefine,
  onFile,
  onCancel,
  onAnalyze,
}: UseAgentVoiceOptions) {
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle');
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const modeRef = useRef<'DORMANT' | 'ACTIVE'>('DORMANT');
  const commandBufferRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const reportStateRef = useRef<ReportState | null>(null);
  const callbacksRef = useRef({ onRefine, onFile, onCancel, onAnalyze });
  const greetingSpokenRef = useRef(false);
  const postResponseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownUntilRef = useRef(0);

  // Keep refs current
  useEffect(() => { reportStateRef.current = reportState; }, [reportState]);
  useEffect(() => { callbacksRef.current = { onRefine, onFile, onCancel, onAnalyze }; }, [onRefine, onFile, onCancel, onAnalyze]);

  const speakWithBlock = useCallback(async (text: string) => {
    isSpeakingRef.current = true;
    commandBufferRef.current = '';
    setTranscript('');
    try {
      await speak(text);
    } finally {
      setTimeout(() => {
        isSpeakingRef.current = false;
        commandBufferRef.current = '';
      }, 2000);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
  }, []);

  const endSession = useCallback(() => {
    modeRef.current = 'DORMANT';
    setVoiceMode('idle');
    setTranscript('');
    commandBufferRef.current = '';
    clearTimers();
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setTimeout(() => {
      isListeningRef.current = true;
      try { recognitionRef.current?.start(); } catch { /* ignore */ }
    }, 1000);
  }, [clearTimers]);

  const goIdle = useCallback(() => {
    modeRef.current = 'DORMANT';
    setVoiceMode('idle');
    setTranscript('');
    commandBufferRef.current = '';
    clearTimers();
  }, [clearTimers]);

  const processCommand = useCallback(async (text: string) => {
    const cleaned = stripWakeWords(text);
    if (!cleaned || cleaned.length < 2) { goIdle(); return; }

    if (DISMISS_EXACT.test(cleaned.trim()) || EXIT_WORDS.test(cleaned.trim())) {
      await speakWithBlock('Got it. Let me know if you need anything.');
      endSession();
      return;
    }

    // If no report yet (intake step), handle "analyze" locally — no need for Gemini
    if (!reportStateRef.current && callbacksRef.current.onAnalyze) {
      if (ANALYZE_WORDS.test(cleaned)) {
        setVoiceMode('processing');
        setTranscript(cleaned);
        await speakWithBlock('Analyzing your image now.');
        callbacksRef.current.onAnalyze();
        goIdle();
        return;
      }
      // During intake, only "analyze" makes sense — ignore other commands
      await speakWithBlock('Say "analyze" or "scan this" to start the AI analysis.');
      goIdle();
      return;
    }

    setVoiceMode('processing');
    setTranscript(cleaned);

    try {
      const res = await fetch('/api/agent-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: cleaned,
          reportState: reportStateRef.current,
        }),
      });

      if (!res.ok) throw new Error('Command failed');

      const result: AgentCommandResult = await res.json();

      switch (result.intent) {
        case 'refine':
          if (result.updatedDescription) {
            callbacksRef.current.onRefine(result.updatedDescription);
          }
          await speakWithBlock(result.spoken_response);
          break;
        case 'file':
          await speakWithBlock(result.spoken_response);
          setTimeout(() => callbacksRef.current.onFile(), 300);
          break;
        case 'cancel':
          await speakWithBlock(result.spoken_response);
          setTimeout(() => callbacksRef.current.onCancel(), 300);
          break;
        case 'ask':
          await speakWithBlock(result.spoken_response);
          break;
      }
    } catch {
      await speakWithBlock('Sorry, something went wrong. Please try again.');
    }

    goIdle();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }

    if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
    postResponseTimerRef.current = setTimeout(() => {
      if (modeRef.current === 'DORMANT') endSession();
    }, 5000);
  }, [goIdle, endSession, speakWithBlock]);

  // Speak initial greeting
  useEffect(() => {
    if (!enabled || !initialGreeting || greetingSpokenRef.current) return;
    greetingSpokenRef.current = true;
    speakWithBlock(initialGreeting);
  }, [enabled, initialGreeting, speakWithBlock]);

  useEffect(() => {
    if (!enabled) greetingSpokenRef.current = false;
  }, [enabled]);

  // Main speech recognition lifecycle with EXPLICIT mic permission request
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    console.log('[AGENT_VOICE] Starting voice system...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[AGENT_VOICE] SpeechRecognition not supported');
      return;
    }

    let recognition: any = null;
    let cleanup = false;

    // Request microphone permission FIRST
    console.log('[AGENT_VOICE] Requesting microphone permission...');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (cleanup) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        console.log('[AGENT_VOICE] Microphone permission GRANTED!');
        stream.getTracks().forEach(t => t.stop()); // Release the stream

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          console.log('[AGENT_VOICE] Now listening for "Hey NorthReport"...');
        };

        recognition.onend = () => {
          if (isListeningRef.current && !cleanup) {
            setTimeout(() => {
              try { recognition?.start(); } catch { /* ignore */ }
            }, 300);
          }
        };

        recognition.onerror = (event: any) => {
          console.log('[AGENT_VOICE] Error:', event.error);
          if (event.error === 'not-allowed') {
            isListeningRef.current = false;
            setVoiceMode('idle');
          } else if (event.error !== 'no-speech' && !cleanup) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try { recognition?.start(); } catch { /* ignore */ }
              }
            }, 1000);
          }
        };

        recognition.onresult = (event: any) => {
          const results = Array.from(event.results) as any[];
          const fullTranscript = results.map((r: any) => r[0].transcript).join(' ').toLowerCase().trim();
          console.log('[AGENT_VOICE] Heard:', fullTranscript);

          if (isSpeakingRef.current) return;

          // DORMANT: listen for wake word
          if (modeRef.current === 'DORMANT') {
            setTranscript(fullTranscript);
            if (containsWakeWord(fullTranscript) && Date.now() > cooldownUntilRef.current) {
              console.log('[AGENT_VOICE] Wake word detected!');
              const afterWake = stripWakeWords(fullTranscript);

              if (afterWake && EXIT_WORDS.test(afterWake)) {
                endSession();
                return;
              }

              if (postResponseTimerRef.current) clearTimeout(postResponseTimerRef.current);
              modeRef.current = 'ACTIVE';
              setVoiceMode('listening');
              commandBufferRef.current = '';
              setTranscript('');

              if (afterWake && afterWake.length > 2) {
                commandBufferRef.current = afterWake;
              }

              if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = setTimeout(() => {
                if (commandBufferRef.current) {
                  processCommand(commandBufferRef.current);
                } else {
                  goIdle();
                }
              }, 5000);

              try {
                const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleURhdGEAAAAAA==');
                audio.play().catch(() => { });
              } catch { /* ignore */ }
            }
          }
          // ACTIVE: accumulate command
          else if (modeRef.current === 'ACTIVE') {
            const exitCmd = stripWakeWords(fullTranscript).trim();
            if (
              fullTranscript.includes('bye northreport') || fullTranscript.includes('bye safe pulse') ||
              EXIT_WORDS.test(exitCmd)
            ) {
              endSession();
              return;
            }

            const currentCommand = stripWakeWords(fullTranscript);
            if (currentCommand && currentCommand !== commandBufferRef.current) {
              commandBufferRef.current = currentCommand;
              setTranscript(currentCommand);

              if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = setTimeout(() => {
                if (commandBufferRef.current) processCommand(commandBufferRef.current);
                else goIdle();
              }, 5000);

              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                if (commandBufferRef.current) processCommand(commandBufferRef.current);
              }, 3000);
            }
          }
        };

        // Start listening
        try {
          recognition.start();
          isListeningRef.current = true;
          console.log('[AGENT_VOICE] Speech recognition started!');
        } catch (e) {
          console.error('[AGENT_VOICE] Failed to start:', e);
        }
      })
      .catch((err) => {
        console.error('[AGENT_VOICE] Microphone permission DENIED:', err);
      });

    return () => {
      console.log('[AGENT_VOICE] Cleanup — releasing microphone');
      cleanup = true;
      isListeningRef.current = false;
      try { recognition?.abort(); } catch { /* ignore */ }
      try { recognition?.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      modeRef.current = 'DORMANT';
      clearTimers();
    };
  }, [enabled, processCommand, goIdle, clearTimers, endSession]);

  return { voiceMode, transcript };
}
