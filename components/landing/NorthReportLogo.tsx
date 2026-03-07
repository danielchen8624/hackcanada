"use client";

interface NorthReportLogoProps {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

export default function NorthReportLogo({ size = "md", showText = true }: NorthReportLogoProps) {
    const sizes = {
        sm: { icon: 28, text: "text-lg" },
        md: { icon: 36, text: "text-xl" },
        lg: { icon: 48, text: "text-2xl" },
    };

    const { icon, text } = sizes[size];

    return (
        <div className="flex items-center gap-3">
            {/* Shield Icon with Pulse Line */}
            <svg
                width={icon}
                height={icon}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                    <linearGradient id="pulseGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                </defs>

                {/* Shield outline */}
                <path
                    d="M24 4L6 12V22C6 33.1 13.68 43.46 24 46C34.32 43.46 42 33.1 42 22V12L24 4Z"
                    stroke="url(#shieldGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Pulse/Heartbeat line through center */}
                <path
                    d="M10 24H16L19 18L22 30L26 20L29 26L32 24H38"
                    stroke="url(#pulseGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </svg>

            {/* Text */}
            {showText && (
                <span className={`font-semibold tracking-tight ${text}`}>
                    <span className="text-white font-bold">Safe</span>
                    <span className="text-indigo-400 font-medium">Pulse</span>
                </span>
            )}
        </div>
    );
}
