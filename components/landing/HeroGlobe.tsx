"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { motion, useTransform, type MotionValue } from "framer-motion";

interface HeroGlobeProps {
    scrollProgress: MotionValue<number>;
}

export default function HeroGlobe({ scrollProgress }: HeroGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
    const phiRef = useRef(0);

    // Globe zoom and opacity based on scroll
    const scale = useTransform(scrollProgress, [0, 0.2], [1, 2.5]);
    const opacity = useTransform(scrollProgress, [0.15, 0.25], [1, 0]);
    const blur = useTransform(scrollProgress, [0.15, 0.25], [0, 20]);

    useEffect(() => {
        if (!canvasRef.current) return;

        let width = 0;
        const onResize = () => {
            if (canvasRef.current) {
                width = canvasRef.current.offsetWidth;
            }
        };
        window.addEventListener("resize", onResize);
        onResize();

        globeRef.current = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.1, 0.1, 0.15],
            markerColor: [0.08, 0.72, 0.65], // Teal #14b8a6
            glowColor: [0.05, 0.05, 0.1],
            markers: [
                // Waterloo, Ontario - highlighted
                { location: [43.26, -79.87], size: 0.08 },
                // Other cities for context
                { location: [43.65, -79.38], size: 0.04 }, // Toronto
                { location: [42.98, -81.25], size: 0.03 }, // London ON
                { location: [43.45, -80.49], size: 0.03 }, // Waterloo
            ],
            onRender: (state) => {
                // Auto-rotate
                state.phi = phiRef.current;
                phiRef.current += 0.003;
                state.width = width * 2;
                state.height = width * 2;
            },
        });

        return () => {
            globeRef.current?.destroy();
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <section className="h-[200vh] relative">
            {/* Fixed globe container */}
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                {/* Aurora gradient overlays */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
              radial-gradient(ellipse at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 100%, rgba(0, 212, 170, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 120%, rgba(99, 102, 241, 0.08) 0%, transparent 40%)
            `,
                    }}
                />

                {/* Globe */}
                <motion.div
                    className="relative"
                    style={{
                        scale,
                        opacity,
                        filter: useTransform(blur, (b) => `blur(${b}px)`),
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px]"
                        style={{
                            maxWidth: "90vw",
                            aspectRatio: "1 / 1",
                        }}
                    />
                    {/* Glow effect under globe */}
                    <div
                        className="absolute inset-0 -z-10 rounded-full blur-3xl"
                        style={{
                            background: "radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 60%)",
                            transform: "translateY(20%) scale(1.2)",
                        }}
                    />
                </motion.div>

                {/* Hero Text */}
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                    style={{ opacity }}
                >
                    <div className="text-center px-6 max-w-4xl mt-32">
                        <h1
                            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
                            style={{
                                background: "linear-gradient(180deg, #fff 0%, #94a3b8 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                textShadow: "0 0 80px rgba(20,184,166,0.3)",
                            }}
                        >
                            Your Community
                            <br />
                            Sees Everything.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide">
                            Now It <span className="text-teal-400 font-medium">Understands</span>.
                        </p>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    style={{ opacity: useTransform(scrollProgress, [0, 0.1], [1, 0]) }}
                >
                    <span className="text-xs text-gray-500 tracking-[0.2em] uppercase">
                        Scroll to Dive In
                    </span>
                    <motion.div
                        className="w-5 h-8 rounded-full border border-gray-600 flex justify-center pt-2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.div
                            className="w-1 h-2 bg-teal-400 rounded-full"
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
