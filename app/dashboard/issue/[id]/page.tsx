'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import SeverityChip from '@/components/SeverityChip';

interface IssueReport {
    _id: string;
    description: string;
    category: string;
    subcategory?: string;
    severity: string;
    locationApprox?: { label: string; lat?: number; lng?: number };
    createdAt: string;
    imageUrl?: string;
}

interface IssueData {
    _id: string;
    type: 'report' | 'pattern';
    title: string;
    description: string;
    category: string;
    severity: string;
    significance: string;
    reportCount: number;
    reports: IssueReport[];
    location?: { lat: number; lng: number; label: string };
    createdAt: string;
}

export default function IssueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [issue, setIssue] = useState<IssueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const issueId = params.id as string;

    useEffect(() => {
        async function fetchIssue() {
            try {
                // For now, fetch from patterns API and find the matching issue
                const res = await fetch(`/api/patterns?issueId=${issueId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.issue) {
                        // Override stored significance with dynamically generated text
                        const issueData = data.issue;
                        issueData.significance = generateSignificance(issueData);
                        setIssue(issueData);
                    } else {
                        // Try to find in patterns array
                        const pattern = data.patterns?.find((p: any) => p._id === issueId);
                        if (pattern) {
                            setIssue({
                                _id: pattern._id,
                                type: 'pattern',
                                title: pattern.description || pattern.type || 'Pattern Detected',
                                description: pattern.description || '',
                                category: pattern.category || 'General',
                                severity: pattern.severity || 'medium',
                                significance: generateSignificance(pattern),
                                reportCount: pattern.reportCount || pattern.count || 1,
                                reports: pattern.reports || [],
                                location: pattern.location,
                                createdAt: pattern.createdAt || new Date().toISOString(),
                            });
                        } else {
                            setError('Issue not found');
                        }
                    }
                } else {
                    setError('Failed to load issue details');
                }
            } catch {
                setError('Failed to load issue details');
            } finally {
                setLoading(false);
            }
        }

        if (issueId) {
            fetchIssue();
        }
    }, [issueId]);

    function formatDate(dateStr: string | undefined): string {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Recently';
        return date.toLocaleDateString();
    }

    function generateSignificance(pattern: any): string {
        const count = pattern.reportCount || pattern.count || 1;

        if (count < 5) {
            return `This issue was identified from ${count === 1 ? 'a recent report' : `${count} reports`}. Review recommended to determine whether follow-up action is required.`;
        } else {
            return `This issue was identified from ${count} reports in this area. The volume suggests a recurring condition that may warrant coordinated response.`;
        }
    }

    // Sanitize title to remove misleading "multiple" language when count is 1
    function sanitizeTitle(title: string, reportCount: number): string {
        if (reportCount <= 1) {
            // Replace "Multiple reports" with "Report" for single report issues
            return title
                .replace(/Multiple reports and voices/gi, 'Report')
                .replace(/Multiple reports/gi, 'Report')
                .replace(/multiple residents/gi, 'a resident')
                .replace(/reported by multiple/gi, 'reported by a');
        }
        return title;
    }

    const handleViewOnMap = () => {
        if (issue?.location) {
            router.push(`/map?lat=${issue.location.lat}&lng=${issue.location.lng}&zoom=16`);
        } else if (issue?.reports?.[0]?.locationApprox) {
            const loc = issue.reports[0].locationApprox;
            if (loc.lat && loc.lng) {
                router.push(`/map?lat=${loc.lat}&lng=${loc.lng}&zoom=16`);
            } else {
                router.push('/map');
            }
        } else {
            router.push('/map');
        }
    };

    return (
        <AppShell>
            <TopBar title="Issue Details" />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="glass-card p-8 text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                            <Link href="/dashboard" className="btn-primary px-6 py-2">
                                Return to Dashboard
                            </Link>
                        </div>
                    ) : issue ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Issue Header Card */}
                            <div className="glass-card p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${issue.reportCount >= 5
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                }`}>
                                                {issue.reportCount >= 5 ? 'Cluster' : 'Report'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                issue.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {issue.severity === 'critical' ? 'Critical' :
                                                    issue.severity === 'high' ? 'High' : 'Medium'}
                                            </span>
                                        </div>
                                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                            {sanitizeTitle(issue.title, issue.reportCount)}
                                        </h1>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {issue.category} · {issue.reportCount} {issue.reportCount === 1 ? 'report' : 'reports'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Take Action primary for critical/high */}
                            <div className="flex gap-3 pt-2">
                                {(issue.severity === 'critical' || issue.severity === 'high') ? (
                                    <>
                                        <Link
                                            href="/dashboard/auto-file"
                                            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Take Action
                                        </Link>
                                        <button
                                            onClick={handleViewOnMap}
                                            className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            View Location
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleViewOnMap}
                                            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            View Location
                                        </button>
                                        <Link
                                            href="/dashboard/auto-file"
                                            className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Take Action
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Context Card */}
                            <div className="glass-card p-6 space-y-3">
                                <h2 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Context
                                </h2>
                                <p className="text-[var(--text-primary)] leading-relaxed">
                                    {issue.significance}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-[var(--text-secondary)]">
                                        Detected: {formatDate(issue.createdAt)}
                                    </span>
                                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-[var(--text-secondary)]">
                                        {issue.reportCount} {issue.reportCount === 1 ? 'report' : 'reports'} reviewed
                                    </span>
                                </div>
                            </div>

                            {/* Related Reports Breakdown */}
                            {issue.reports && issue.reports.length > 0 && (
                                <div className="glass-card p-6 space-y-4">
                                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Citizen Reports ({issue.reports.length})
                                    </h2>
                                    <div className="space-y-3">
                                        {issue.reports.map((report, i) => (
                                            <motion.div
                                                key={report._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    {report.imageUrl && (
                                                        <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={report.imageUrl}
                                                                alt="Report"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${report.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                                report.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                                                    'bg-blue-500/20 text-blue-400'
                                                                }`}>
                                                                {report.severity === 'critical' ? 'Critical' :
                                                                    report.severity === 'high' ? 'High' : 'Medium'}
                                                            </span>
                                                            <span className="text-xs text-[var(--text-secondary)]">
                                                                {report.category}{report.subcategory ? ` › ${report.subcategory}` : ''}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                                                            {report.description}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                            {report.locationApprox?.label || 'Location unknown'}
                                                        </p>
                                                    </div>
                                                    {report.locationApprox?.lat && report.locationApprox?.lng && (
                                                        <button
                                                            onClick={() => router.push(`/map?lat=${report.locationApprox?.lat}&lng=${report.locationApprox?.lng}&zoom=17`)}
                                                            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all"
                                                            title="View on map"
                                                        >
                                                            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="glass-card p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        Need to take action on this issue?
                                    </span>
                                    <div className="flex gap-2">
                                        <Link
                                            href="/report"
                                            className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-[var(--text-primary)] transition-all"
                                        >
                                            + Submit Report
                                        </Link>
                                        <Link
                                            href="/dashboard/patterns"
                                            className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-[var(--text-primary)] transition-all"
                                        >
                                            View All Issues
                                        </Link>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] text-center border-t border-white/5 pt-3">
                                    Detected by NorthReport
                                </p>
                            </div>
                        </motion.div>
                    ) : null}
                </div>
            </main>
        </AppShell >
    );
}
