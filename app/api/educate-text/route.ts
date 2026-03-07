import { NextRequest } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { requireAuth, handleApiError } from '@/lib/auth';
import { checkRateLimit, rateLimitError } from '@/lib/rateLimiter';

interface EducateTextResponse {
  topic: string;
  explanation: string;
  why_it_matters: string;
  what_you_can_do: string;
  related_topics: string[];
}

const EDUCATE_TEXT_PROMPT = `You are NorthReport's Community Education Engine. A resident wants to learn more about a civic issue in their neighborhood. Provide educational context in a friendly, accessible tone.

Given the topic and description, provide:
1. A clear 2-3 sentence explanation of what this issue is
2. A 2-3 sentence explanation of why it matters to the community
3. A 1-2 sentence actionable tip on what residents can do
4. 2-3 related topics they might want to learn about

Keep it concise and educational. This is NOT a report — the goal is to inform and empower the resident.

Respond ONLY with valid JSON. No markdown fences.

OUTPUT SCHEMA:
{
  "topic": "string (the main topic, 1-5 words)",
  "explanation": "string (2-3 sentence explanation of the issue)",
  "why_it_matters": "string (2-3 sentences on community impact)",
  "what_you_can_do": "string (1-2 sentence actionable advice)",
  "related_topics": ["string", "string", "string"]
}`;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!checkRateLimit(auth.userId, 'educate')) {
      return rateLimitError();
    }

    const body = await request.json();
    const { topic, description } = body;

    if (!topic && !description) {
      return Response.json({ error: 'topic or description required' }, { status: 400 });
    }

    const userPrompt = `Topic: ${topic || 'Unknown'}
Description: ${description || 'No description provided'}

Provide educational context about this issue.`;

    const analysis = await callGemini<EducateTextResponse>(
      userPrompt,
      EDUCATE_TEXT_PROMPT
    );

    return Response.json(analysis);
  } catch (error) {
    console.error('[API] /api/educate-text error:', error);
    return handleApiError(error);
  }
}
