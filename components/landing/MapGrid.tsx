"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

interface MapGridProps {
    scrollProgress: MotionValue<number>;
}

// Pulse signal positions (McMaster/Waterloo area)
const PULSE_SIGNALS = [
    { x: 35, y: 42, delay: 0, size: 1 },
    { x: 52, y: 38, delay: 0.3, size: 0.8 },
    { x: 45, y: 55, delay: 0.6, size: 1.2 },
    { x: 68, y: 48, delay: 0.15, size: 0.9 },
    { x: 28, y: 62, delay: 0.45, size: 1.1 },
    { x: 60, y: 65, delay: 0.75, size: 0.7 },
    { x: 40, y: 30, delay: 0.2, size: 1 },
    { x: 75, y: 35, delay: 0.55, size: 0.85 },
    { x: 22, y: 45, delay: 0.4, size: 1.15 },
    { x: 55, y: 72, delay: 0.65, size: 0.95 },
];

export default function MapGrid({ scrollProgress }: MapGridProps) {
    // Section visibility: 0.2 to 0.4 of total scroll
    const sectionStart = 0.2;
    const sectionEnd = 0.4;

    const opacity = useTransform(
        scrollProgress,
        [sectionStart - 0.05, sectionStart, sectionEnd - 0.05, sectionEnd],
        [0, 1, 1, 0]
    );

    const perspective = useTransform(
        scrollProgress,
        [sectionStart, sectionEnd],
        [0, 45]
    );

    const scale = useTransform(
        scrollProgress,
        [sectionStart, sectionEnd],
        [0.9, 1.1]
    );

    return (
        <section className="h-[200vh] relative">
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                {/* Aurora gradients */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
              radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(0, 212, 170, 0.08) 0%, transparent 40%)
            `,
                    }}
                />

                {/* Grid container with 3D perspective */}
                <motion.div
                    className="relative w-full max-w-4xl aspect-[4/3] mx-auto"
                    style={{
                        opacity,
                        scale,
                        rotateX: perspective,
                        transformStyle: "preserve-3d",
                        transformPerspective: "1000px",
                    }}
                >
                    {/* Grid background */}
                    <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            background: `
                linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)
              `,
                            backgroundSize: "40px 40px",
                            border: "1px solid rgba(99,102,241,0.2)",
                            boxShadow: "0 0 60px rgba(99,102,241,0.1), inset 0 0 60px rgba(0,0,0,0.5)",
                        }}
                    />

                    {/* Region label */}
                    <div
                        className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider"
                        style={{
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            color: "#a5b4fc",
                        }}
                    >
                        HAMILTON, ON · McMaster Zone
                    </div>

                    {/* Pulse signals */}
                    {PULSE_SIGNALS.map((signal, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${signal.x}%`,
                                top: `${signal.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: signal.delay + 0.5, duration: 0.4 }}
                        >
                            {/* Pulse ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    width: `${24 * signal.size}px`,
                                    height: `${24 * signal.size}px`,
                                    border: "1px solid #14b8a6",
                                    transform: "translate(-50%, -50%)",
                                }}
                                animate={{
                                    scale: [1, 2.5],
                                    opacity: [0.6, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: signal.delay,
                                }}
                            />
                            {/* Core dot */}
                            <div
                                className="rounded-full"
                                style={{
                                    width: `${8 * signal.size}px`,
                                    height: `${8 * signal.size}px`,
                                    background: "#14b8a6",
                                    boxShadow: "0 0 12px #14b8a6, 0 0 24px rgba(20,184,166,0.5)",
                                }}
                            />
                        </motion.div>
                    ))}

                    {/* Connection lines between nearby signals */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <motion.line
                            x1="35%" y1="42%" x2="45%" y2="55%"
                            stroke="rgba(20,184,166,0.3)" strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1, duration: 0.8 }}
                        />
                        <motion.line
                            x1="52%" y1="38%" x2="68%" y2="48%"
                            stroke="rgba(20,184,166,0.3)" strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                        />
                        <motion.line
                            x1="45%" y1="55%" x2="60%" y2="65%"
                            stroke="rgba(20,184,166,0.3)" strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.4, duration: 0.8 }}
                        />
                    </svg>
                </motion.div>

                {/* Text overlay */}
                <motion.div
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center"
                    style={{ opacity }}
                >
                    <p className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                        <span className="text-white">Connecting </span>
                        <span className="text-teal-400">500,000+</span>
                        <span className="text-white"> citizens.</span>
                    </p>
                    <p className="text-gray-500 text-lg">
                        Waterloo&apos;s pulse, visualized in real-time.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
