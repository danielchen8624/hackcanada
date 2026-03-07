'use client';

import { useMemo } from 'react';

interface Form311DocumentProps {
    draft: {
        category?: string;
        subcategory?: string;
        severity?: string;
        description?: string;
        aiSummary?: string;
        locationApprox?: { label?: string; cellId?: string };
        imageUrl?: string;
        createdAt?: any;
    };
    editedDescription?: string;
}

export default function Form311Document({ draft, editedDescription }: Form311DocumentProps) {
    const description = editedDescription || draft.description || '';

    // Generate reference number
    const referenceNumber = useMemo(() => {
        const year = new Date().getFullYear();
        const chars = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `SP-${year}-${chars}`;
    }, []);

    // Format date - handle Firestore Timestamp, ISO string, or Date
    const submissionDate = useMemo(() => {
        let date: Date;
        if (draft.createdAt?._seconds) {
            // Firestore Timestamp object
            date = new Date(draft.createdAt._seconds * 1000);
        } else if (draft.createdAt?.seconds) {
            // Alternative Firestore format
            date = new Date(draft.createdAt.seconds * 1000);
        } else if (draft.createdAt?.toDate) {
            // Firestore Timestamp with toDate method
            date = draft.createdAt.toDate();
        } else if (draft.createdAt) {
            date = new Date(draft.createdAt);
        } else {
            date = new Date();
        }

        // Fallback if still invalid
        if (isNaN(date.getTime())) {
            date = new Date();
        }

        return date.toLocaleDateString('en-CA', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, [draft.createdAt]);

    // Map severity to priority info
    const getPriorityInfo = (severity?: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return { label: 'CRITICAL', bgColor: 'bg-red-600', response: 'Class 1 — Repair within 24 hours' };
            case 'high':
                return { label: 'HIGH', bgColor: 'bg-red-600', response: 'Class 1/2 — Repair within 4 days' };
            case 'medium':
                return { label: 'MEDIUM', bgColor: 'bg-amber-500', response: 'Class 3 — Repair within 14 days' };
            default:
                return { label: 'LOW', bgColor: 'bg-green-600', response: 'Class 4/5 — Repair within 30 days' };
        }
    };

    const priority = getPriorityInfo(draft.severity);

    // Format category display
    const requestType = draft.category === 'infrastructure' ? 'Road Maintenance' :
        draft.category === 'safety' ? 'Public Safety' :
            draft.category === 'environmental' ? 'Environmental' :
                draft.category || 'General Service Request';

    return (
        <div id="form-311-document" className="bg-[#FAFAF7] rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">

            {/* DRAFT watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                <span
                    className="text-[80px] font-bold text-gray-200 select-none tracking-[0.2em]"
                    style={{ transform: 'rotate(-30deg)' }}
                >
                    DRAFT
                </span>
            </div>

            {/* Content sits above watermark */}
            <div className="relative z-10">

                {/* Header band — dark bar like a government letterhead */}
                <div className="bg-gray-800 text-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-wide">CITY OF HAMILTON</h2>
                            <p className="text-gray-300 text-sm">Municipal Service Request — {requestType}</p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            <div>Reference</div>
                            <div className="text-white font-mono font-bold text-sm">{referenceNumber}</div>
                        </div>
                    </div>
                </div>

                {/* Priority banner — color-coded strip below header */}
                <div className={`${priority.bgColor} text-white px-6 py-2 text-sm font-medium flex items-center gap-2`}>
                    <span>⚠</span> Priority: {priority.label} — Response Standard: {priority.response}
                </div>

                {/* Body sections */}
                <div className="px-6 py-4 space-y-4">

                    {/* Request Details — 2-column grid */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 border-b border-gray-200 pb-1">
                            Request Details
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div><span className="text-gray-500">Category:</span> <span className="text-gray-900 font-medium capitalize">{draft.category || 'Infrastructure'}</span></div>
                            <div><span className="text-gray-500">Subcategory:</span> <span className="text-gray-900 font-medium capitalize">{draft.subcategory || 'General'}</span></div>
                            <div><span className="text-gray-500">Date Filed:</span> <span className="text-gray-900">{submissionDate}</span></div>
                            <div><span className="text-gray-500">Method:</span> <span className="text-gray-900">NorthReport Digital Filing</span></div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 border-b border-gray-200 pb-1">
                            Location Details
                        </h3>
                        <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                                <span>📍</span> {draft.locationApprox?.label || '100 Main St W, Waterloo ON'}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">Ward 2 — Downtown Waterloo</div>
                        </div>
                    </div>

                    {/* Description — the main body */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 border-b border-gray-200 pb-1">
                            Description of Issue
                        </h3>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Supporting Evidence */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 border-b border-gray-200 pb-1">
                            Supporting Evidence
                        </h3>
                        <div className="flex gap-4 items-start">
                            {draft.imageUrl && (
                                <img
                                    src={draft.imageUrl}
                                    alt="Evidence"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                            )}
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">AI Assessment</div>
                                <p className="text-sm text-gray-700 italic">
                                    {draft.aiSummary || 'Automated analysis pending.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            PENDING SUBMISSION
                        </span>
                    </div>

                    {/* Regulation footer */}
                    <div className="bg-gray-100 -mx-6 px-6 py-3 mt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            <div className="font-semibold mb-1">Applicable Regulation</div>
                            <div>Ontario Reg. 239/02 — Minimum Maintenance Standards for Municipal Highways</div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-800 text-gray-400 px-6 py-3 text-xs text-center">
                    City of Waterloo | 905-546-CITY (2489) | hamilton.ca | 311 Service
                </div>

            </div>
        </div>
    );
}
