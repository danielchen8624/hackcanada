"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

interface Phone3DProps {
    scrollProgress: MotionValue<number>;
    screen: "feed" | "voice" | "action";
}

export default function Phone3D({ scrollProgress, screen }: Phone3DProps) {
    // Phone transforms based on scroll
    const rotateY = useTransform(
        scrollProgress,
        [0.25, 0.35, 0.5, 0.6, 0.75],
        [15, 0, -15, 0, 15]
    );
    const scale = useTransform(
        scrollProgress,
        [0.2, 0.3, 0.7, 0.8],
        [0.8, 1, 1, 0.8]
    );

    return (
        <motion.div
            className="relative"
            style={{
                rotateY,
                scale,
                transformStyle: "preserve-3d",
                transformPerspective: "1200px",
            }}
        >
            {/* Phone frame */}
            <div
                className="relative w-[280px] h-[580px] md:w-[320px] md:h-[660px] rounded-[44px] p-3"
                style={{
                    background: "linear-gradient(145deg, #2a2a35 0%, #18181f 100%)",
                    boxShadow: `
            0 60px 120px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.1),
            0 0 40px rgba(20,184,166,0.15)
          `,
                }}
            >
                {/* Notch */}
                <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 rounded-full z-20"
                    style={{ background: "#0a0a0f" }}
                />

                {/* Screen */}
                <div
                    className="w-full h-full rounded-[36px] overflow-hidden relative"
                    style={{ background: "#0a0a0f" }}
                >
                    {screen === "feed" && <FeedScreen scrollProgress={scrollProgress} />}
                    {screen === "voice" && <VoiceScreen />}
                    {screen === "action" && <ActionScreen />}
                </div>

                {/* Side buttons */}
                <div
                    className="absolute -right-1.5 top-28 w-1.5 h-14 rounded-r-sm"
                    style={{ background: "linear-gradient(180deg, #3a3a45, #2a2a35)" }}
                />
                <div
                    className="absolute -left-1.5 top-36 w-1.5 h-20 rounded-l-sm"
                    style={{ background: "linear-gradient(180deg, #3a3a45, #2a2a35)" }}
                />
            </div>

            {/* Glow effect under phone */}
            <div
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-80 h-40 blur-3xl"
                style={{
                    background: "radial-gradient(ellipse, rgba(20,184,166,0.25) 0%, transparent 70%)",
                }}
            />
        </motion.div>
    );
}

