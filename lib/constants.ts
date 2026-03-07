export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff3b3b',
  high: '#ff8c00',
  medium: '#ffd700',
  low: '#00d4aa',
};

export const SEVERITY_BG: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  environmental: 'Environmental',
  safety: 'Safety',
  accessibility: 'Accessibility',
};

export const NEIGHBORHOODS = [
  { slug: 'downtown-hamilton', name: 'Downtown Waterloo' },
  { slug: 'james-st-north', name: 'James St North' },
  { slug: 'barton-village', name: 'Barton Village' },
  { slug: 'westdale', name: 'Westdale' },
  { slug: 'crown-point', name: 'Crown Point' },
];

export const HAMILTON_CENTER = { lat: 43.2557, lng: -79.8711 };

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};
