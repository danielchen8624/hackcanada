import { NextRequest } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/auth';
import { callGemini } from '@/lib/gemini';
import { getCategoryById, HAMILTON_311_URL, type Category311 } from '@/lib/hamilton311Config';
import { getDb } from '@/lib/firebase';

interface Form311Request {
    reportId?: string;
    categoryId: string;
    location?: string;
    description?: string;
}

interface Form311Response {
    success: boolean;
    category: Category311;
    generatedForm: {
        category: string;
        subcategory: string;
        location: string;
        description: string;
        additionalDetails: string;
    };
    submissionSteps: string[];
    hamilton311Url: string;
    spokenSummary: string; // For TTS/voice mode
}

export async function POST(req: NextRequest) {
    try {
        await requireAuth();
        const body: Form311Request = await req.json();
        const { reportId, categoryId, location, description } = body;

        // Get 311 category
        const category = getCategoryById(categoryId);
        if (!category) {
            return Response.json({ error: 'Invalid category' }, { status: 400 });
        }

        // Get report data if provided
        let reportData: any = null;
        if (reportId) {
            const db = getDb();
            const reportDoc = await db.collection('reports').doc(reportId).get();
            if (reportDoc.exists) {
                reportData = reportDoc.data();
            }
        }

        // Build context for Gemini
        const reportDescription = reportData?.description || description || '';
        const reportLocation = reportData?.locationApprox?.label || location || '';
        const reportCategory = reportData?.category || '';
        const reportSubcategory = reportData?.subcategory || '';

        // Generate professional 311 form content using Gemini
        const prompt = `You are helping a citizen file a 311 service request with the City of Waterloo, Ontario.

CATEGORY: ${category.name}
SUBCATEGORIES AVAILABLE: ${category.subcategories.join(', ')}

REPORT DATA:
- Location: ${reportLocation}
- Original Description: ${reportDescription}
- Original Category: ${reportCategory}
- Original Subcategory: ${reportSubcategory}

Generate a professional, clear 311 service request form. Be specific and factual. Do NOT invent details not in the original report.

Return ONLY valid JSON in this exact format:
{
  "subcategory": "Pick the most appropriate from: ${category.subcategories.join(', ')}",
  "location": "Clean, properly formatted address or location",
  "description": "Professional 2-3 sentence description of the issue for city workers",
  "additionalDetails": "Any relevant additional context (time observed, severity, safety concerns)"
}`;

        const geminiResponse = await callGemini<{ subcategory: string; location: string; description: string; additionalDetails: string }>(prompt);

        // callGemini already returns parsed JSON, use directly with fallback
        let generatedForm;
        try {
            generatedForm = {
                subcategory: geminiResponse.subcategory || category.subcategories[0],
                location: geminiResponse.location || reportLocation,
                description: geminiResponse.description || reportDescription,
                additionalDetails: geminiResponse.additionalDetails || '',
            };
        } catch {
            // Fallback to basic form if anything fails
            generatedForm = {
                subcategory: category.subcategories[0],
                location: reportLocation,
                description: reportDescription,
                additionalDetails: '',
            };
        }

        // Generate spoken summary for voice mode
        const spokenSummary = `I've prepared a ${category.name} report for ${generatedForm.location}. ` +
            `The issue is: ${generatedForm.description.substring(0, 100)}. ` +
            `To submit, go to Waterloo 311 online or call 905-546-2489. ` +
            `Would you like me to read the step-by-step instructions?`;

        const response: Form311Response = {
            success: true,
            category,
            generatedForm: {
                category: category.name,
                subcategory: generatedForm.subcategory,
                location: generatedForm.location,
                description: generatedForm.description,
                additionalDetails: generatedForm.additionalDetails || '',
            },
            submissionSteps: category.submissionSteps,
            hamilton311Url: HAMILTON_311_URL,
            spokenSummary,
        };

        return Response.json(response);
    } catch (error) {
        return handleApiError(error);
    }
}

// GET endpoint to retrieve category list (for UI)
export async function GET() {
    try {
        await requireAuth();

        const { CATEGORIES } = await import('@/lib/hamilton311Config');

        return Response.json({
            categories: CATEGORIES.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                icon: c.icon,
            })),
            hamilton311Url: HAMILTON_311_URL,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
