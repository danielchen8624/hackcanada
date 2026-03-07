'use client';

import type { ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';

interface StepDef {
  title: string;
  description: string;
  icon: ReactNode;
}

const steps: StepDef[] = [
  {
    title: 'Speak',
    description: 'Record what you see. NorthReport AI classifies it instantly.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
        <rect x="14" y="6" width="12" height="20" rx="6" />
        <path d="M10 22 a10 10 0 0 0 20 0" />
        <line x1="20" y1="32" x2="20" y2="36" />
        <line x1="14" y1="36" x2="26" y2="36" />
        <path d="M30 14 Q34 20 30 26" opacity="0.5" />
        <path d="M33 11 Q38 20 33 29" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: 'See Patterns',
    description: 'AI detects clusters, trends, and emerging hazards across your neighborhood.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
        <circle cx="10" cy="14" r="4" />
        <circle cx="30" cy="10" r="4" />
        <circle cx="20" cy="30" r="4" />
        <circle cx="34" cy="28" r="3" />
        <line x1="14" y1="14" x2="26" y2="10" opacity="0.5" />
        <line x1="10" y1="18" x2="18" y2="27" opacity="0.5" />
        <line x1="24" y1="30" x2="31" y2="28" opacity="0.5" />
        <line x1="30" y1="14" x2="33" y2="25" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Take Action',
    description: 'Auto-file 311 reports. Alert community leaders. Get results.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 8 L16 26 L8 18" />
        <rect x="4" y="4" width="32" height="32" rx="4" />
        <path d="M28 20 L28 32 L4 32 L4 8 L18 8" opacity="0.4" />
      </svg>
    ),
  },
];

function StepCard({
  step,
  index,
  progress,
}: {
  step: StepDef;
  index: number;
  progress: MotionValue<number>;
}) {
  const cardStart = 0.15 + index * 0.2;
  const opacity = useTransform(progress, [cardStart, cardStart + 0.18], [0, 1]);
  const y = useTransform(progress, [cardStart, cardStart + 0.18], [60, 0]);

  return (
    <motion.div
      className="rounded-2xl p-6 flex flex-col items-center text-center gap-4"
      style={{
        opacity,
        y,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(20,184,166,0.1)',
          border: '1px solid rgba(20,184,166,0.2)',
        }}
      >
        {step.icon}
      </div>
      <h3 className="text-lg font-semibold text-teal-400">{step.title}</h3>
      <p className="text-sm text-[#94a3b8] leading-relaxed">{step.description}</p>
    </motion.div>
  );
}

export default function HowItWorks({
  scrollY,
}: {
  scrollY: MotionValue<number>;
}) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const sectionStart = vh * 3.8;
  const sectionLength = vh * 1.0;

  const progress = useTransform(
    scrollY,
    [sectionStart, sectionStart + sectionLength],
    [0, 1]
  );

  const titleOpacity = useTransform(progress, [0, 0.15], [0, 1]);
  const titleY = useTransform(progress, [0, 0.15], [30, 0]);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
      <div className="w-full max-w-4xl px-6">
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center mb-10 text-[#e2e8f0]"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          How It Works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} progress={progress} />
          ))}
        </div>
      </div>
    </div>
  );
}
