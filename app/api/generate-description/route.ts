import { NextRequest } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { requireAuth, handleApiError } from '@/lib/auth';
import { checkRateLimit, rateLimitError } from '@/lib/rateLimiter';

interface DescriptionResponse {
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!checkRateLimit(auth.userId, 'generate-description')) return rateLimitError();

    const { department, severity, bylaw_reference, technical_description } = await request.json();

    if (!technical_description) {
      return Response.json({ error: 'technical_description is required' }, { status: 400 });
    }

    const prompt = `You are a 311 report writing assistant for the City of Waterloo, Ontario.
Given the following analysis of a civic hazard, write a clear, professional 2-3 sentence description suitable for a 311 service request.
Be specific, factual, and include the location context if available. Do not be overly technical — write for a city dispatcher.

Department: ${department || 'Unknown'}
Severity: ${severity || 'medium'}
Applicable Regulation: ${bylaw_reference || 'N/A'}
Technical Analysis: ${technical_description}

Respond ONLY with valid JSON. No markdown fences.

OUTPUT SCHEMA:
{
  "description": "string (2-3 sentences, plain English, suitable for a 311 filing)"
}`;

    const result = await callGemini<DescriptionResponse>(prompt);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