// Feed Screen - Shows pulse feed UI
function FeedScreen({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const feedScrollY = useTransform(scrollProgress, [0.25, 0.45], [0, -200]);

    return (
        <div className="h-full flex flex-col">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-400">
                <span className="font-medium">9:41</span>
                <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    <span>Waterloo</span>
                </div>
            </div>

            {/* Header */}
            <div className="px-4 py-2 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-white">Community Feed</h1>
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                            background: "rgba(20,184,166,0.15)",
                            color: "#14b8a6",
                        }}
                    >
                        Live
                    </div>
                </div>
            </div>

            {/* Feed content */}
            <motion.div className="flex-1 overflow-hidden px-3 py-2" style={{ y: feedScrollY }}>
                {/* Hazard Report Card */}
                <FeedCard
                    type="hazard"
                    title="Pothole Detected"
                    location="James St N near Wilson"
                    time="2 min ago"
                    severity="medium"
                />

                {/* Community Story Card */}
                <FeedCard
                    type="story"
                    title="Community Cleanup Success!"
                    location="Gage Park"
                    time="15 min ago"
                    hasMedia
                />

                {/* Safety Alert Card */}
                <FeedCard
                    type="alert"
                    title="High-Risk Pattern Detected"
                    location="Downtown Core"
                    time="Just now"
                    severity="high"
                    isAI
                />

                {/* Another card */}
                <FeedCard
                    type="hazard"
                    title="Broken Streetlight"
                    location="Barton St E"
                    time="1 hr ago"
                    severity="low"
                />
            </motion.div>

            {/* Ask NorthReport button */}
            <div className="px-4 py-3 border-t border-white/5">
                <motion.button
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                        color: "#fff",
                    }}
                    animate={{ boxShadow: ["0 0 20px rgba(20,184,166,0.3)", "0 0 30px rgba(20,184,166,0.5)", "0 0 20px rgba(20,184,166,0.3)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    Ask NorthReport
                </motion.button>
            </div>
        </div>
    );
}

// Feed Card component
function FeedCard({
    type,
    title,
    location,
    time,
    severity,
    hasMedia,
    isAI,
}: {
    type: "hazard" | "story" | "alert";
    title: string;
    location: string;
    time: string;
    severity?: "low" | "medium" | "high";
    hasMedia?: boolean;
    isAI?: boolean;
}) {
    const colors = {
        hazard: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: "#f59e0b" },
        story: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)", icon: "#6366f1" },
        alert: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", icon: "#ef4444" },
    };

    return (
        <div
            className="rounded-xl p-3 mb-2"
            style={{
                background: colors[type].bg,
                border: `1px solid ${colors[type].border}`,
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${colors[type].icon}20` }}
                >
                    {type === "hazard" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    )}
                    {type === "story" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    )}
                    {type === "alert" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors[type].icon} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{title}</p>
                        {isAI && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-500/20 text-teal-400">
                                AI
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{location}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-600">{time}</span>
                        {severity && (
                            <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{
                                    background: severity === "high" ? "rgba(239,68,68,0.2)" : severity === "medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
                                    color: severity === "high" ? "#ef4444" : severity === "medium" ? "#f59e0b" : "#22c55e",
                                }}
                            >
                                {severity.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {hasMedia && (
                <div className="mt-2 h-24 rounded-lg bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </div>
            )}
        </div>
    );
}

// Voice Screen - Shows voice recording UI
function VoiceScreen() {
    return (
        <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Voice waveform visualization */}
            <div className="relative w-40 h-40 mb-8">
                {/* Outer rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-teal-500/30"
                        animate={{
                            scale: [1, 1.5 + i * 0.3],
                            opacity: [0.6, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                        }}
                    />
                ))}

                {/* Center mic button */}
                <div
                    className="absolute inset-0 m-auto w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                        boxShadow: "0 0 40px rgba(20,184,166,0.5)",
                    }}
                >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2" />
                        <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            {/* Voice transcript */}
            <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-lg text-white font-medium mb-2">
                    &ldquo;Hey NorthReport, there&apos;s a flood on King St.&rdquo;
                </p>
            </motion.div>

            {/* Processing state */}
            <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                    background: "rgba(20,184,166,0.15)",
                    border: "1px solid rgba(20,184,166,0.3)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <motion.div
                    className="w-2 h-2 rounded-full bg-teal-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-sm text-teal-400 font-medium">Creating Report...</span>
            </motion.div>

            {/* Waveform bars */}
            <div className="flex items-center gap-1 mt-8">
                {[...Array(16)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1 bg-teal-400/60 rounded-full"
                        animate={{
                            height: [4, 16 + Math.random() * 24, 4],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.05,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Action Screen - Shows cluster merging and 311 ticket
function ActionScreen() {
    return (
        <div className="h-full flex flex-col items-center justify-center px-4">
            {/* Cluster visualization */}
            <div className="relative w-48 h-48 mb-6">
                {/* Scattered pins merging to center */}
                {[
                    { x: -40, y: -30, delay: 0 },
                    { x: 50, y: -20, delay: 0.2 },
                    { x: -20, y: 40, delay: 0.4 },
                ].map((pin, i) => (
                    <motion.div
                        key={i}
                        className="absolute left-1/2 top-1/2 w-4 h-4"
                        initial={{ x: pin.x, y: pin.y, scale: 1 }}
                        animate={{ x: 0, y: 0, scale: 0 }}
                        transition={{ duration: 1.5, delay: pin.delay, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" fill="#f59e0b" className="w-4 h-4">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        </svg>
                    </motion.div>
                ))}

                {/* Big center cluster */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5, type: "spring" }}
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 rounded-full bg-teal-500/30"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                boxShadow: "0 0 30px rgba(20,184,166,0.5)",
                            }}
                        >
                            <span className="text-xl font-bold text-white">3</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 311 Ticket Card */}
            <motion.div
                className="w-full max-w-[260px] rounded-xl p-4"
                style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                }}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-sm font-semibold text-green-400">Auto-Filed</span>
                </div>
                <p className="text-white font-medium text-sm mb-1">
                    311 Ticket #HM-4829
                </p>
                <p className="text-gray-400 text-xs">
                    Critical Infrastructure Failure
                </p>
                <p className="text-gray-500 text-xs mt-2">
                    3 reports merged · King St / James St
                </p>
            </motion.div>

            {/* Copy */}
            <p className="text-center text-gray-500 text-xs mt-4 px-4">
                One strong voice is better than fifty whispers.
            </p>
        </div>
    );
}
