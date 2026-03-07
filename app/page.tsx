"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useScroll, useSpring, motion, useTransform } from "framer-motion";
import { useUser } from "@auth0/nextjs-auth0/client";
import Map, { type MapRef, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRef } from "react";
import NorthReportLogo from "@/components/landing/NorthReportLogo";
import PhoneFrame from "@/components/landing/PhoneFrame";
import { VisionScreen, PulseFeedScreen, AgentTrackerScreen } from "@/components/landing/PhoneScreens";

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const mapRef = useRef<MapRef>(null);
  const [bearing, setBearing] = useState(-20);

  // Global scroll tracking
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 25 });

  // Slow camera orbit for map
  useEffect(() => {
    const interval = setInterval(() => {
      setBearing((b) => (b + 0.03) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({ bearing, duration: 50, easing: (t: number) => t });
    }
  }, [bearing]);

  // Section-based transforms
  const mapPitch = useTransform(smoothProgress, [0, 0.2], [60, 0]);
  const mapOpacity = useTransform(smoothProgress, [0.75, 0.9], [0.3, 0]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);

  // Current section (0-4)
  const [activeSection, setActiveSection] = useState(0);
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (v) => {
      setActiveSection(Math.min(Math.floor(v * 5), 4));
    });
    return unsubscribe;
  }, [smoothProgress]);

  // 3D building layer
  const buildingLayerConfig = {
    id: "3d-buildings",
    source: "composite",
    "source-layer": "building",
    filter: ["==", "extrude", "true"] as ["==" | "!=", string, string],
    type: "fill-extrusion" as const,
    minzoom: 14,
    paint: {
      "fill-extrusion-color": "#1e293b",
      "fill-extrusion-height": ["get", "height"] as unknown as number,
      "fill-extrusion-base": ["get", "min_height"] as unknown as number,
      "fill-extrusion-opacity": 0.9,
    },
  };

  return (
    <main className="relative text-white" style={{ background: "var(--bg-base)" }}>
      {/* Total scroll height */}
      <div className="h-[500vh]" />

      {/* Fixed 3D Map Background */}
      <motion.div className="fixed inset-0 z-0" style={{ opacity: mapOpacity }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -79.87,
            latitude: 43.26,
            zoom: 15.5,
            pitch: 60,
            bearing: -20,
          }}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: "100%", height: "100%" }}
          interactive={false}
          attributionControl={false}
          pitch={mapPitch.get()}
        >
          <Layer {...buildingLayerConfig} />
        </Map>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to bottom, rgba(10,14,20,0.4) 0%, rgba(10,14,20,0.7) 60%, rgba(10,14,20,0.95) 100%),
              radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.1) 0%, transparent 50%)
            `,
          }}
        />
      </motion.div>

      {/* Fixed Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        style={{
          background: activeSection > 0 ? "rgba(10,14,20,0.9)" : "transparent",
          backdropFilter: activeSection > 0 ? "blur(20px)" : "none",
          borderBottom: activeSection > 0 ? "1px solid var(--border-hairline)" : "none",
          transition: "all 0.5s",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <NorthReportLogo size="md" />
          {isLoading ? null : user ? (
            <Link
              href="/feed"
              className="px-5 py-2.5 text-sm font-medium rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent-muted), rgba(34,211,238,0.1))",
                border: "1px solid rgba(34,211,238,0.3)",
                color: "var(--accent-primary)",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-medium rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* SECTION 1: THE DIGITAL TWIN (Hero) */}
      <motion.section
        className="fixed inset-0 flex items-center justify-center z-10"
        style={{ opacity: heroOpacity }}
      >
        <div className="text-center px-6 max-w-4xl">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NorthReportLogo size="lg" showText={false} />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              background: "linear-gradient(180deg, #fff 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Community Sees Everything.
            <br />
            <span style={{ color: "var(--accent-primary)" }}>Now It Understands.</span>
          </motion.h1>

          <motion.p
            className="text-lg text-gray-400 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            The City Operating System that turns neighborhood chatter into actionable intelligence.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-gray-600 tracking-wider uppercase">Scroll to Explore</span>
            <motion.div
              className="w-6 h-10 rounded-full border border-gray-700 flex justify-center pt-2"
              animate={{ borderColor: ["#374151", "#22D3EE", "#374151"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-2.5 rounded-full"
                style={{ background: "var(--accent-primary)" }}
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 2: THE ALL-SEEING EYE (Vision Demo) */}
      <FixedSection
        scrollProgress={smoothProgress}
        startRange={0.2}
        endRange={0.4}
      >
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 px-6 max-w-6xl mx-auto">
          <div className="max-w-md lg:order-1">
            <h2 className="text-3xl font-bold mb-4">
              Don&apos;t fill out forms.
              <br />
              <span className="text-cyan-400">Just point and shoot.</span>
            </h2>
            <p className="text-gray-400">
              Gemini Vision analyzes the hazard instantly. No typing required.
            </p>
          </div>
          <PhoneFrame className="lg:order-2">
            <VisionScreen />
          </PhoneFrame>
        </div>
      </FixedSection>

      {/* SECTION 3: THE PULSE (Community Feed) */}
      <FixedSection
        scrollProgress={smoothProgress}
        startRange={0.4}
        endRange={0.6}
      >
        <div className="flex flex-col lg:flex-row-reverse items-center justify-center gap-12 px-6 max-w-6xl mx-auto">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              One report is a complaint.
              <br />
              <span className="text-amber-400">Five reports is a pattern.</span>
            </h2>
            <p className="text-gray-400">
              NorthReport groups neighborhood data to find root causes, not just symptoms.
            </p>
          </div>
          <PhoneFrame>
            <PulseFeedScreen />
          </PhoneFrame>
        </div>
      </FixedSection>

      {/* SECTION 4: THE AGENT (Active Tracking) */}
      <FixedSection
        scrollProgress={smoothProgress}
        startRange={0.6}
        endRange={0.8}
      >
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 px-6 max-w-6xl mx-auto">
          <div className="max-w-md lg:order-1">
            <h2 className="text-3xl font-bold mb-4">
              We don&apos;t just report it.
              <br />
              <span className="text-green-400">We file it.</span>
            </h2>
            <p className="text-gray-400">
              Watch our AI agent navigate the city 311 site and track your ticket until it&apos;s fixed.
            </p>
          </div>
          <PhoneFrame className="lg:order-2">
            <AgentTrackerScreen />
          </PhoneFrame>
        </div>
      </FixedSection>

      {/* SECTION 5: THE GATEWAY (Auth/Footer) */}
      <FixedSection
        scrollProgress={smoothProgress}
        startRange={0.8}
        endRange={1.0}
      >
        <div className="text-center px-6 max-w-2xl mx-auto">
          {/* Fingerprint / Login visual */}
          <motion.div
            className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)",
              border: "1px solid rgba(34,211,238,0.3)",
              boxShadow: "0 0 60px rgba(34,211,238,0.2)",
            }}
            animate={{
              boxShadow: [
                "0 0 60px rgba(34,211,238,0.2)",
                "0 0 80px rgba(34,211,238,0.4)",
                "0 0 60px rgba(34,211,238,0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <circle cx="12" cy="21" r="1" fill="#22D3EE" />
            </svg>
          </motion.div>

          <h2 className="text-3xl font-bold mb-4">
            {user
              ? `Welcome back, ${user.name?.split(" ")[0] || "friend"}.`
              : "Sign In to Join Your Neighborhood"}
          </h2>

          <p className="text-gray-500 mb-8">
            {user
              ? "Your dashboard is ready."
              : "Be part of the community that sees, understands, and acts."}
          </p>

          {/* CTA Button */}
          <Link
            href={user ? "/feed" : "/auth/login"}
            className="inline-block px-12 py-4 text-lg font-semibold rounded-2xl transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              color: "#0A0E14",
              boxShadow: "0 0 40px var(--accent-glow), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {user ? "Enter Dashboard" : "Get Started"}
          </Link>

          {/* Footer */}
          <p className="mt-16 text-gray-600 text-sm">
            Built for <span className="text-gray-400">Waterloo</span>.
          </p>
        </div>
      </FixedSection>
    </main>
  );
}

// Fixed section wrapper with scroll-based visibility
function FixedSection({
  children,
  scrollProgress,
  startRange,
  endRange,
}: {
  children: React.ReactNode;
  scrollProgress: ReturnType<typeof useSpring>;
  startRange: number;
  endRange: number;
}) {
  const opacity = useTransform(
    scrollProgress,
    [startRange - 0.05, startRange, endRange - 0.05, endRange],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollProgress,
    [startRange - 0.05, startRange, endRange - 0.05, endRange],
    [60, 0, 0, -40]
  );

  return (
    <motion.section
      className="fixed inset-0 flex items-center justify-center z-10"
      style={{ opacity, y }}
    >
      {children}
    </motion.section>
  );
}
