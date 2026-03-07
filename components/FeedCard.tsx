'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SeverityChip from './SeverityChip';

export interface FeedItem {
  id: string;
  source: 'voice' | 'report';
  type: 'story' | 'post' | 'report';
  userId: string;
  displayName: string;
  neighborhood: string;
  caption: string;
  aiSummary: string | null;
  severity: string | null;
  locationApprox: { cellId: string; label: string } | null;
  mediaUrl: string | null;
  upvotes: number;
  commentCount: number;
  repostCount: number;
  feedScore: number;
  isTrending: boolean;
  linkedReportId: string | null;
  linkedVoiceId: string | null;
  status: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface FeedCardProps {
  item: FeedItem;
  onExplain?: (item: FeedItem) => void;
  onSelect?: (item: FeedItem) => void;
  isLeader?: boolean;
  onConvert?: (id: string) => void;
  onFile311?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  hover: { y: -2, boxShadow: 'var(--shadow-paper-lg)' },
};

export default function FeedCard({ item, onExplain, onSelect, isLeader, onConvert, onFile311 }: FeedCardProps) {
  const [localUpvotes, setLocalUpvotes] = useState(item.upvotes);
  const [voted, setVoted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voted) return;
    setVoted(true);
    setLocalUpvotes((v) => v + 1);
    try {
      const endpoint =
        item.source === 'report'
          ? `/api/reports/${item.id}/vote`
          : `/api/voices/${item.id}/vote`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) {
        setVoted(false);
        setLocalUpvotes((v) => v - 1);
      }
    } catch {
      setVoted(false);
      setLocalUpvotes((v) => v - 1);
    }
  };

  const loadComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.source !== 'voice') return;
    setShowComments(!showComments);
    if (!showComments) {
      const res = await fetch(`/api/voices/${item.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || item.source !== 'voice') return;
    const res = await fetch(`/api/voices/${item.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [data, ...prev]);
      setCommentText('');
    }
  };

  const typeIcon =
    item.type === 'story' ? '📖' : item.type === 'report' ? '📋' : '💬';

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => onSelect?.(item)}
      className="incident-card paper-texture"
    >
      {/* Header */}
      <div className="incident-card__header">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{
              background: 'var(--accent-muted)',
              color: 'var(--accent-primary)'
            }}
          >
            {item.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium truncate" style={{ color: 'var(--ink-primary)' }}>
                {item.displayName}
              </span>
              <span style={{ color: 'var(--ink-muted)' }}>·</span>
              <span className="incident-card__time">{timeAgo(item.createdAt)}</span>
            </div>
            {item.locationApprox && (
              <span className="chip-location text-xs mt-1">
                📍 {item.locationApprox.label}
              </span>
            )}
          </div>
        </div>
        <span className="text-lg">{typeIcon}</span>
      </div>

      <hr className="incident-card__divider" />

      {/* Media */}
      {item.mediaUrl && item.mediaUrl.startsWith('data:image') && (
        <div className="rounded-lg overflow-hidden mb-3" style={{ border: '1px solid var(--border-hairline)' }}>
          <img src={item.mediaUrl} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {/* Caption */}
      <p className="incident-card__title">{item.caption}</p>

      {/* AI Summary */}
      {item.aiSummary && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg mb-3"
          style={{
            background: 'var(--accent-muted)',
            border: '1px solid rgba(196, 90, 59, 0.2)'
          }}
        >
          <span className="text-xs">🤖</span>
          <p className="incident-card__excerpt italic">
            {item.aiSummary}
          </p>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <SeverityChip severity={item.severity} />
        {item.isTrending && (
          <span className="status-chip status-chip--warning">
            🔥 Trending
          </span>
        )}
        {item.status && item.source === 'report' && (
          <span className="chip-location">{item.status}</span>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: '1px solid var(--border-hairline)' }}
      >
        <button
          onClick={handleVote}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{
            color: voted ? 'var(--accent-primary)' : 'var(--ink-secondary)'
          }}
        >
          <span>▲</span> {localUpvotes}
        </button>

        {item.source === 'voice' && (
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--ink-secondary)' }}
          >
            💬 {item.commentCount}
          </button>
        )}

        {item.source === 'voice' && (
          <button
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--ink-secondary)' }}
          >
            🔄 {item.repostCount}
          </button>
        )}

        {onExplain && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplain(item);
            }}
            className="ml-auto btn-ghost text-xs"
            style={{ color: 'var(--accent-primary)' }}
          >
            Ask NorthReport
          </button>
        )}
      </div>

      {/* Leader actions */}
      {isLeader && (
        <div
          className="flex items-center gap-2 pt-3 mt-3"
          style={{ borderTop: '1px solid var(--border-hairline)' }}
        >
          {item.source === 'report' && !item.linkedVoiceId && (
            <button
              onClick={(e) => { e.stopPropagation(); onFile311?.(item.id); }}
              className="status-chip status-chip--critical text-[10px]"
            >
              File to 311
            </button>
          )}
          {item.source === 'voice' && !item.linkedReportId && (
            <button
              onClick={(e) => { e.stopPropagation(); onConvert?.(item.id); }}
              className="status-chip status-chip--caution text-[10px]"
            >
              Convert to Report
            </button>
          )}
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div
          className="space-y-2 pt-3 mt-3"
          style={{ borderTop: '1px solid var(--border-hairline)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="Add a comment..."
              className="input-paper flex-1 text-sm py-2"
              maxLength={300}
            />
            <button onClick={addComment} className="btn-primary px-4 py-2 text-sm">
              Post
            </button>
          </div>
          {comments.map((c) => (
            <div key={c.id} className="text-sm space-y-0.5">
              <span className="font-medium text-xs" style={{ color: 'var(--ink-primary)' }}>
                {c.displayName || 'User'}
              </span>
              <p style={{ color: 'var(--ink-secondary)' }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
