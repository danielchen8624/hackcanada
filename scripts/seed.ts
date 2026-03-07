/* eslint-disable @typescript-eslint/no-require-imports */
// Seed script for NorthReport Firebase
// Run: npx tsx scripts/seed.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});
const db = getFirestore();

async function seed() {
  console.log('Connected to Firebase. Seeding...');

  // Delete existing collections
  const collections = ['users', 'voices', 'voice_votes', 'voice_comments', 'voice_reposts', 'reports', 'neighborhoods', 'patterns', 'filed_311'];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    if (!snapshot.empty) await batch.commit();
  }

  // ─── NEIGHBORHOODS ───
  const neighborhoods = [
    {
      slug: 'downtown-hamilton',
      name: 'Downtown Waterloo',
      bounds: { sw: [-79.88, 43.25], ne: [-79.86, 43.26] },
      healthScore: { overall: 72, infrastructure: 65, safety: 78 },
      reportCount7d: 23,
      voiceCount7d: 45,
      trendDirection: 'stable',
      lastUpdated: new Date(),
    },
    {
      slug: 'james-st-north',
      name: 'James St North',
      bounds: { sw: [-79.87, 43.26], ne: [-79.86, 43.27] },
      healthScore: { overall: 68, infrastructure: 60, safety: 74 },
      reportCount7d: 18,
      voiceCount7d: 32,
      trendDirection: 'declining',
      lastUpdated: new Date(),
    },
    {
      slug: 'barton-village',
      name: 'Barton Village',
      bounds: { sw: [-79.85, 43.26], ne: [-79.83, 43.27] },
      healthScore: { overall: 58, infrastructure: 52, safety: 65 },
      reportCount7d: 31,
      voiceCount7d: 28,
      trendDirection: 'declining',
      lastUpdated: new Date(),
    },
    {
      slug: 'westdale',
      name: 'Westdale',
      bounds: { sw: [-79.92, 43.25], ne: [-79.90, 43.26] },
      healthScore: { overall: 85, infrastructure: 82, safety: 88 },
      reportCount7d: 8,
      voiceCount7d: 20,
      trendDirection: 'improving',
      lastUpdated: new Date(),
    },
    {
      slug: 'crown-point',
      name: 'Crown Point',
      bounds: { sw: [-79.83, 43.24], ne: [-79.81, 43.25] },
      healthScore: { overall: 75, infrastructure: 70, safety: 80 },
      reportCount7d: 14,
      voiceCount7d: 25,
      trendDirection: 'stable',
      lastUpdated: new Date(),
    },
  ];
  
  for (const n of neighborhoods) {
    await db.collection('neighborhoods').doc(n.slug).set(n);
  }

  // ─── USERS ───
  const users = [
    { role: 'resident', neighborhood: 'downtown-hamilton', displayName: 'Sarah Chen', email: 'sarah@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'resident', neighborhood: 'downtown-hamilton', displayName: 'Marcus Williams', email: 'marcus@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'resident', neighborhood: 'downtown-hamilton', displayName: 'Priya Patel', email: 'priya@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'resident', neighborhood: 'james-st-north', displayName: 'Jordan Rivera', email: 'jordan@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'resident', neighborhood: 'barton-village', displayName: 'Emily Zhang', email: 'emily@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'leader', neighborhood: 'downtown-hamilton', displayName: 'Alex Torres (Leader)', email: 'leader@demo.com', avatarUrl: null, settings: { handsFreeEnabled: true }, createdAt: new Date(), updatedAt: new Date() },
    { role: 'leader', neighborhood: 'james-st-north', displayName: 'Kim Nguyen (Leader)', email: 'leader2@demo.com', avatarUrl: null, settings: { handsFreeEnabled: false }, createdAt: new Date(), updatedAt: new Date() },
  ];
  
  const userIds = ['demo-resident-1', 'demo-resident-2', 'demo-resident-3', 'demo-resident-4', 'demo-resident-5', 'demo-leader-1', 'demo-leader-2'];
  for (let i = 0; i < users.length; i++) {
    await db.collection('users').doc(userIds[i]).set(users[i]);
  }

  // ─── VOICES ───
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  const voices = [
    { userId: 'demo-resident-1', neighborhood: 'downtown-hamilton', type: 'post', caption: 'Massive pothole on King Street near James — my bike wheel literally got stuck in it. Someone is going to get hurt.', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8711, 43.2557] }, locationApprox: { cellId: 'dpz8gx', label: 'near King & James' }, aiSummary: 'Large pothole on King Street posing injury risk to cyclists', severity: 'high', upvotes: 12, commentCount: 5, repostCount: 3, feedScore: 2.8, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: null, createdAt: hoursAgo(2) },
    { userId: 'demo-resident-2', neighborhood: 'downtown-hamilton', type: 'post', caption: 'The streetlight at Main and Bay has been out for 3 weeks now. Walking home at night feels unsafe.', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8690, 43.2540] }, locationApprox: { cellId: 'dpz8gw', label: 'near Main & Bay' }, aiSummary: 'Broken streetlight creating unsafe walking conditions at night', severity: 'medium', upvotes: 8, commentCount: 3, repostCount: 1, feedScore: 1.9, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: null, createdAt: hoursAgo(5) },
    { userId: 'demo-resident-3', neighborhood: 'downtown-hamilton', type: 'story', caption: 'Water is literally pooling at the bus stop on King near Wellington. Pedestrians are getting splashed by every passing car.', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8750, 43.2555] }, locationApprox: { cellId: 'dpz8gv', label: 'near King & Wellington' }, aiSummary: 'Standing water at bus stop causing splash hazard for pedestrians', severity: 'medium', upvotes: 6, commentCount: 2, repostCount: 0, feedScore: 1.5, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: new Date(now.getTime() + 20 * 3600000), createdAt: hoursAgo(4) },
    { userId: 'demo-resident-1', neighborhood: 'downtown-hamilton', type: 'post', caption: 'Shoutout to the volunteers who cleaned up Gore Park this morning! The community comes together when it matters.', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8700, 43.2560] }, locationApprox: { cellId: 'dpz8gx', label: 'near Gore Park' }, aiSummary: 'Community volunteer cleanup effort at Gore Park', severity: null, upvotes: 15, commentCount: 7, repostCount: 4, feedScore: 2.5, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: null, createdAt: hoursAgo(8) },
    { userId: 'demo-resident-4', neighborhood: 'downtown-hamilton', type: 'story', caption: 'Fire truck blocking York Blvd for the past 20 minutes — looks like a gas leak at one of the buildings. Stay away from the area!', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8720, 43.2580] }, locationApprox: { cellId: 'dpz8gx', label: 'near York Blvd' }, aiSummary: 'Possible gas leak emergency on York Blvd with fire response', severity: 'critical', upvotes: 22, commentCount: 12, repostCount: 8, feedScore: 4.2, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: new Date(now.getTime() + 18 * 3600000), createdAt: hoursAgo(1) },
    { userId: 'demo-resident-5', neighborhood: 'barton-village', type: 'post', caption: 'Third car accident this month at the Barton/Wentworth intersection. We need a traffic light there, not just a stop sign.', mediaKind: 'text', location: { type: 'Point', coordinates: [-79.8500, 43.2630] }, locationApprox: { cellId: 'dpzbcx', label: 'near Barton & Wentworth' }, aiSummary: 'Repeated car accidents at intersection suggest need for traffic light', severity: 'high', upvotes: 18, commentCount: 9, repostCount: 5, feedScore: 3.1, hidden: false, flagCount: 0, flaggedBy: [], expiresAt: null, createdAt: hoursAgo(3) },
  ];

  const voiceIds: string[] = [];
  for (const v of voices) {
    const voiceRef = db.collection('voices').doc();
    voiceIds.push(voiceRef.id);
    await voiceRef.set({
      ...v,
      mediaUrl: null,
      linkedReportId: null,
      updatedAt: v.createdAt,
    });
  }

  // ─── REPORTS ───
  const reports = [
    { userId: 'demo-resident-1', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.8711, 43.2557] }, locationApprox: { cellId: 'dpz8gx', label: 'near King & James' }, category: 'infrastructure', subcategory: 'pothole', severity: 'high', description: 'Large pothole approximately 30cm wide and 10cm deep on King Street near James intersection.', aiSummary: 'Dangerous pothole in cycling lane on King Street near James', imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80', imageAnalysis: null, status: 'acknowledged', upvotes: 14, feedScore: 3.0, corroborationCount: 3, linkedVoiceId: voiceIds[0], autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(2) },
    { userId: 'demo-resident-2', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.8810, 43.2590] }, locationApprox: { cellId: 'dpz8gw', label: 'near Main & Dundurn' }, category: 'infrastructure', subcategory: 'broken_streetlight', severity: 'medium', description: 'Streetlight at Main and Dundurn has been non-functional for 3 weeks creating safety concern at night.', aiSummary: 'Non-functional streetlight creating dark block at Main & Dundurn', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', imageAnalysis: null, status: 'new', upvotes: 8, feedScore: 2.0, corroborationCount: 2, linkedVoiceId: voiceIds[1], autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(5) },
    { userId: 'demo-resident-4', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.8920, 43.2620] }, locationApprox: { cellId: 'dpz8gx', label: 'near McMaster Medical Centre' }, category: 'safety', subcategory: 'gas_leak', severity: 'critical', description: 'Strong gas smell detected near McMaster Medical Centre. Fire department is on scene.', aiSummary: 'Active gas leak emergency near McMaster Medical Centre', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', imageAnalysis: null, status: 'in_progress', upvotes: 25, feedScore: 5.0, corroborationCount: 5, linkedVoiceId: null, autoFiled311: true, confirmationNumber311: 'CITY-H7X9K2', filedBy: 'demo-leader-1', flagCount: 0, hidden: false, createdAt: hoursAgo(1) },
    { userId: 'demo-resident-5', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9050, 43.2580] }, locationApprox: { cellId: 'dpz8gv', label: 'near Westdale Village' }, category: 'infrastructure', subcategory: 'cracked_sidewalk', severity: 'high', description: 'Severely cracked sidewalk on King St W near Paradise Rd. Trip hazard for pedestrians especially near school zone.', aiSummary: 'Trip hazard cracked sidewalk near Westdale school zone', imageUrl: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=400&q=80', imageAnalysis: null, status: 'acknowledged', upvotes: 20, feedScore: 3.5, corroborationCount: 4, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(3) },
    { userId: 'demo-resident-3', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.8760, 43.2530] }, locationApprox: { cellId: 'dpz8gw', label: 'near Hess & George' }, category: 'vandalism', subcategory: 'graffiti', severity: 'low', description: 'Graffiti vandalism on the heritage facade of the old commerce building on Hess Street.', aiSummary: 'Vandalism graffiti on heritage building facade on Hess St', imageUrl: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&q=80', imageAnalysis: null, status: 'new', upvotes: 6, feedScore: 1.5, corroborationCount: 1, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(8) },
    { userId: 'demo-resident-1', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.8980, 43.2650] }, locationApprox: { cellId: 'dpz8gx', label: 'near Cootes Dr' }, category: 'drainage', subcategory: 'storm_drain', severity: 'medium', description: 'Overflowing storm drain on Cootes Dr near botanical gardens. Flooding onto bike path during rain.', aiSummary: 'Blocked storm drain causing flooding on Cootes Dr bike path', imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&q=80', imageAnalysis: null, status: 'new', upvotes: 11, feedScore: 2.5, corroborationCount: 2, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(4) },
    { userId: 'demo-resident-2', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9130, 43.2560] }, locationApprox: { cellId: 'dpz8gv', label: 'near Longwood & Main' }, category: 'infrastructure', subcategory: 'road_damage', severity: 'high', description: 'Large section of road surface crumbling on Main St W near Longwood Rd. Multiple drivers reported tire damage.', aiSummary: 'Deteriorating road surface causing vehicle damage at Main & Longwood', imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80', imageAnalysis: null, status: 'acknowledged', upvotes: 17, feedScore: 3.2, corroborationCount: 3, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(6) },
    // McMaster campus area reports
    { userId: 'demo-resident-3', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9195, 43.2625] }, locationApprox: { cellId: 'dpz8gv', label: 'near McMaster Student Centre' }, category: 'infrastructure', subcategory: 'broken_bench', severity: 'low', description: 'Broken bench outside McMaster Student Centre with exposed nails. Safety hazard for students.', aiSummary: 'Broken bench with exposed nails at McMaster Student Centre', imageUrl: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=400&q=80', imageAnalysis: null, status: 'new', upvotes: 9, feedScore: 1.8, corroborationCount: 2, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(3) },
    { userId: 'demo-resident-4', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9220, 43.2660] }, locationApprox: { cellId: 'dpz8gv', label: 'near Sterling St' }, category: 'infrastructure', subcategory: 'pothole', severity: 'medium', description: 'Deep pothole on Sterling St near campus north entrance. Cyclists have to swerve into traffic to avoid it.', aiSummary: 'Pothole forcing cyclists into traffic on Sterling St near campus', imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80', imageAnalysis: null, status: 'new', upvotes: 13, feedScore: 2.8, corroborationCount: 3, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(2) },
    { userId: 'demo-resident-5', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9250, 43.2640] }, locationApprox: { cellId: 'dpz8gv', label: 'near Forsyth Ave' }, category: 'lighting', subcategory: 'broken_streetlight', severity: 'high', description: 'Two consecutive streetlights out on Forsyth Ave N creating a dark stretch. Multiple students reported feeling unsafe walking at night.', aiSummary: 'Dark stretch on Forsyth Ave near campus — two streetlights out', imageUrl: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=400&q=80', imageAnalysis: null, status: 'acknowledged', upvotes: 22, feedScore: 3.8, corroborationCount: 5, linkedVoiceId: null, autoFiled311: false, confirmationNumber311: null, filedBy: null, flagCount: 0, hidden: false, createdAt: hoursAgo(1.5) },
    { userId: 'demo-resident-1', neighborhood: 'downtown-hamilton', location: { type: 'Point', coordinates: [-79.9170, 43.2680] }, locationApprox: { cellId: 'dpz8gv', label: 'near Olympic Dr' }, category: 'safety', subcategory: 'fallen_tree', severity: 'critical', description: 'Large tree branch fallen across Olympic Dr bike lane near Royal Botanical Gardens entrance. Completely blocking path.', aiSummary: 'Fallen tree blocking Olympic Dr bike lane near Botanical Gardens', imageUrl: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&q=80', imageAnalysis: null, status: 'in_progress', upvotes: 19, feedScore: 4.2, corroborationCount: 4, linkedVoiceId: null, autoFiled311: true, confirmationNumber311: 'CITY-T3M8P1', filedBy: 'demo-leader-1', flagCount: 0, hidden: false, createdAt: hoursAgo(0.5) },
  ];

  const reportIds: string[] = [];
  for (const r of reports) {
    const reportRef = db.collection('reports').doc();
    reportIds.push(reportRef.id);
    await reportRef.set({ ...r, updatedAt: r.createdAt });
  }

  // ─── VOICE COMMENTS ───
  const comments = [
    { voiceId: voiceIds[0], userId: 'demo-resident-2', text: 'I saw this too! Almost wiped out on my bike yesterday.', createdAt: hoursAgo(1.5) },
    { voiceId: voiceIds[0], userId: 'demo-resident-3', text: 'Someone put a cone next to it but it keeps getting knocked over', createdAt: hoursAgo(1) },
    { voiceId: voiceIds[4], userId: 'demo-resident-1', text: 'I can smell it from my apartment on Cannon. Stay safe everyone!', createdAt: hoursAgo(0.8) },
  ];
  
  for (const c of comments) {
    await db.collection('voice_comments').doc().set(c);
  }

  // ─── PATTERNS ───
  const patterns = [
    { neighborhood: 'downtown-hamilton', type: 'trend', description: 'Pothole reports near King & James up 200% week-over-week.', relatedReportIds: [reportIds[0]], relatedVoiceIds: [voiceIds[0]], severity: 'high', w0Count: 6, w1Count: 2, detectedAt: hoursAgo(1), acknowledged: false },
    { neighborhood: 'barton-village', type: 'anomaly', description: 'Unusual spike in traffic safety reports at Barton & Wentworth.', relatedReportIds: [reportIds[3]], relatedVoiceIds: [voiceIds[5]], severity: 'critical', w0Count: 3, w1Count: 0, detectedAt: hoursAgo(3), acknowledged: false },
  ];
  
  for (const p of patterns) {
    await db.collection('patterns').doc().set(p);
  }

  console.log('✅ Seed complete!');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${voiceIds.length} voices`);
  console.log(`   - ${reportIds.length} reports`);
  console.log(`   - ${neighborhoods.length} neighborhoods`);
  console.log(`   - ${patterns.length} patterns`);
  console.log(`   - ${comments.length} comments`);

  process.exit(0);
}

seed().catch(console.error);
