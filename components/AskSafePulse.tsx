'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer';
import type { FeedItem } from './FeedCard';

interface AskNorthReportProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ExplainResult {
  summaryBullets: string[];
  whyItMatters: string;
  riskLevel: string;
  evidence: string[];
  suggestedNextActions: string[];
}

export default function AskNorthReport({ item, isOpen, onClose }: AskNorthReportProps) {
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');

  const handleAsk = async (customQuestion?: string) => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'item',
          itemId: item.id,
          itemSource: item.source,
          question: customQuestion || null,
        }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!result && !loading) handleAsk();
  };

  // Trigger on open
  if (isOpen && !result && !loading && item) {
    handleOpen();
  }

  const handleClose = () => {
    setResult(null);
    setQuestion('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg glass-card p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#6366f1]">Ask NorthReport</h3>
              <button onClick={handleClose} className="text-[#888] hover:text-white text-xl">
                ✕
              </button>
            </div>

            <p className="text-sm text-[#888] line-clamp-2">{item.caption}</p>

            {loading && (
              <div className="flex items-center gap-2 py-8">
                <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="text-sm text-[#888] ml-2">Analyzing...</span>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Summary */}
                <div>
                  <h4 className="text-xs font-semibold text-[#888] uppercase mb-2">Summary</h4>
                  <ul className="space-y-1">
                    {result.summaryBullets.map((b, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-[#6366f1]">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Why it matters */}
                <div>
                  <h4 className="text-xs font-semibold text-[#888] uppercase mb-2">Why It Matters</h4>
                  <p className="text-sm text-[#ccc]">{result.whyItMatters}</p>
                  <AudioPlayer text={result.whyItMatters} />
                </div>

                {/* Risk */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#888]">Risk Level:</span>
                  <span
                    className={`text-xs font-bold ${
                      result.riskLevel === 'critical'
                        ? 'text-red-400'
                        : result.riskLevel === 'high'
                        ? 'text-orange-400'
                        : result.riskLevel === 'medium'
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {result.riskLevel.toUpperCase()}
                  </span>
                </div>

                {/* Evidence */}
                {result.evidence.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#888] uppercase mb-2">Evidence</h4>
                    <ul className="space-y-1">
                      {result.evidence.map((e, i) => (
                        <li key={i} className="text-xs text-[#aaa]">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested actions */}
                <div>
                  <h4 className="text-xs font-semibold text-[#888] uppercase mb-2">Suggested Actions</h4>
                  <ul className="space-y-1">
                    {result.suggestedNextActions.map((a, i) => (
                      <li key={i} className="text-sm text-[#6366f1]">
                        → {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Follow-up question */}
            {result && (
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && question.trim()) {
                      handleAsk(question);
                      setQuestion('');
                    }
                  }}
                  placeholder="Ask a follow-up..."
                  className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#6366f1]"
                />
                <button
                  onClick={() => {
                    if (question.trim()) {
                      handleAsk(question);
                      setQuestion('');
                    }
                  }}
                  className="px-3 py-2 bg-[#6366f1] rounded-lg text-sm"
                >
                  Ask
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
