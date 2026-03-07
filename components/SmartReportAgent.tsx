'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentVoice } from '@/hooks/useAgentVoice';
import type { VoiceMode } from '@/hooks/useAgentVoice';
import { useVoiceControl } from '@/lib/voiceContext';
import {
  Camera,
  Upload,
  MapPin,
  StickyNote,
  ScanLine,
  Building2,
  AlertTriangle,
  Scale,
  FileText,
  CheckCircle2,
  ArrowRight,
  X,
  Shield,
  Loader2,
  Mic,
  Pencil,
} from 'lucide-react';


/* ─── Types ─── */
interface AgentAnalysis {
  hazard_detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  department: string;
  bylaw_reference: string;
  technical_description: string;
  spoken_response: string;
}

type Step = 'intake' | 'scanning' | 'consultation';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/15 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
};

/* ─── Subcomponents ─── */

function ScanOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px bg-cyan-400"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px bg-cyan-400"
            style={{ left: `${(i + 1) * 12.5}%` }}
          />
        ))}
      </div>

      {/* Sweeping scan bar */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_4px_rgba(34,211,238,0.4)]"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets */}
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
        <div
          key={pos}
          className={`absolute w-6 h-6 ${pos}`}
          style={{
            borderColor: 'rgba(34,211,238,0.6)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '4px',
            borderRight: pos.includes('left') ? 'none' : undefined,
            borderLeft: pos.includes('right') ? 'none' : undefined,
            borderBottom: pos.includes('top') ? 'none' : undefined,
            borderTop: pos.includes('bottom') ? 'none' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Voice Aura: Pulsing glassmorphism ring around agent card ─── */

function VoiceAura({ voiceMode }: { voiceMode: VoiceMode }) {
  return (
    <AnimatePresence>
      {voiceMode !== 'idle' && (
        <>
          {/* Outer pulsing ring */}
          <motion.div
            key="aura-outer"
            className="absolute -inset-3 rounded-3xl pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: voiceMode === 'listening' ? [0.3, 0.6, 0.3] : 0.4,
              scale: voiceMode === 'listening' ? [1, 1.02, 1] : 1,
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              border: '2px solid rgba(34, 211, 238, 0.4)',
              boxShadow:
                '0 0 30px rgba(34, 211, 238, 0.15), inset 0 0 30px rgba(34, 211, 238, 0.05)',
            }}
          />
          {/* Inner glow ring */}
          <motion.div
            key="aura-inner"
            className="absolute -inset-1.5 rounded-[20px] pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: voiceMode === 'listening' ? [0.2, 0.5, 0.2] : 0.3,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            style={{
              border: '1px solid rgba(34, 211, 238, 0.3)',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Voice HUD: Inline status indicator for voice interaction ─── */

function VoiceHUD({
  voiceMode,
  transcript,
}: {
  voiceMode: VoiceMode;
  transcript: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {voiceMode === 'idle' && (
        <motion.div
          key="voice-idle"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
        >
          <Mic className="w-4 h-4 text-white/30" />
          <p className="text-xs text-white/30">
            Say{' '}
            <span className="text-cyan-400/60 font-medium">
              &ldquo;Hey NorthReport&rdquo;
            </span>{' '}
            to speak with the agent
          </p>
        </motion.div>
      )}

      {voiceMode === 'listening' && (
        <motion.div
          key="voice-listening"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/30 space-y-2"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <p className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">
              Listening...
            </p>
            {/* Animated sound bars */}
            <div className="flex items-center gap-0.5 ml-auto">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-cyan-400 rounded-full"
                  animate={{ height: ['4px', '12px', '4px'] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
          {transcript && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-cyan-300/80 italic"
            >
              &ldquo;{transcript}&rdquo;
            </motion.p>
          )}
        </motion.div>
      )}

      {voiceMode === 'processing' && (
        <motion.div
          key="voice-processing"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 rounded-xl bg-blue-500/[0.08] border border-blue-500/30 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
              Processing command...
            </p>
          </div>
          {transcript && (
            <p className="text-sm text-blue-300/70 italic">
              &ldquo;{transcript}&rdquo;
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Component ─── */

export default function SmartReportAgent() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('intake');
  const [image, setImage] = useState<string | null>(null);
  const [address, setAddress] = useState('100 Main St W, Waterloo, ON');
  const [notes, setNotes] = useState('');
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [error, setError] = useState('');
  const [filingLoading, setFilingLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 43.2557, lng: -79.8711 });

  /* ── Pick up captured image/GPS from CaptureCamera via sessionStorage ── */
  useEffect(() => {
    const img = sessionStorage.getItem('capturedImage');
    if (img) {
      setImage(img);
      sessionStorage.removeItem('capturedImage');
    }
    const gps = sessionStorage.getItem('capturedGps');
    if (gps) {
      const { latitude, longitude } = JSON.parse(gps);
      setUserLocation({ lat: latitude, lng: longitude });
      sessionStorage.removeItem('capturedGps');
    }
  }, []);

  /* ── Pause global VoiceListener only during consultation (useAgentVoice takes over mic) ── */
  const { pauseVoice, resumeVoice } = useVoiceControl();
  const isConsulting = step === 'consultation' && analysis !== null;
  useEffect(() => {
    console.log('[SmartReportAgent] isConsulting:', isConsulting);
    if (isConsulting) {
      console.log('[SmartReportAgent] Calling pauseVoice()');
      pauseVoice();
    }
    else {
      console.log('[SmartReportAgent] Calling resumeVoice()');
      resumeVoice();
    }
  }, [isConsulting, pauseVoice, resumeVoice]);

  const handleAnalyzeRef = useRef<() => void>(() => { });

  const { voiceMode, transcript: voiceTranscript } = useAgentVoice({
    enabled: isConsulting,
    initialGreeting: analysis?.spoken_response ?? null,
    reportState: analysis
      ? {
        department: analysis.department,
        severity: analysis.severity,
        technical_description: analysis.technical_description,
        bylaw_reference: analysis.bylaw_reference,
      }
      : null,
    onRefine: (newDescription: string) => {
      setAnalysis((prev) =>
        prev ? { ...prev, technical_description: newDescription } : prev
      );
    },
    onFile: () => {
      handleFile();
    },
    onCancel: () => {
      setStep('intake');
      setAnalysis(null);
    },
    onAnalyze: () => {
      handleAnalyzeRef.current();
    },
  });

  /* ── Image upload ── */
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_097_152) {
      setError('Image must be under 2 MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Listen for global voice "analyze" event ── */
  useEffect(() => {
    const handler = () => { handleAnalyzeRef.current(); };
    window.addEventListener('northreport:analyze', handler);
    return () => { window.removeEventListener('northreport:analyze', handler); };
  }, []);

  /* ── Submit to AI ── */
  // Keep ref current for voice callback
  useEffect(() => { handleAnalyzeRef.current = handleAnalyze; });
  const handleAnalyze = async () => {
    if (!image) return;
    setStep('scanning');
    setError('');

    try {
      const res = await fetch('/api/gemini-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          userContext: notes || undefined,
          location: address,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data: AgentAnalysis = await res.json();
      setAnalysis(data);
      setStep('consultation');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('intake');
    }
  };

  /* ── Save Draft to Dashboard ── */
  const handleFile = async () => {
    if (!analysis) return;
    setFilingLoading(true);

    try {
      // Prefer capture-time GPS (from CaptureCamera sessionStorage handoff).
      // Fall back to a fresh reading only when no capture-time coords exist.
      let latitude = userLocation.lat;
      let longitude = userLocation.lng;

      const isDefault = latitude === 43.2557 && longitude === -79.8711;
      if (isDefault) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) {
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: analysis.technical_description,
          category: 'infrastructure',
          neighborhood: 'downtown-hamilton',
          latitude,
          longitude,
          imageBase64: image,
          status: 'draft',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Saving draft failed');
      }
      sessionStorage.setItem('newReportId', resData.id);

      // Redirect to dashboard to review and file
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Saving draft failed');
    } finally {
      setFilingLoading(false);
    }
  };

  /* ─── Transition wrapper ─── */
  const pageVariants = {
    initial: { opacity: 0, y: 24, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.97 },
  };

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <AnimatePresence mode="wait">
        {/* ─────────── STEP 1: INTAKE ─────────── */}
        {step === 'intake' && (
          <motion.div
            key="intake"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Header badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
                  Waterloo AI Agent
                </p>
                <p className="text-[11px] text-white/40">Smart City Intake System</p>
              </div>
            </div>

            {/* Glass card */}
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-6 space-y-5">
              {/* Image upload area */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                className="hidden"
              />

              {image ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={image}
                    alt="Captured hazard"
                    className="w-full max-h-56 object-cover"
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04] transition-all duration-300 flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] group-hover:bg-cyan-500/15 flex items-center justify-center transition-colors">
                    <Camera className="w-6 h-6 text-white/40 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">
                      Capture or Upload Photo
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      Take a photo of the hazard for AI analysis
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-white/25">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Camera
                    </span>
                    <span className="flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Gallery
                    </span>
                  </div>
                </button>
              )}

              {/* Address */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                  <MapPin className="w-3 h-3" /> Location
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
                  placeholder="Enter address..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                  <StickyNote className="w-3 h-3" /> Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all resize-none"
                  placeholder="Any extra context for the AI agent..."
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit button */}
              <button
                onClick={handleAnalyze}
                disabled={!image}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/20"
              >
                <ScanLine className="w-4 h-4" />
                Analyze with AI Agent
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────── STEP 2: SCANNING ─────────── */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-6">
              {/* Scanning image */}
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <img
                  src={image!}
                  alt="Scanning"
                  className="w-full max-h-72 object-cover"
                />
                <ScanOverlay />
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">
                    AI Agent Analyzing...
                  </p>
                  <p className="text-xs text-white/40">
                    Cross-referencing Waterloo bylaws & Ontario regulations
                  </p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mt-5 justify-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────── STEP 3: CONSULTATION ─────────── */}
        {step === 'consultation' && analysis && (
          <motion.div
            key="consultation"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-4 relative"
          >
            {/* Voice Aura rings */}
            <VoiceAura voiceMode={voiceMode} />

            {/* Agent header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
                {/* Voice active indicator dot */}
                {voiceMode !== 'idle' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400"
                    style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-cyan-400"
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
                  Agent Assessment
                </p>
                {voiceMode === 'listening' && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] text-cyan-300/60 font-medium"
                  >
                    Voice Active
                  </motion.span>
                )}
              </div>
            </div>

            {/* Image thumbnail */}
            <div className="rounded-xl overflow-hidden max-h-32">
              <img
                src={image!}
                alt="Analyzed"
                className="w-full h-32 object-cover opacity-60"
              />
            </div>

            {/* Findings card */}
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-5 space-y-4">
              {/* Severity badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${SEVERITY_COLORS[analysis.severity]}`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {analysis.severity} severity
                </span>
                <span className="text-xs text-white/30">
                  {analysis.hazard_detected ? 'Hazard Confirmed' : 'No Hazard'}
                </span>
              </div>

              {/* Department */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Building2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">
                    Department
                  </p>
                  <p className="text-sm text-white/90 font-medium mt-0.5">
                    {analysis.department}
                  </p>
                </div>
              </div>

              {/* Bylaw reference */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Scale className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">
                    Applicable Regulation
                  </p>
                  <p className="text-sm text-white/90 font-medium mt-0.5">
                    {analysis.bylaw_reference}
                  </p>
                </div>
              </div>

              {/* Technical description — editable */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">
                      Report Summary
                    </p>
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                      <Pencil className="w-2.5 h-2.5" /> Tap to edit
                    </span>
                  </div>
                  <motion.div
                    key={analysis.technical_description}
                    initial={{ backgroundColor: 'rgba(34, 211, 238, 0.15)' }}
                    animate={{ backgroundColor: 'rgba(34, 211, 238, 0)' }}
                    transition={{ duration: 1.5 }}
                    className="rounded-md mt-0.5 -mx-1"
                  >
                    <textarea
                      value={analysis.technical_description}
                      onChange={(e) =>
                        setAnalysis((prev) =>
                          prev ? { ...prev, technical_description: e.target.value } : prev
                        )
                      }
                      rows={3}
                      className="w-full bg-transparent text-sm text-white/70 leading-relaxed px-1 resize-none focus:outline-none focus:text-white/90 focus:ring-1 focus:ring-cyan-500/30 rounded-md transition-colors"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Spoken response preview */}
              <div className="p-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
                <p className="text-xs text-cyan-300/70 italic leading-relaxed">
                  &ldquo;{analysis.spoken_response}&rdquo;
                </p>
              </div>

              {/* Voice interaction HUD */}
              <VoiceHUD voiceMode={voiceMode} transcript={voiceTranscript} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('intake');
                  setAnalysis(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.1] transition-all"
              >
                Start Over
              </button>
              <button
                onClick={handleFile}
                disabled={filingLoading}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
              >
                {filingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save as 311 Draft
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
