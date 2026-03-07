'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  FileText,
  BookOpen,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle2,
  ArrowLeft,
  Mic,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCameraVoice } from '@/hooks/useCameraVoice';
import { useVoiceControl } from '@/lib/voiceContext';

interface EducateResponse {
  identified_subject: string;
  description: string;
  community_impact: string;
  why_it_matters: string;
  related_topics: string[];
  severity_context: string | null;
  actionable_tips: string[];
}

type CameraState = 'requesting' | 'streaming' | 'denied' | 'captured';

interface CaptureCameraProps {
  onClose: () => void;
}

export default function CaptureCamera({ onClose }: CaptureCameraProps) {
  const router = useRouter();
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<'educate' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Educate state
  const [educateLoading, setEducateLoading] = useState(false);
  const [educateResult, setEducateResult] = useState<EducateResponse | null>(null);
  const [educateError, setEducateError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gpsRef = useRef<{ latitude: number; longitude: number }>({ latitude: 43.2557, longitude: -79.9192 });
  const gpsWatchRef = useRef<number | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Start camera and GPS on mount
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        // Set state first so <video> mounts, then assign stream in next effect
        setCameraState('streaming');
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else {
          setError('Could not access camera. Please use a device with a camera.');
          setCameraState('denied');
        }
      }
    }

    // Start GPS watch in background
    if ('geolocation' in navigator) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          gpsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        },
        () => { /* Keep defaults on error */ },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
      );
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // Assign stream to video element once it's mounted
  useEffect(() => {
    if (cameraState === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

    // Snapshot GPS at capture moment
    setGpsCoords({ ...gpsRef.current });
    setImageBase64(dataUrl);

    // Stop camera stream
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraState('captured');
  }, []);

  const handleRetake = useCallback(async () => {
    setImageBase64(null);
    setActiveFlow(null);
    setEducateResult(null);
    setEducateError(null);
    setCameraState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState('streaming');
    } catch {
      setCameraState('denied');
    }
  }, []);

  const handleEducate = useCallback(async () => {
    if (!imageBase64) return;
    setActiveFlow('educate');
    setEducateLoading(true);
    setEducateError(null);

    try {
      const res = await fetch('/api/educate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!res.ok) throw new Error('Education analysis failed');

      const data: EducateResponse = await res.json();
      setEducateResult(data);
    } catch {
      setEducateError('Failed to analyze image. Please try again.');
    } finally {
      setEducateLoading(false);
    }
  }, [imageBase64]);

  const navigateToReport = useCallback(() => {
    if (imageBase64) {
      sessionStorage.setItem('capturedImage', imageBase64);
      if (gpsCoords) {
        sessionStorage.setItem('capturedGps', JSON.stringify(gpsCoords));
      }
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
    }
    onClose();
    router.push('/report');
  }, [imageBase64, gpsCoords, onClose, router]);

  const handleClose = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
    }
    onClose();
  }, [onClose]);

  const handleBackFromEducate = useCallback(() => {
    setActiveFlow(null);
    setEducateResult(null);
    setEducateError(null);
  }, []);

  // Pause global VoiceListener while camera is open
  const { pauseVoice, resumeVoice } = useVoiceControl();
  useEffect(() => {
    pauseVoice();
    return () => { resumeVoice(); };
  }, [pauseVoice, resumeVoice]);

  // Camera voice commands
  const { voiceState, transcript: voiceTranscript } = useCameraVoice({
    enabled: cameraState === 'streaming' || cameraState === 'captured',
    context: { cameraState, activeFlow },
    callbacks: {
      handleCapture,
      handleRetake,
      handleClose,
      handleEducate,
      navigateToReport,
      onBackFromEducate: handleBackFromEducate,
    },
  });

  // Permission denied / error state
  if (cameraState === 'denied') {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex: 10001, background: 'rgba(0,0,0,0.95)' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-2xl p-6 text-center space-y-4 backdrop-blur-xl"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Camera className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Camera Access Required</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {error || 'Camera access is needed to scan your surroundings. Please allow camera access in your browser settings.'}
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // Educate flow
  if (activeFlow === 'educate' && imageBase64) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 10001, background: '#000' }}>
        <img src={imageBase64} alt="Captured" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <EducatePanel
          imageBase64={imageBase64}
          loading={educateLoading}
          result={educateResult}
          error={educateError}
          onClose={handleClose}
          onBack={handleBackFromEducate}
          onSwitchToReport={() => { setEducateResult(null); navigateToReport(); }}
        />
        <CameraVoiceHUD voiceState={voiceState} transcript={voiceTranscript} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 10001, background: '#000' }}>
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video element always mounted so ref is available for stream assignment */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cameraState === 'streaming' ? '' : 'invisible'}`}
      />

      {/* Camera UI overlay - only when streaming */}
      {cameraState === 'streaming' && (
        <>
          {/* Viewfinder corners */}
          <ViewfinderOverlay />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md transition-colors"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Shutter button */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={handleCapture}
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{
                border: '4px solid rgba(255,255,255,0.9)',
                background: 'transparent',
              }}
            >
              <div
                className="w-[58px] h-[58px] rounded-full"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              />
            </motion.button>
          </div>
        </>
      )}

      {/* Requesting state */}
      {cameraState === 'requesting' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Captured state - frozen image + decision overlay */}
      <AnimatePresence>
        {cameraState === 'captured' && imageBase64 && !activeFlow && (
          <>
            <img src={imageBase64} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />

            {/* Retake button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleRetake}
              className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md text-sm font-medium"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </motion.button>

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleClose}
              className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Decision overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-3"
              >
                <p className="text-center text-white/80 text-sm font-medium mb-4">
                  What would you like to do?
                </p>

                {/* File a Report button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={navigateToReport}
                  className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 text-base backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)',
                    color: '#0A0E14',
                    boxShadow: '0 0 30px rgba(34, 211, 238, 0.3), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <FileText className="w-5 h-5" />
                  File a Report
                </motion.button>

                {/* Educate Me button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={handleEducate}
                  className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 text-base backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)',
                    color: 'white',
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.3), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  Educate Me
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Voice HUD + listening glow */}
      {(cameraState === 'streaming' || cameraState === 'captured') && (
        <>
          <CameraVoiceHUD voiceState={voiceState} transcript={voiceTranscript} />
          <AnimatePresence>
            {voiceState === 'listening' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none rounded-none"
                style={{
                  boxShadow: 'inset 0 0 40px rgba(34, 211, 238, 0.35), inset 0 0 80px rgba(34, 211, 238, 0.15)',
                  border: '2px solid rgba(34, 211, 238, 0.5)',
                  zIndex: 50,
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ── Camera Voice HUD ── */
function CameraVoiceHUD({ voiceState, transcript }: { voiceState: 'idle' | 'listening' | 'executing'; transcript: string }) {
  return (
    <div className="absolute top-[72px] left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 60 }}>
      <AnimatePresence mode="wait">
        {voiceState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <Mic className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40 font-medium">Say &quot;Hey NorthReport&quot;</span>
          </motion.div>
        )}
        {voiceState === 'listening' && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.4)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mic className="w-4 h-4 text-cyan-400" />
            </motion.div>
            {/* Sound bars */}
            <div className="flex items-center gap-0.5 h-4">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-cyan-400"
                  animate={{ height: ['6px', '16px', '6px'] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
            {transcript && (
              <span className="text-xs text-cyan-300 font-medium max-w-[200px] truncate">{transcript}</span>
            )}
          </motion.div>
        )}
        {voiceState === 'executing' && (
          <motion.div
            key="executing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(34, 211, 238, 0.2)', border: '1px solid rgba(34, 211, 238, 0.5)' }}
          >
            <Check className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium">{transcript || 'Done'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Viewfinder corner brackets ── */
function ViewfinderOverlay() {
  const cornerSize = 40;
  const strokeWidth = 3;
  const offset = 48;
  const color = 'rgba(34, 211, 238, 0.6)';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left */}
      <svg className="absolute" style={{ top: offset, left: offset }} width={cornerSize} height={cornerSize}>
        <path d={`M0,${cornerSize} L0,0 L${cornerSize},0`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
      {/* Top-right */}
      <svg className="absolute" style={{ top: offset, right: offset }} width={cornerSize} height={cornerSize}>
        <path d={`M0,0 L${cornerSize},0 L${cornerSize},${cornerSize}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
      {/* Bottom-left */}
      <svg className="absolute" style={{ bottom: offset + 80, left: offset }} width={cornerSize} height={cornerSize}>
        <path d={`M0,0 L0,${cornerSize} L${cornerSize},${cornerSize}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
      {/* Bottom-right */}
      <svg className="absolute" style={{ bottom: offset + 80, right: offset }} width={cornerSize} height={cornerSize}>
        <path d={`M${cornerSize},0 L${cornerSize},${cornerSize} L0,${cornerSize}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Educate Panel (inline) ── */
function EducatePanel({
  imageBase64,
  loading,
  result,
  error,
  onClose,
  onBack,
  onSwitchToReport,
}: {
  imageBase64: string;
  loading: boolean;
  result: EducateResponse | null;
  error: string | null;
  onClose: () => void;
  onBack: () => void;
  onSwitchToReport: () => void;
}) {
  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BookOpen className="w-12 h-12 text-purple-400" />
        </motion.div>
        <p className="text-white/80 text-sm font-medium">Learning about this...</p>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute inset-x-0 bottom-0 p-6 pb-12 space-y-4"
      >
        <div className="rounded-2xl p-5 backdrop-blur-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
        <button onClick={onBack} className="w-full py-3 rounded-xl font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
          Go Back
        </button>
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col"
    >
      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 p-5 pb-0 space-y-4" style={{ background: 'linear-gradient(to top, rgba(10,14,20,0.98), rgba(10,14,20,0.92))' }}>
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/60 mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header with image thumbnail */}
        <div className="flex items-center gap-4">
          <img src={imageBase64} alt="Captured" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          <div>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Identified</p>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{result.identified_subject}</h3>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Info className="w-4 h-4 text-cyan-400" />
            What is this?
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.description}</p>
        </div>

        {/* Community Impact */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Community Impact
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.community_impact}</p>
        </div>

        {/* Why It Matters */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Why It Matters
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.why_it_matters}</p>
        </div>

        {/* Severity (conditional) */}
        {result.severity_context && (
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertTriangle className="w-4 h-4" />
              Safety Note
            </div>
            <p className="text-sm text-red-300/80 leading-relaxed">{result.severity_context}</p>
          </div>
        )}

        {/* Actionable Tips */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            What You Can Do
          </div>
          <ul className="space-y-2">
            {result.actionable_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Related Topics */}
        {result.related_topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.related_topics.map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md"
                style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'rgb(196, 167, 255)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Spacer for footer */}
        <div className="h-4" />
      </div>

      {/* Footer actions */}
      <div className="p-5 pt-4 flex gap-3" style={{ background: 'rgba(10,14,20,0.98)', borderTop: '1px solid var(--border-glass)' }}>
        <button
          onClick={onSwitchToReport}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(34, 211, 238, 0.15)', color: 'rgb(34, 211, 238)', border: '1px solid rgba(34, 211, 238, 0.3)' }}
        >
          <FileText className="w-4 h-4" />
          Report This
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
