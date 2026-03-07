"use client";

import { motion } from "framer-motion";

// Screen 1: Camera/Vision Demo with scanning animation
export function VisionScreen() {
    return (
        <div className="h-full flex flex-col bg-[#0a0a0f]">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-500">
                <span className="font-medium">9:41</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-2 rounded-sm border border-gray-500 flex items-center justify-end pr-0.5">
                        <div className="w-2 h-1 bg-green-400 rounded-sm" />
                    </div>
                </div>
            </div>

            {/* Camera viewfinder */}
            <div className="flex-1 px-4 flex flex-col">
                <div className="relative flex-1 rounded-2xl overflow-hidden bg-gray-900">
                    {/* Simulated sidewalk crack image */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `
                linear-gradient(135deg, #3a3a45 0%, #2a2a35 50%, #3a3a45 100%),
                repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)
              `,
                        }}
                    >
                        {/* Crack pattern */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                                d="M30 20 L35 40 L32 60 L38 80"
                                stroke="#1a1a22"
                                strokeWidth="3"
                                fill="none"
                            />
                            <path
                                d="M33 45 L45 50 L50 55"
                                stroke="#1a1a22"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                    </div>

                    {/* Scanning beam */}
                    <motion.div
                        className="absolute left-0 right-0 h-1"
                        style={{
                            background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
                            boxShadow: "0 0 30px #22d3ee, 0 0 60px rgba(34,211,238,0.5)",
                        }}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Bounding box detection */}
                    <motion.div
                        className="absolute top-[25%] left-[20%] w-[60%] h-[50%] rounded-lg"
                        style={{
                            border: "2px solid #22c55e",
                            boxShadow: "0 0 20px rgba(34,197,94,0.3)",
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                    >
                        {/* Corner brackets */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400" />
                    </motion.div>

                    {/* Detection label */}
                    <motion.div
                        className="absolute bottom-4 left-4 right-4 p-3 rounded-xl"
                        style={{
                            background: "rgba(0,0,0,0.8)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(34,197,94,0.3)",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-green-400 text-xs font-semibold">HAZARD DETECTED</span>
                        </div>
                        <TypewriterText
                            text="Infrastructure / Trip Risk / Severity: High"
                            delay={2.5}
                        />
                    </motion.div>
                </div>

                {/* Capture button */}
                <div className="py-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Screen 2: Community Feed with trend alert
export function PulseFeedScreen() {
    return (
        <div className="h-full flex flex-col bg-[#0a0a0f]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-white">Community Feed</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400">Live</span>
                    </div>
                </div>
            </div>

            {/* Feed items */}
            <div className="flex-1 overflow-hidden px-4 py-3">
                {/* Trend Alert - pops out */}
                <motion.div
                    className="mb-3 p-4 rounded-xl"
                    style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                        border: "1px solid rgba(245,158,11,0.3)",
                    }}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M13 17h8l-2.6-2.6A9 9 0 0 0 13 3c-3 0-5.68 1.46-7.35 3.71" />
                            <path d="M11 7H3l2.6 2.6A9 9 0 0 0 11 21c3 0 5.68-1.46 7.35-3.71" />
                        </svg>
                        <span className="text-amber-400 text-xs font-semibold">TREND ALERT</span>
                    </div>
                    <p className="text-white text-sm font-medium">5 Potholes reported on Main St</p>
                    <p className="text-gray-500 text-xs mt-1">in the last 24 hours</p>
                </motion.div>

                {/* Regular feed items */}
                {[
                    { type: "hazard", title: "Sidewalk crack", time: "12m", severity: "medium" },
                    { type: "story", title: "Park cleanup complete!", time: "1h" },
                    { type: "hazard", title: "Broken streetlight", time: "2h", severity: "high" },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="mb-2 p-3 rounded-xl"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 + i * 0.3 }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white text-sm">{item.title}</span>
                            <span className="text-gray-600 text-xs">{item.time}</span>
                        </div>
                        {item.severity && (
                            <span
                                className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                                style={{
                                    background: item.severity === "high" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                                    color: item.severity === "high" ? "#ef4444" : "#f59e0b",
                                }}
                            >
                                {item.severity.toUpperCase()}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// Screen 3: Agent Tracker progress
export function AgentTrackerScreen() {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0f] px-6">
            <h2 className="text-white text-lg font-semibold mb-8">Ticket Progress</h2>

            {/* Progress steps */}
            <div className="w-full max-w-[260px] space-y-4">
                <ProgressStep
                    icon="thinking"
                    label="Analyzing report..."
                    status="complete"
                    delay={0}
                />
                <ProgressStep
                    icon="filing"
                    label="Auto-Filing to Waterloo.ca..."
                    status="complete"
                    delay={1.5}
                />
                <ProgressStep
                    icon="confirmed"
                    label="Confirmation Received"
                    sublabel="#CITY-4921"
                    status="active"
                    delay={3}
                />
            </div>

            {/* Ticket card */}
            <motion.div
                className="mt-8 w-full max-w-[260px] p-4 rounded-xl"
                style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 4, type: "spring" }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-green-400 font-semibold text-sm">Ticket Confirmed</span>
                </div>
                <p className="text-white text-sm">#CITY-4921</p>
                <p className="text-gray-500 text-xs mt-1">Waterloo 311 • Infrastructure</p>
            </motion.div>
        </div>
    );
}

// Typewriter text effect
function TypewriterText({ text, delay }: { text: string; delay: number }) {
    return (
        <motion.p
            className="text-gray-300 text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
        >
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + i * 0.03 }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.p>
    );
}

// Progress step component
function ProgressStep({
    icon,
    label,
    sublabel,
    status,
    delay,
}: {
    icon: "thinking" | "filing" | "confirmed";
    label: string;
    sublabel?: string;
    status: "pending" | "complete" | "active";
    delay: number;
}) {
    return (
        <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    background: status === "active" ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)",
                    border: `1px solid ${status === "active" ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.4)"}`,
                }}
            >
                {icon === "thinking" && (
                    <motion.div
                        className="w-2 h-2 rounded-full bg-indigo-400"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: status === "pending" ? Infinity : 0 }}
                    />
                )}
                {icon === "filing" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                )}
                {icon === "confirmed" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </div>
            <div>
                <p className="text-white text-sm">{label}</p>
                {sublabel && <p className="text-green-400 text-xs font-mono">{sublabel}</p>}
            </div>
        </motion.div>
    );
}
