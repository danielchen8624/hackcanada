import { NextRequest } from 'next/server';
import { getDb, generateId } from '@/lib/firebase';
import { callGeminiWithImage, PROMPTS } from '@/lib/gemini';
import { encodeGeohash, getApproxLabel } from '@/lib/geohash';
import { computeFeedScore } from '@/lib/feedScore';

const CLIP_API_KEY = process.env.CLIP_API_KEY;

export async function POST(req: NextRequest) {
  try {
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
    let aiResult: any;
    try {
      const input = JSON.stringify({
        text: description || 'Photo submitted via App Clip — analyze the image carefully',
        imageBase64: 'present',
      });
      aiResult = await callGeminiWithImage(
        `${PROMPTS.reportClassification}\n\nINPUT:\n${input}`,
        imageBase64,
      );
    } catch (aiError) {
      console.error('Gemini analysis failed:', aiError);
      aiResult = {
        category: 'infrastructure',
        subcategory: 'general',
        severity: 'medium',
        aiSummary: description || 'App Clip photo report',
        imageFindings: 'AI analysis unavailable',
        immediateRisk: false,
        suggestedAction: 'Monitor and assess',
      };
    }

    // Store image — increase limit to 5MB for clip reports
    let imageUrl: string | null = null;
    const sizeBytes = (imageBase64.length * 3) / 4;
    if (sizeBytes <= 5_242_880) {
      imageUrl = imageBase64;
    }

    const now = new Date();
    const reportId = generateId('reports');
    const report = {
      userId: 'clip-anonymous',
      neighborhood: 'downtown-waterloo',
      location: { type: 'Point', coordinates: [longitude, latitude] },
      locationApprox: { cellId, label },
      category: aiResult.category || 'infrastructure',
      subcategory: aiResult.subcategory || 'general',
      severity: aiResult.severity || 'medium',
      description: description || aiResult.aiSummary || 'App Clip report',
      aiSummary: aiResult.aiSummary || 'Photo report via App Clip',
      imageUrl,
      imageAnalysis: aiResult.imageFindings || null,
      status: 'draft',
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
        imageAnalysis: report.imageAnalysis,
        message: 'Report queued successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Clip report error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
