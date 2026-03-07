"use client";

import { useEffect, useRef, useState } from "react";
import Map, { type MapRef, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, useTransform, type MotionValue } from "framer-motion";

interface WaterlooHeroProps {
    scrollProgress: MotionValue<number>;
}

// Random pulse locations around Waterloo
const PULSE_SIGNALS = [
    { lng: -79.866, lat: 43.256, delay: 0 },
    { lng: -79.877, lat: 43.252, delay: 2 },
    { lng: -79.870, lat: 43.260, delay: 4 },
    { lng: -79.860, lat: 43.250, delay: 1 },
    { lng: -79.880, lat: 43.258, delay: 3 },
    { lng: -79.855, lat: 43.262, delay: 5 },
];

export default function WaterlooHero({ scrollProgress }: WaterlooHeroProps) {
    const mapRef = useRef<MapRef>(null);
    const [bearing, setBearing] = useState(-20);
    const [activePulses, setActivePulses] = useState<number[]>([]);

    // Map opacity based on scroll
    const mapOpacity = useTransform(scrollProgress, [0.2, 0.3], [1, 0.3]);

    // Slow camera orbit
    useEffect(() => {
        const interval = setInterval(() => {
            setBearing((b) => (b + 0.05) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Update map bearing
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.easeTo({
                bearing,
                duration: 50,
                easing: (t: number) => t,
            });
        }
    }, [bearing]);

    // Random pulse signals
    useEffect(() => {
        const addPulse = () => {
            const idx = Math.floor(Math.random() * PULSE_SIGNALS.length);
            setActivePulses((prev) => [...prev.slice(-5), idx]);
        };
        const interval = setInterval(addPulse, 2000);
        addPulse();
        return () => clearInterval(interval);
    }, []);

    // 3D building layer configuration
    const buildingLayerConfig = {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"] as ["==" | "!=" | ">" | "<" | ">=" | "<=", string, string | number | boolean],
        type: "fill-extrusion" as const,
        minzoom: 14,
        paint: {
            "fill-extrusion-color": "#1e293b",
            "fill-extrusion-height": ["get", "height"] as unknown as number,
            "fill-extrusion-base": ["get", "min_height"] as unknown as number,
            "fill-extrusion-opacity": 0.8,
        },
    };

    return (
        <motion.div
            className="fixed inset-0 z-0"
            style={{ opacity: mapOpacity }}
        >
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
            >
                {/* 3D Buildings */}
                <Layer {...buildingLayerConfig} />

                {/* Pulse signals as GeoJSON */}
                <Source
                    type="geojson"
                    data={{
                        type: "FeatureCollection",
                        features: activePulses.map((idx) => ({
                            type: "Feature" as const,
                            geometry: {
                                type: "Point" as const,
                                coordinates: [PULSE_SIGNALS[idx].lng, PULSE_SIGNALS[idx].lat],
                            },
                            properties: {},
                        })),
                    }}
                >
                    <Layer
                        id="pulse-signals"
                        type="circle"
                        paint={{
                            "circle-radius": 12,
                            "circle-color": "#14b8a6",
                            "circle-opacity": 0.6,
                            "circle-blur": 0.8,
                        }}
                    />
                    <Layer
                        id="pulse-signals-glow"
                        type="circle"
                        paint={{
                            "circle-radius": 24,
                            "circle-color": "#14b8a6",
                            "circle-opacity": 0.2,
                            "circle-blur": 1,
                        }}
                    />
                </Source>
            </Map>

            {/* Dark gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
            linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.6) 50%, rgba(10,10,15,0.9) 100%),
            radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.08) 0%, transparent 50%)
          `,
                }}
            />
        </motion.div>
    );
}
