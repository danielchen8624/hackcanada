import { NextRequest } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/auth';
import { callGemini, PROMPTS } from '@/lib/gemini';
import { checkRateLimit, rateLimitError } from '@/lib/rateLimiter';

interface CommandResult {
  intent: string;
  action: string;
  targetId: string | null;
  payload: { text: string | null };
  requiresConfirm: boolean;
  confirmPrompt: string | null;
  spokenResponse: string | null;
}

// Helper to strip wake words and apply keyword fallback
function applyKeywordFallback(input: string): CommandResult | null {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('stories') || lowerInput.includes('story')) {
    return {
      intent: 'navigate',
      action: 'open_stories',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening stories."
    };
  }
  else if (lowerInput.includes('report') || lowerInput.includes('issues') || lowerInput.includes('problem')) {
    return {
      intent: 'navigate',
      action: 'open_reports',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening reports."
    };
  }
  else if (lowerInput.includes('post') || lowerInput.includes('pose') || lowerInput.includes('posts')) {
    return {
      intent: 'navigate',
      action: 'open_posts',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening posts."
    };
  }
  else if (lowerInput.includes('feed') || lowerInput.includes('home')) {
    console.warn('[COMMAND] Fallback: Forcing "open_feed" based on keyword match');
    return {
      intent: 'navigate',
      action: 'open_feed',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening feed."
    };
  }
  else if (lowerInput.includes('map') || lowerInput.includes('location')) {
    return {
      intent: 'navigate',
      action: 'open_map',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening map."
    };
  }
  else if (lowerInput.includes('command') || lowerInput.includes('dashboard') || lowerInput.includes('stats')) {
    return {
      intent: 'navigate',
      action: 'open_dashboard',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening command center."
    };
  }
  else if (lowerInput.includes('back') || lowerInput.includes('return')) {
    return {
      intent: 'navigate',
      action: 'go_back',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Going back."
    };
  }
  // Analyze with AI agent (report page)
  else if (
    lowerInput.includes('analyze') ||
    lowerInput.includes('analyse') ||
    lowerInput.includes('ai agent') ||
    lowerInput.includes('scan this') ||
    lowerInput.includes('inspect') ||
    lowerInput.includes('identify')
  ) {
    return {
      intent: 'action',
      action: 'analyze_report',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Analyzing your image now."
    };
  }
  // 311 filing voice commands
  else if (
    lowerInput.includes('311') ||
    lowerInput.includes('file report') ||
    lowerInput.includes('file a report') ||
    lowerInput.includes('submit report') ||
    lowerInput.includes('city report') ||
    lowerInput.includes('assisted filing')
  ) {
    return {
      intent: 'navigate',
      action: 'open_311_filing',
      targetId: null,
      payload: { text: null },
      requiresConfirm: false,
      confirmPrompt: null,
      spokenResponse: "Opening assisted 311 filing. You can select a category to file a report with the City of Waterloo."
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!checkRateLimit(auth.userId, 'command')) return rateLimitError();

    const body = await req.json();
    const { transcript, currentRoute, selectedItemId, selectedItemSource } = body;

    if (!transcript) {
      return Response.json({ error: 'Transcript required' }, { status: 400 });
    }

    const input = JSON.stringify({
      transcript,
      currentRoute: currentRoute || '/feed',
      selectedItemId: selectedItemId || null,
      userRole: auth.role,
    });
    console.log('[COMMAND] Input:', transcript);

    let result: CommandResult;
    try {
      result = await callGemini<CommandResult>(`${PROMPTS.voiceCommand}\n\nINPUT:\n${input}`);
      console.log('[COMMAND] Raw Gemini Response:', JSON.stringify(result, null, 2));

      // POST-GEMINI OVERRIDE: If transcript contains "report"/"reports" but Gemini
      // returned open_feed, override to open_reports (common misclassification).
      const lowerTranscript = transcript.toLowerCase();
      if (
        (lowerTranscript.includes('report') || lowerTranscript.includes('reports')) &&
        !lowerTranscript.includes('feed') &&
        result.action === 'open_feed'
      ) {
        console.warn('[COMMAND] Override: transcript mentions "report" but Gemini returned open_feed → forcing open_reports');
        result.action = 'open_reports';
        result.spokenResponse = 'Opening reports.';
      }

      // FALLBACK: If AI returns "unknown" but we detect strong keywords, FORCE it.
      if (result.action === 'unknown' || !result.action || result.intent === 'unknown') {
        const fallback = applyKeywordFallback(transcript); // Use raw transcript not input JSON
        if (fallback) {
          result = fallback;
        } else {
          console.warn('[COMMAND] Gemini returned "unknown" and no keywords found:', result);
          result.action = 'unknown';
          result.intent = 'unknown';
        }
      }
    } catch (err) {
      console.error('[COMMAND] Gemini error:', err);

      // Try fallback on error too!
      const fallback = applyKeywordFallback(transcript);
      if (fallback) {
        console.warn('[COMMAND] Gemini failed, using fallback:', fallback);
        result = fallback;
      } else {
        result = {
          intent: 'unknown',
          action: 'unknown',
          targetId: null,
          payload: { text: null },
          requiresConfirm: false,
          confirmPrompt: null,
          spokenResponse: "I'm having trouble connecting to the AI. Could you try again?"
        };
      }
    }

    return Response.json(result);
  } catch (error) {
    console.error('[COMMAND] Error processing command:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
