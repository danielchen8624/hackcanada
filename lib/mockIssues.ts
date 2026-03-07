// Mock Issue Types and Data

export interface MockComment {
    id: string;
    author: string;
    text: string;
    timestamp: string;
}

export interface MockIssue {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    latitude: number;
    longitude: number;
    neighborhood: string;
    imageUrl: string;
    upvotes: number;
    comments: MockComment[];
    createdAt: string;
}

export function generateMockComment(): MockComment {
    const authors = ['Alex M.', 'Sam K.', 'Jordan P.', 'Taylor R.', 'Morgan H.', 'Casey W.'];
    const texts = [
        'I noticed this yesterday too!',
        'This has been an issue for weeks now.',
        'Thanks for reporting this!',
        'City needs to fix this ASAP.',
        'I walk by here every day - definitely needs attention.',
        'Reported to 311 as well.',
        'This affects everyone in the neighborhood.',
        'Finally someone else noticed this!',
    ];
    return {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        author: authors[Math.floor(Math.random() * authors.length)],
        text: texts[Math.floor(Math.random() * texts.length)],
        timestamp: new Date().toISOString(),
    };
}

// Helper to get a date string relative to now (in hours)
const getRelativeDate = (hoursAgo: number) => {
    const date = new Date();
    date.setTime(date.getTime() - (hoursAgo * 60 * 60 * 1000));
    return date.toISOString();
};

// Initial mock issues centered around Waterloo, Ontario
export const INITIAL_MOCK_ISSUES: MockIssue[] = [
    {
        id: 'issue-1',
        title: 'Large Pothole on Main Street',
        description: 'Deep pothole near the intersection causing traffic slowdown.',
        category: 'infrastructure',
        severity: 'high',
        latitude: 43.2557,
        longitude: -79.9192,
        neighborhood: 'downtown-hamilton',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80',
        upvotes: 24,
        comments: [
            { id: 'c1', author: 'Alex M.', text: 'Almost damaged my car here!', timestamp: getRelativeDate(2) },
        ],
        createdAt: getRelativeDate(4), // 4 hours ago
    },
    {
        id: 'issue-2',
        title: 'Broken Streetlight',
        description: 'Streetlight has been out for 2 weeks, creating safety concerns at night.',
        category: 'lighting',
        severity: 'medium',
        latitude: 43.2580,
        longitude: -79.9210,
        neighborhood: 'downtown-hamilton',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
        upvotes: 18,
        comments: [],
        createdAt: getRelativeDate(26), // ~1 day ago
    },
    {
        id: 'issue-3',
        title: 'Graffiti on Heritage Building',
        description: 'Vandalism on the historic commerce building facade.',
        category: 'vandalism',
        severity: 'low',
        latitude: 43.2540,
        longitude: -79.9170,
        neighborhood: 'downtown-hamilton',
        imageUrl: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&q=80',
        upvotes: 12,
        comments: [
            { id: 'c2', author: 'Jordan P.', text: 'Such a shame on this beautiful building.', timestamp: getRelativeDate(49) },
        ],
        createdAt: getRelativeDate(52), // ~2 days ago
    },
    {
        id: 'issue-4',
        title: 'Overflowing Storm Drain',
        description: 'Drain blocked with debris, causing flooding during rain.',
        category: 'drainage',
        severity: 'critical',
        latitude: 43.2600,
        longitude: -79.9150,
        neighborhood: 'north-end',
        imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&q=80',
        upvotes: 31,
        comments: [],
        createdAt: getRelativeDate(5), // 5 hours ago
    },
    {
        id: 'issue-5',
        title: 'Cracked Sidewalk',
        description: 'Trip hazard on heavily used pedestrian path near school.',
        category: 'infrastructure',
        severity: 'high',
        latitude: 43.2520,
        longitude: -79.9230,
        neighborhood: 'westdale',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
        upvotes: 15,
        comments: [
            { id: 'c3', author: 'Casey W.', text: 'Kids walk here to school every day!', timestamp: getRelativeDate(25) },
        ],
        createdAt: getRelativeDate(28), // ~1 day ago
    },
];

// Generate a random new issue
export function generateRandomIssue(): MockIssue {
    const issues = [
        { title: 'Fallen Tree Branch', category: 'vegetation', severity: 'medium' as const },
        { title: 'Damaged Bus Stop', category: 'transit', severity: 'high' as const },
        { title: 'Illegal Dumping', category: 'waste', severity: 'high' as const },
        { title: 'Faded Crosswalk', category: 'traffic', severity: 'medium' as const },
        { title: 'Missing Sign', category: 'signage', severity: 'low' as const },
        { title: 'Broken Bench', category: 'amenities', severity: 'low' as const },
        { title: 'Water Main Leak', category: 'utilities', severity: 'critical' as const },
    ];

    const neighborhoods = ['downtown-hamilton', 'north-end', 'westdale', 'dundas', 'ancaster'];
    const images = [
        'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=400&q=80',
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80',
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80',
    ];

    const template = issues[Math.floor(Math.random() * issues.length)];
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];

    return {
        id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: template.title,
        description: `New issue reported by community member.`,
        category: template.category,
        severity: template.severity,
        latitude: 43.2557 + (Math.random() - 0.5) * 0.02,
        longitude: -79.9192 + (Math.random() - 0.5) * 0.02,
        neighborhood,
        imageUrl: images[Math.floor(Math.random() * images.length)],
        upvotes: Math.floor(Math.random() * 10),
        comments: [],
        createdAt: new Date().toISOString(),
    };
}
