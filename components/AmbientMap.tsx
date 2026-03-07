'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AmbientMapProps {
    center?: [number, number];
    className?: string;
}

export default function AmbientMap({
    center = [-79.9192, 43.2557], // Waterloo default
    className = ''
}: AmbientMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const animationRef = useRef<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: center,
            zoom: 14.5,
            pitch: 60,
            bearing: 0,
            antialias: true,
            interactive: false, // Background only - no user interaction
        });

        map.current.on('load', () => {
            if (!map.current) return;
            setIsLoaded(true);

            // Add 3D buildings with dark styling
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers?.find(
                (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
            )?.id;

            map.current.addLayer(
                {
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 12,
                    paint: {
                        'fill-extrusion-color': '#1a2332',
                        'fill-extrusion-height': ['get', 'height'],
                        'fill-extrusion-base': ['get', 'min_height'],
                        'fill-extrusion-opacity': 0.8,
                    },
                },
                labelLayerId
            );

            // Start ambient animation
            startAmbientAnimation();
        });

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            map.current?.remove();
            map.current = null;
        };
    }, [center]);

    const startAmbientAnimation = () => {
        if (!map.current) return;

        let bearing = 0;
        const rotationSpeed = 0.02; // degrees per frame - very slow
        const panRadius = 0.002; // subtle pan radius
        let time = 0;

        const animate = () => {
            if (!map.current) return;

            time += 0.005;
            bearing += rotationSpeed;

            // Subtle figure-8 pan pattern
            const offsetLng = Math.sin(time) * panRadius;
            const offsetLat = Math.sin(time * 2) * panRadius * 0.5;

            map.current.easeTo({
                center: [center[0] + offsetLng, center[1] + offsetLat],
                bearing: bearing % 360,
                duration: 0,
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    return (
        <div className={`absolute inset-0 ${className}`}>
            <div ref={mapContainer} className="w-full h-full" />

            {/* Dark overlay for UI legibility */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                        linear-gradient(to bottom, 
                            rgba(10, 14, 20, 0.7) 0%, 
                            rgba(10, 14, 20, 0.4) 30%, 
                            rgba(10, 14, 20, 0.3) 70%, 
                            rgba(10, 14, 20, 0.8) 100%
                        )
                    `,
                }}
            />

            {/* Vignette effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    boxShadow: 'inset 0 0 150px 80px rgba(10, 14, 20, 0.7)',
                }}
            />

            {/* Loading state */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
                    <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
