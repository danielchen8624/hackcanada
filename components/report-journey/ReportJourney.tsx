'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { motion, AnimatePresence } from 'framer-motion';
import along from '@turf/along';
import length from '@turf/length';
import bearing from '@turf/bearing';
import { lineString, point } from '@turf/helpers';
import EnvelopeMarker from './EnvelopeMarker';
import MilestonePopup from './MilestonePopup';
import { CheckCircle2, MapPin, Zap, Building2, Package } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location {
    lat: number;
    lng: number;
}

interface Destination extends Location {
    name: string;
}

interface ReportJourneyProps {
    reportLocation: Location;
    destination?: Destination;
    reportType: string;
    onComplete: () => void;
    isVisible: boolean;
}

interface MilestoneData {
    progress: number;
    icon: React.ReactNode;
    label: string;
    position: [number, number] | null;
    reached: boolean;
}

const HAMILTON_CITY_HALL: Destination = {
    lat: 43.2557,
    lng: -79.8711,
    name: 'Waterloo City Hall',
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Static milestone definitions (must live outside component to avoid
// re-creating on every render and breaking the useEffect dep chain)
const MILESTONE_DEFS: { progress: number; icon: React.ReactNode; label: string }[] = [
    { progress: 0, icon: <MapPin size={14} />, label: 'Report Filed' },
    { progress: 0.3, icon: <Zap size={14} />, label: 'AI Analysis Complete' },
    { progress: 0.6, icon: <Building2 size={14} />, label: 'Routed to City Hall' },
    { progress: 0.9, icon: <Package size={14} />, label: 'Arriving Soon' },
];

// Timing constants (ms)
const ZOOM_OUT_DURATION = 1500;
const ROUTE_DRAW_DURATION = 800;
const TRAVEL_DURATION = 6000;
const ARRIVAL_DELAY = 500;

// Easing function
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Shortest-path angular interpolation that handles the 360↔0 wraparound
function lerpAngle(from: number, to: number, t: number): number {
    let diff = ((to - from + 540) % 360) - 180; // normalise to [-180, 180]
    return from + diff * t;
}

// Create curved fallback route
function createCurvedRoute(
    start: [number, number],
    end: [number, number]
): [number, number][] {
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const perpX = -dy * 0.15;
    const perpY = dx * 0.15;
    const controlPoint: [number, number] = [midX + perpX, midY + perpY];

    const points: [number, number][] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x =
            (1 - t) * (1 - t) * start[0] +
            2 * (1 - t) * t * controlPoint[0] +
            t * t * end[0];
        const y =
            (1 - t) * (1 - t) * start[1] +
            2 * (1 - t) * t * controlPoint[1] +
            t * t * end[1];
        points.push([x, y]);
    }
    return points;
}

export default function ReportJourney({
    reportLocation,
    destination = HAMILTON_CITY_HALL,
    reportType,
    onComplete,
    isVisible,
}: ReportJourneyProps) {
    const mapRef = useRef<MapRef | null>(null);
    const animationRef = useRef<number | null>(null);
    const phaseStartRef = useRef<number>(0);
    const smoothBearingRef = useRef<number | null>(null);
    const smoothPosRef = useRef<[number, number] | null>(null);
    const smoothCamRef = useRef<[number, number] | null>(null);

    const [phase, setPhase] = useState<'init' | 'zoomOut' | 'drawRoute' | 'travel' | 'arrival'>('init');
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [envelopePosition, setEnvelopePosition] = useState<[number, number]>([
        reportLocation.lng,
        reportLocation.lat,
    ]);
    const [envelopeRotation, setEnvelopeRotation] = useState(0);
    const [routeProgress, setRouteProgress] = useState(0);
    const [showArrivalCard, setShowArrivalCard] = useState(false);
    const [arrivalBurst, setArrivalBurst] = useState(false);

    const [milestones, setMilestones] = useState<MilestoneData[]>(() =>
        MILESTONE_DEFS.map((d) => ({
            ...d,
            position: null,
            reached: false,
        }))
    );

    const [viewState, setViewState] = useState({
        longitude: reportLocation.lng,
        latitude: reportLocation.lat,
        zoom: 16,
        pitch: 60,
        bearing: 0,
    });

    // Fetch route from Mapbox Directions API
    const fetchRoute = useCallback(async (): Promise<[number, number][]> => {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${reportLocation.lng},${reportLocation.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) throw new Error('Directions API failed');
            const data = await res.json();
            if (data.routes?.[0]) {
                console.log('[ReportJourney] Route fetched:', data.routes[0].geometry.coordinates.length, 'points');
                return data.routes[0].geometry.coordinates;
            }
            throw new Error('No route found');
        } catch (err) {
            console.warn('[ReportJourney] Using fallback route:', err);
            return createCurvedRoute(
                [reportLocation.lng, reportLocation.lat],
                [destination.lng, destination.lat]
            );
        }
    }, [reportLocation, destination]);

    // Calculate milestone positions along route
    // Uses MILESTONE_DEFS (module constant) instead of milestones state so
    // this callback reference stays stable and doesn't restart the animation effect.
    const calculateMilestonePositions = useCallback(
        (coords: [number, number][]): MilestoneData[] => {
            const line = lineString(coords);
            const totalLength = length(line, { units: 'kilometers' });
            return MILESTONE_DEFS.map((d) => {
                const distanceAlong = totalLength * d.progress;
                const pt = along(line, distanceAlong, { units: 'kilometers' });
                return {
                    ...d,
                    position: pt.geometry.coordinates as [number, number],
                    reached: false,
                };
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // Initialize and run animation sequence
    useEffect(() => {
        if (!isVisible) return;

        let isCancelled = false;

        const runSequence = async () => {
            // Fetch route
            const coords = await fetchRoute();
            if (isCancelled) return;

            setRouteCoords(coords);
            const updatedMilestones = calculateMilestonePositions(coords);
            setMilestones(updatedMilestones);

            // Calculate center and bearing for zoom out
            const centerLng = (reportLocation.lng + destination.lng) / 2;
            const centerLat = (reportLocation.lat + destination.lat) / 2;
            const initialBearing = bearing(
                point([reportLocation.lng, reportLocation.lat]),
                point([destination.lng, destination.lat])
            );

            // Phase 1: Zoom out
            setPhase('zoomOut');
            const zoomOutStart = performance.now();

            const animateZoomOut = (time: number) => {
                if (isCancelled) return;
                const elapsed = time - zoomOutStart;
                const t = Math.min(elapsed / ZOOM_OUT_DURATION, 1);
                const eased = easeInOutCubic(t);

                setViewState({
                    longitude: reportLocation.lng + (centerLng - reportLocation.lng) * eased,
                    latitude: reportLocation.lat + (centerLat - reportLocation.lat) * eased,
                    zoom: 16 - 3 * eased, // 16 -> 13
                    pitch: 60 - 15 * eased, // 60 -> 45
                    bearing: initialBearing * eased,
                });

                if (t < 1) {
                    animationRef.current = requestAnimationFrame(animateZoomOut);
                } else {
                    startRouteDrawing();
                }
            };

            animationRef.current = requestAnimationFrame(animateZoomOut);

            // Phase 2: Draw route line
            const startRouteDrawing = () => {
                if (isCancelled) return;
                setPhase('drawRoute');
                phaseStartRef.current = performance.now();

                const animateRouteDraw = (time: number) => {
                    if (isCancelled) return;
                    const elapsed = time - phaseStartRef.current;
                    const t = Math.min(elapsed / ROUTE_DRAW_DURATION, 1);
                    setRouteProgress(easeInOutCubic(t));

                    if (t < 1) {
                        animationRef.current = requestAnimationFrame(animateRouteDraw);
                    } else {
                        startTravel(coords);
                    }
                };

                animationRef.current = requestAnimationFrame(animateRouteDraw);
            };

            // Phase 3: Travel along route
            const startTravel = (routePoints: [number, number][]) => {
                if (isCancelled) return;
                setPhase('travel');
                phaseStartRef.current = performance.now();
                smoothBearingRef.current = null;
                smoothPosRef.current = null;
                smoothCamRef.current = null;

                // Mark first milestone as reached
                setMilestones((prev) => prev.map((m, i) => (i === 0 ? { ...m, reached: true } : m)));

                const line = lineString(routePoints);
                const totalLen = length(line, { units: 'kilometers' });

                // --- Smoothing tunables ---
                // Position lerp per frame (lower = silkier glide, 0.12 feels floaty-smooth)
                const POS_LERP = 0.12;
                // Bearing lerp per frame (lower = more gradual turns)
                const BEARING_LERP = 0.06;
                // Camera position lerp (trails behind the van slightly)
                const CAM_POS_LERP = 0.08;
                // Camera bearing lerp
                const CAM_BEARING_LERP = 0.04;
                // How far ahead to look for bearing calc (% of total route)
                const LOOK_AHEAD_KM = Math.max(0.35, totalLen * 0.06);

                const animateTravel = (time: number) => {
                    if (isCancelled) return;
                    const elapsed = time - phaseStartRef.current;
                    const t = Math.min(elapsed / TRAVEL_DURATION, 1);
                    const eased = easeInOutCubic(t);

                    // Raw target position from turf
                    const distanceAlong = totalLen * eased;
                    const currentPt = along(line, distanceAlong, { units: 'kilometers' });
                    const rawPos = currentPt.geometry.coordinates as [number, number];

                    // Smooth position — lerp from previous frame's position
                    if (smoothPosRef.current === null) {
                        smoothPosRef.current = rawPos;
                    } else {
                        smoothPosRef.current = [
                            smoothPosRef.current[0] + (rawPos[0] - smoothPosRef.current[0]) * POS_LERP,
                            smoothPosRef.current[1] + (rawPos[1] - smoothPosRef.current[1]) * POS_LERP,
                        ];
                    }
                    setEnvelopePosition(smoothPosRef.current);

                    // Target bearing via generous look-ahead
                    const nextDistance = Math.min(distanceAlong + LOOK_AHEAD_KM, totalLen);
                    const nextPt = along(line, nextDistance, { units: 'kilometers' });
                    const nextPos = nextPt.geometry.coordinates as [number, number];
                    const targetBearing = bearing(point(rawPos), point(nextPos));

                    // Smooth bearing
                    if (smoothBearingRef.current === null) {
                        smoothBearingRef.current = targetBearing;
                    } else {
                        smoothBearingRef.current = lerpAngle(
                            smoothBearingRef.current,
                            targetBearing,
                            BEARING_LERP
                        );
                    }
                    setEnvelopeRotation(smoothBearingRef.current);

                    // Smooth camera — trails slightly behind the van
                    if (smoothCamRef.current === null) {
                        smoothCamRef.current = smoothPosRef.current;
                    } else {
                        smoothCamRef.current = [
                            smoothCamRef.current[0] + (smoothPosRef.current[0] - smoothCamRef.current[0]) * CAM_POS_LERP,
                            smoothCamRef.current[1] + (smoothPosRef.current[1] - smoothCamRef.current[1]) * CAM_POS_LERP,
                        ];
                    }

                    setViewState((prev) => ({
                        ...prev,
                        longitude: smoothCamRef.current![0],
                        latitude: smoothCamRef.current![1],
                        bearing: lerpAngle(prev.bearing, smoothBearingRef.current!, CAM_BEARING_LERP),
                    }));

                    // Check milestones
                    setMilestones((prev) =>
                        prev.map((m) => (eased >= m.progress && !m.reached ? { ...m, reached: true } : m))
                    );

                    if (t < 1) {
                        animationRef.current = requestAnimationFrame(animateTravel);
                    } else {
                        finishArrival();
                    }
                };

                animationRef.current = requestAnimationFrame(animateTravel);
            };

            // Phase 4: Arrival
            const finishArrival = () => {
                if (isCancelled) return;
                setPhase('arrival');
                setEnvelopePosition([destination.lng, destination.lat]);

                setTimeout(() => {
                    if (isCancelled) return;
                    setArrivalBurst(true);
                    setTimeout(() => {
                        if (isCancelled) return;
                        setShowArrivalCard(true);
                    }, 400);
                }, ARRIVAL_DELAY);
            };
        };

        runSequence();

        return () => {
            isCancelled = true;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isVisible, fetchRoute, calculateMilestonePositions, reportLocation, destination]);

    // Add 3D buildings on map load
    const handleMapLoad = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        if (!map.getLayer('3d-buildings')) {
            map.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 13,
                paint: {
                    'fill-extrusion-color': '#1a1a2e',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.7,
                },
            });
        }
    }, []);

    if (!isVisible) return null;

    // Create partial route for drawing animation
    const displayedRouteCoords =
        routeCoords.length > 1
            ? routeCoords.slice(0, Math.max(2, Math.floor(routeCoords.length * routeProgress)))
            : [];

    const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> | null =
        displayedRouteCoords.length > 1
            ? {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: displayedRouteCoords },
            }
            : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
                style={{ background: '#0a0f19' }}
            >
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    scrollZoom={false}
                    dragPan={false}
                    dragRotate={false}
                    touchZoomRotate={false}
                    keyboard={false}
                    doubleClickZoom={false}
                    onLoad={handleMapLoad}
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* Route glow layer */}
                    {routeGeoJson && (
                        <Source id="route-glow" type="geojson" data={routeGeoJson}>
                            <Layer
                                id="route-glow-layer"
                                type="line"
                                paint={{
                                    'line-color': '#14b8a6',
                                    'line-width': 14,
                                    'line-opacity': 0.15,
                                    'line-blur': 10,
                                }}
                            />
                        </Source>
                    )}

                    {/* Route main line */}
                    {routeGeoJson && (
                        <Source id="route" type="geojson" data={routeGeoJson}>
                            <Layer
                                id="route-layer"
                                type="line"
                                paint={{
                                    'line-color': '#14b8a6',
                                    'line-width': 4,
                                    'line-opacity': 0.9,
                                }}
                            />
                        </Source>
                    )}

                    {/* Start marker */}
                    <Marker longitude={reportLocation.lng} latitude={reportLocation.lat} anchor="center">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    background: '#14b8a6',
                                    boxShadow: '0 0 20px rgba(20, 184, 166, 0.6)',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -32,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                    background: 'rgba(10, 15, 25, 0.92)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'white',
                                }}
                            >
                                Your Report
                            </div>
                        </div>
                    </Marker>

                    {/* Destination marker */}
                    <Marker longitude={destination.lng} latitude={destination.lat} anchor="center">
                        <div className="relative">
                            {arrivalBurst && (
                                <>
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0.8 }}
                                        animate={{ scale: 3.5, opacity: 0 }}
                                        transition={{ duration: 0.7 }}
                                        style={{
                                            position: 'absolute',
                                            inset: -10,
                                            borderRadius: '50%',
                                            border: '2px solid #22c55e',
                                        }}
                                    />
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0.6 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        style={{
                                            position: 'absolute',
                                            inset: -10,
                                            borderRadius: '50%',
                                            border: '2px solid #22c55e',
                                        }}
                                    />
                                </>
                            )}
                            <motion.div
                                animate={arrivalBurst ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: arrivalBurst ? '#22c55e' : 'rgba(10, 15, 25, 0.9)',
                                    border: '2px solid',
                                    borderColor: arrivalBurst ? '#22c55e' : '#14b8a6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: arrivalBurst
                                        ? '0 0 24px rgba(34, 197, 94, 0.5)'
                                        : '0 0 16px rgba(20, 184, 166, 0.4)',
                                }}
                            >
                                {arrivalBurst ? (
                                    <CheckCircle2 size={18} color="white" />
                                ) : (
                                    <span style={{ fontSize: 14 }}>🏛️</span>
                                )}
                            </motion.div>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -32,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                    background: 'rgba(10, 15, 25, 0.92)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'white',
                                }}
                            >
                                {destination.name}
                            </div>
                        </div>
                    </Marker>

                    {/* Envelope marker */}
                    {phase !== 'init' && phase !== 'arrival' && (
                        <Marker longitude={envelopePosition[0]} latitude={envelopePosition[1]} anchor="center">
                            <div style={{ zIndex: 50, position: 'relative' }}>
                                <EnvelopeMarker rotation={envelopeRotation - 90} visible={true} />
                            </div>
                        </Marker>
                    )}

                    {/* Milestone popups */}
                    {milestones.map(
                        (m, i) =>
                            m.position && (
                                <Marker key={i} longitude={m.position[0]} latitude={m.position[1]} anchor="bottom">
                                    <MilestonePopup icon={m.icon} label={m.label} visible={m.reached} />
                                </Marker>
                            )
                    )}
                </Map>

                {/* Arrival Card */}
                <AnimatePresence>
                    {showArrivalCard && (
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed bottom-0 left-0 right-0 z-50"
                            style={{
                                background: 'rgba(10, 15, 25, 0.95)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                borderTopLeftRadius: 28,
                                borderTopRightRadius: 28,
                                padding: '28px 24px',
                                paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
                                    }}
                                >
                                    <CheckCircle2 size={32} color="white" />
                                </motion.div>

                                <h2
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: 'white',
                                        marginBottom: 6,
                                    }}
                                >
                                    Report Delivered
                                </h2>
                                <p
                                    style={{
                                        fontSize: 15,
                                        color: '#9ca3af',
                                    }}
                                >
                                    {reportType} → {destination.name}
                                </p>
                            </div>

                            <button
                                onClick={onComplete}
                                style={{
                                    width: '100%',
                                    padding: '16px 32px',
                                    borderRadius: 14,
                                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 24px rgba(20, 184, 166, 0.3)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                Done
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
