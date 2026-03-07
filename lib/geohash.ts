import ngeohash from 'ngeohash';

// 6-char geohash ≈ ±0.6km precision
const PRECISION = 6;

export function encodeGeohash(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, PRECISION);
}

export function decodeGeohash(hash: string): { latitude: number; longitude: number } {
  return ngeohash.decode(hash);
}

// Approximate labels for Waterloo neighborhoods
const LOCATION_LABELS: Record<string, string> = {
  dpz8: 'near Downtown Waterloo',
  dpz9: 'near James St North',
  dpzb: 'near Barton Village',
  dpzc: 'near Stinson',
  dpz2: 'near Westdale',
  dpz3: 'near Dundas',
  dpz6: 'near Crown Point',
};

export function getApproxLabel(geohash: string): string {
  const prefix4 = geohash.substring(0, 4);
  return LOCATION_LABELS[prefix4] || `near ${geohash.substring(0, 4)}`;
}
