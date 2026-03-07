'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category311 } from '@/lib/hamilton311Config';

interface GeneratedForm {
    category: string;
    subcategory: string;
    location: string;
    description: string;
    additionalDetails: string;
}

interface Form311PreviewProps {
    category: Category311;
    generatedForm: GeneratedForm;
    submissionSteps: string[];
    hamilton311Url: string;
    spokenSummary: string;
    onBack: () => void;
    onReadAloud?: (text: string) => void;
}

export default function Form311Preview({
    category,
    generatedForm,
    submissionSteps,
    hamilton311Url,
    spokenSummary,
    onBack,
    onReadAloud,
}: Form311PreviewProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showSteps, setShowSteps] = useState(false);

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const handleReadSteps = () => {
        if (onReadAloud) {
            const stepsText = submissionSteps.map((step, i) => `Step ${i + 1}: ${step}`).join('. ');
            onReadAloud(stepsText);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <span className="text-2xl">{category.icon}</span>
            </div>

            {/* Category Badge */}
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {category.name} Report
                </h2>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                    Ready to Submit
                </span>
            </div>

            {/* Generated Form Preview */}
            <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Generated 311 Form
                </h3>

                {/* Form Fields */}
                <div className="space-y-3">
                    <FormField
                        label="Category"
                        value={generatedForm.category}
                        onCopy={() => copyToClipboard(generatedForm.category, 'category')}
                        copied={copiedField === 'category'}
                    />
                    <FormField
                        label="Subcategory"
                        value={generatedForm.subcategory}
                        onCopy={() => copyToClipboard(generatedForm.subcategory, 'subcategory')}
                        copied={copiedField === 'subcategory'}
                    />
                    <FormField
                        label="Location"
                        value={generatedForm.location}
                        onCopy={() => copyToClipboard(generatedForm.location, 'location')}
                        copied={copiedField === 'location'}
                    />
                    <FormField
                        label="Description"
                        value={generatedForm.description}
                        onCopy={() => copyToClipboard(generatedForm.description, 'description')}
                        copied={copiedField === 'description'}
                        multiline
                    />
                    {generatedForm.additionalDetails && (
                        <FormField
                            label="Additional Details"
                            value={generatedForm.additionalDetails}
                            onCopy={() => copyToClipboard(generatedForm.additionalDetails, 'additional')}
                            copied={copiedField === 'additional'}
                            multiline
                        />
                    )}
                </div>

                {/* Copy All Button */}
                <button
                    onClick={() => {
                        const allText = `Category: ${generatedForm.category}\nSubcategory: ${generatedForm.subcategory}\nLocation: ${generatedForm.location}\nDescription: ${generatedForm.description}${generatedForm.additionalDetails ? `\nAdditional Details: ${generatedForm.additionalDetails}` : ''}`;
                        copyToClipboard(allText, 'all');
                    }}
                    className="w-full btn-secondary py-2.5 text-sm"
                >
                    {copiedField === 'all' ? '✓ Copied All Fields' : 'Copy All Fields'}
                </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="glass-card p-5 space-y-4">
                <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="w-full flex items-center justify-between"
                >
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Step-by-Step Instructions
                    </h3>
                    <svg
                        className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showSteps ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <AnimatePresence>
                    {showSteps && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 pt-2">
                                {submissionSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center text-xs font-semibold">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed pt-0.5">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Read Aloud Button */}
                            {onReadAloud && (
                                <button
                                    onClick={handleReadSteps}
                                    className="mt-4 flex items-center gap-2 text-sm text-[var(--accent-primary)] hover:underline"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                    Read Steps Aloud
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <a
                    href={hamilton311Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-primary py-3 text-center flex items-center justify-center gap-2"
                >
                    Open Waterloo 311
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
                <button
                    onClick={() => window.open('tel:905-546-2489')}
                    className="btn-secondary py-3 px-6 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call 311
                </button>
            </div>
        </motion.div>
    );
}

// Individual form field component
function FormField({
    label,
    value,
    onCopy,
    copied,
    multiline = false,
}: {
    label: string;
    value: string;
    onCopy: () => void;
    copied: boolean;
    multiline?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
                <button
                    onClick={onCopy}
                    className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                >
                    {copied ? (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </>
                    )}
                </button>
            </div>
            <div className={`px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 ${multiline ? 'min-h-[60px]' : ''}`}>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{value}</p>
            </div>
        </div>
    );
}
