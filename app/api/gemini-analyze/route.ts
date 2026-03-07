import { NextRequest } from 'next/server';
import { callGeminiWithImage, PROMPTS } from '@/lib/gemini';
import { requireAuth, handleApiError, ApiError } from '@/lib/auth';
import { checkRateLimit, rateLimitError } from '@/lib/rateLimiter';

export interface WaterlooAgentResponse {
  hazard_detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  department: string;
  bylaw_reference: string;
  technical_description: string;
  spoken_response: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const auth = await requireAuth();

    // Rate limiting
    if (!checkRateLimit(auth.userId, 'gemini-analyze')) {
      return rateLimitError();
    }

    // Parse request body with error handling
    let body: { image?: string; userContext?: string; location?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { image, userContext, location } = body;

    // Validate image field
    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    if (typeof image !== 'string') {
      return Response.json({ error: 'Image must be a base64 string' }, { status: 400 });
    }

    // Build context for the AI prompt
    const contextBlock = [
      `LOCATION: ${location || 'Waterloo, ON'}`,
      userContext ? `RESIDENT NOTES: ${userContext}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `${PROMPTS.hamiltonAgent}\n\n${contextBlock}`;

    console.log('[API] Calling Gemini with image size:', image.length, 'chars');

    // Call Gemini AI
    const analysis = await callGeminiWithImage<WaterlooAgentResponse>(
      prompt,
      image,
    );

    console.log('[API] Gemini analysis successful');
    return Response.json(analysis);

  } catch (error) {
    // Log the actual error for debugging
    console.error('[API] /api/gemini-analyze error:', error);

    // Ensure we pass a proper Error object to handleApiError
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (error instanceof Error) {
      // Log the full error details
      console.error('[API] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500),
      });
      return handleApiError(error);
    }

    // Handle non-Error throws (shouldn't happen, but defensive)
    const wrappedError = new Error(String(error));
    console.error('[API] Non-Error thrown:', error);
    return handleApiError(wrappedError);
  }
}

