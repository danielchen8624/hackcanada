'use client';

import { Suspense, useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import { NEIGHBORHOODS } from '@/lib/constants';

const Map3D = dynamic(() => import('@/components/Map3D'), { ssr: false });

interface Hotspot {
  cellId: string;
  label: string;
  center: [number, number];
  count: number;
  topSeverity: string | null;
}

// Inner component that uses useSearchParams
function MapPageInner() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const locationQuery = searchParams.get('location');

  const [neighborhood, setNeighborhood] = useState('downtown-hamilton');
  const [criticalCount, setCriticalCount] = useState(0);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          if (data.neighborhood) setNeighborhood(data.neighborhood);
        }
      } catch {
        // ignore
      }
    }
    if (user) loadUser();
  }, [user]);

  // Fetch hotspots and critical count
  useEffect(() => {
    async function fetchHotspots() {
      try {
        const res = await fetch(`/api/hotspots?neighborhood=${neighborhood}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedHotspots = data.hotspots || [];
          setHotspots(fetchedHotspots);
          const critical = fetchedHotspots.filter((h: Hotspot) => h.topSeverity === 'critical')?.length || 0;
          setCriticalCount(critical);
        }
      } catch {
        // ignore
      }
    }
    fetchHotspots();
  }, [neighborhood]);

  // When location query param or hotspots change, find matching hotspot and fly to it
  useEffect(() => {
    if (!locationQuery || hotspots.length === 0) return;

    const normalizedQuery = locationQuery.toLowerCase().trim();

    // Find hotspot that matches the query (partial match)
    const matchingHotspot = hotspots.find(h => {
      const normalizedLabel = h.label.toLowerCase();
      return normalizedLabel.includes(normalizedQuery) || normalizedQuery.includes(normalizedLabel);
    });

    if (matchingHotspot) {
      setFlyToLocation(matchingHotspot.center);
    }
  }, [locationQuery, hotspots]);

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        <TopBar
          title="City Heatmap"
          neighborhood={neighborhood}
          onNeighborhoodChange={setNeighborhood}
          showSearch={true}
          liveCount={criticalCount}
        />

        <main className="flex-1 relative">
          <Map3D neighborhood={neighborhood} flyToLocation={flyToLocation} />
        </main>
      </div>
    </AppShell>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function MapPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex flex-col h-screen">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AppShell>
    }>
      <MapPageInner />
    </Suspense>
  );
}
