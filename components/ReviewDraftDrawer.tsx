'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportJourney } from './report-journey';
import Form311Document from './Form311Document';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    X,
    AlertTriangle,
    MapPin,
    Trash2,
    Eye,
    ExternalLink,
    Download,
    Loader2,
} from 'lucide-react';

interface ReviewDraftDrawerProps {
    draft: any;
    onClose: () => void;
    onFileComplete: () => void;
}

type Phase = 'review' | 'preview_311' | 'confirm' | 'celebrate';

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/15 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    low: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
};

export default function ReviewDraftDrawer({ draft, onClose, onFileComplete }: ReviewDraftDrawerProps) {
    const [phase, setPhase] = useState<Phase>('review');
    const [editedDescription, setEditedDescription] = useState(draft.description || '');
    const [reportLocation, setReportLocation] = useState({ lat: 43.2557, lng: -79.8711 });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Extract location from draft if available
    useEffect(() => {
        if (draft.location?.coordinates) {
            setReportLocation({
                lng: draft.location.coordinates[0],
                lat: draft.location.coordinates[1],
            });
        }
    }, [draft]);

    // Keyboard escape to close (only in review/preview phases)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (phase === 'review' || phase === 'preview_311')) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, onClose]);

    const handleBackdropClick = useCallback(() => {
        if (phase === 'review' || phase === 'preview_311') {
            onClose();
        }
    }, [phase, onClose]);

    const handlePreview311 = () => {
        setPhase('preview_311');
    };

    // Opens real Waterloo URL and immediately goes to confirm phase (no loading screen)
    const handleSubmitToCity = () => {
        window.open(
            'https://www.hamilton.ca/home-neighbourhood/getting-around/streets-sidewalks/road-sidewalk-maintenance',
            '_blank'
        );
        setPhase('confirm');
    };

    // Download 311 form as PDF using html2canvas + jspdf (smooth direct download)
    const handleDownload = async () => {
        const docElement = document.getElementById('form-311-document');
        if (!docElement || isDownloading) return;

        setIsDownloading(true);
        try {
            // Capture the document as a canvas
            const canvas = await html2canvas(docElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#FAFAF7',
                logging: false,
            } as any);

            // Create PDF from canvas
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Calculate dimensions to fit A4
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10; // Small top margin

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

            // Generate filename with reference
            const refNumber = `SP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            pdf.save(`311-ServiceRequest-${refNumber}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleConfirmFiled = async () => {
        try {
            const reportId = draft._id || draft.id;
            await fetch(`/api/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'submitted',
                    description: editedDescription !== draft.description ? editedDescription : undefined,
                }),
            });
            setPhase('celebrate');
        } catch (error) {
            console.error('Failed to update report:', error);
            setPhase('review');
        }
    };

    const handleDeleteDraft = async () => {
        try {
            const reportId = draft._id || draft.id;
            await fetch(`/api/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'deleted' }),
            });
            onFileComplete();
            onClose();
        } catch (error) {
            console.error('Failed to delete draft:', error);
        }
    };

    const handleCelebrationComplete = () => {
        onFileComplete();
        onClose();
    };

    return (
        <>
            {/* Backdrop - offset by nav rail width */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                style={{ left: 'var(--nav-width, 72px)' }}
                onClick={handleBackdropClick}
            />

            {/* Drawer - offset by nav rail width */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 right-0 z-40 max-h-[90vh] rounded-t-2xl bg-[var(--bg-elevated)] border-t border-[var(--border-glass)]"
                style={{ left: 'var(--nav-width, 72px)' }}
            >
                <AnimatePresence mode="wait">
                    {/* ═══════════════════════════════════════════════════════════════════
              Phase 1: Review
          ═══════════════════════════════════════════════════════════════════ */}
                    {phase === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-6 py-5 space-y-4 overflow-y-auto max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Review Draft Report
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Photo */}
                            {draft.imageUrl && (
                                <div className="w-full h-48 rounded-xl overflow-hidden">
                                    <img
                                        src={draft.imageUrl}
                                        alt="Report photo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Category & Severity chips */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-[var(--text-secondary)] capitalize">
                                    {draft.category || 'General'}
                                </span>
                                {draft.subcategory && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-[var(--text-secondary)] capitalize">
                                        {draft.subcategory}
                                    </span>
                                )}
                                <span
                                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${SEVERITY_COLORS[draft.severity] || SEVERITY_COLORS.medium}`}
                                >
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    {draft.severity || 'medium'}
                                </span>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                    Description
                                </label>
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg bg-transparent border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all resize-none min-h-[120px]"
                                    placeholder="Describe the issue..."
                                />
                            </div>

                            {/* AI Summary */}
                            {draft.aiSummary && (
                                <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4 border border-[var(--border-subtle)]">
                                    <div className="text-xs uppercase tracking-wider text-amber-400 mb-1 font-medium">AI Summary</div>
                                    <p className="text-sm text-[var(--text-secondary)] italic">{draft.aiSummary}</p>
                                </div>
                            )}

                            {/* Location */}
                            {draft.locationApprox?.label && (
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                    <span>{draft.locationApprox.label}</span>
                                </div>
                            )}

                            {/* Primary Action */}
                            <button
                                onClick={handlePreview311}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20"
                            >
                                <Eye className="w-4 h-4" />
                                Preview 311 Form
                            </button>

                            {/* Delete Draft */}
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full text-sm text-red-400 hover:text-red-300 text-center cursor-pointer mt-2 flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete Draft
                                </button>
                            ) : (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                                    <p className="text-xs text-red-400 text-center">Delete this draft? This can&apos;t be undone.</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 py-2 rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteDraft}
                                            className="flex-1 py-2 rounded-lg bg-red-500/20 text-xs text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════════
              Phase 2: Preview 311 Form
          ═══════════════════════════════════════════════════════════════════ */}
                    {phase === 'preview_311' && (
                        <motion.div
                            key="preview_311"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-[85vh]"
                        >
                            {/* Phase header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Review Your 311 Submission</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                        Preview what will be submitted to the city
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Scrollable document area */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <Form311Document draft={draft} editedDescription={editedDescription} />
                            </div>

                            {/* Sticky bottom buttons */}
                            <div className="flex flex-col gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                                {/* Download button */}
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className={`w-full py-2.5 rounded-xl font-medium text-sm bg-transparent border border-[var(--border-subtle)] transition-colors flex items-center justify-center gap-2 ${isDownloading
                                            ? 'opacity-60 cursor-not-allowed text-[var(--text-muted)]'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                                        }`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Download 311 Form as PDF
                                        </>
                                    )}
                                </button>

                                {/* Action row */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPhase('review')}
                                        className="flex-1 py-3 rounded-xl font-medium bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        ← Edit Draft
                                    </button>
                                    <button
                                        onClick={handleSubmitToCity}
                                        className="flex-[2] py-3 rounded-xl font-medium bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        🏛️ Submit to City of Waterloo
                                        <ExternalLink className="w-3 h-3 opacity-70" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════════
              Phase 3: Confirm (no loading phase in between)
          ═══════════════════════════════════════════════════════════════════ */}
                    {phase === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center px-6 py-8"
                        >
                            {/* Animated check icon */}
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                </svg>
                            </div>

                            {/* Question */}
                            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 text-center">
                                Did you complete the 311 submission?
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] text-center mb-2 max-w-sm">
                                Confirm only if you successfully submitted the report on the City of Waterloo website.
                            </p>

                            {/* Context card */}
                            <div className="w-full max-w-sm bg-[var(--bg-secondary)]/50 rounded-lg p-3 border border-[var(--border-subtle)] mb-8">
                                <div className="flex items-center gap-3">
                                    {draft.imageUrl && (
                                        <img src={draft.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {draft.category || 'Report'} — {draft.subcategory || 'General'}
                                        </div>
                                        <div className="text-xs text-[var(--text-secondary)] truncate">
                                            {draft.locationApprox?.label || 'Location pending'}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${SEVERITY_COLORS[draft.severity] || SEVERITY_COLORS.medium}`}>
                                        {(draft.severity || 'MEDIUM').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Buttons — stacked vertically */}
                            <div className="w-full space-y-3 max-w-sm">
                                <button
                                    onClick={handleConfirmFiled}
                                    className="w-full py-3 rounded-xl font-medium bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Yes, Report Filed Successfully
                                </button>
                                <button
                                    onClick={() => setPhase('preview_311')}
                                    className="w-full py-3 rounded-xl font-medium bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2"
                                >
                                    ← No, Go Back to Preview
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
          Phase 4: Celebration - ReportJourney overlay
      ═══════════════════════════════════════════════════════════════════ */}
            {phase === 'celebrate' && (
                <ReportJourney
                    isVisible={true}
                    reportLocation={reportLocation}
                    reportType={draft.category || 'Community Report'}
                    onComplete={handleCelebrationComplete}
                />
            )}
        </>
    );
}
