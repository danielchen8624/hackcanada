import { NextRequest } from 'next/server';
import { getDb, generateId } from '@/lib/firebase';
import { callGeminiWithImage, callGemini, PROMPTS } from '@/lib/gemini';
import { encodeGeohash, getApproxLabel } from '@/lib/geohash';
import { computeFeedScore } from '@/lib/feedScore';

/**
 * Public endpoint for App Clip submissions.
 * No Auth0 session required — reports land in queue with status "clip-pending".
 * Protected by a shared API key in the x-clip-key header.
 */

const CLIP_API_KEY = process.env.CLIP_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Validate clip API key
    const clipKey = req.headers.get('x-clip-key');
    if (!CLIP_API_KEY || clipKey !== CLIP_API_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, latitude, longitude, description } = body;

    if (!imageBase64) {
      return Response.json({ error: 'Image required' }, { status: 400 });
    }
    if (!latitude || !longitude) {
      return Response.json({ error: 'Location required' }, { status: 400 });
    }

    const cellId = encodeGeohash(latitude, longitude);
    const label = getApproxLabel(cellId);

    // AI classification from image
    let aiResult;
    try {
      const input = JSON.stringify({
        text: description || 'Photo submitted via App Clip',
        imageBase64: 'present',
      });
      aiResult = await callGeminiWithImage(
        `${PROMPTS.reportClassification}\n\nINPUT:\n${input}`,
        imageBase64,
      );
    } catch {
      aiResult = {
        category: 'infrastructure',
        subcategory: 'general',
        severity: 'medium',
        aiSummary: description || 'App Clip photo report',
        imageFindings: null,
        immediateRisk: false,
        suggestedAction: 'Monitor and assess',
      };
    }

    // Store image inline (same pattern as existing reports)
    let imageUrl: string | null = null;
    const sizeBytes = (imageBase64.length * 3) / 4;
    if (sizeBytes <= 1_048_576) {
      imageUrl = imageBase64;
    }

    const now = new Date();
    const reportId = generateId('reports');
    const report = {
      userId: 'clip-anonymous',
      neighborhood: 'downtown-hamilton',
      location: { type: 'Point', coordinates: [longitude, latitude] },
      locationApprox: { cellId, label },
      category: (aiResult as any).category,
      subcategory: (aiResult as any).subcategory,
      severity: (aiResult as any).severity,
      description: description || (aiResult as any).aiSummary || 'App Clip report',
      aiSummary: (aiResult as any).aiSummary,
      imageUrl,
      imageAnalysis: (aiResult as any).imageFindings,
      status: 'clip-pending',
      source: 'app-clip',
      upvotes: 0,
      feedScore: 0,
      corroborationCount: 0,
      linkedVoiceId: null,
      autoFiled311: false,
      confirmationNumber311: null,
      filedBy: null,
      flagCount: 0,
      hidden: false,
      createdAt: now,
      updatedAt: now,
    };

    report.feedScore = computeFeedScore(report);

    const db = getDb();
    await db.collection('reports').doc(reportId).set(report);

    return Response.json(
      {
        id: reportId,
        category: report.category,
        severity: report.severity,
        aiSummary: report.aiSummary,
        message: 'Report queued successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Clip report error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
