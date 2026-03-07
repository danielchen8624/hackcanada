'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import FeedCard, { FeedItem } from './FeedCard';
import AskNorthReport from './AskNorthReport';
import DetailDrawer from './DetailDrawer';

interface PulseFeedProps {
  neighborhood: string;
  isLeader?: boolean;
  onItemSelect?: (item: FeedItem) => void;
}

export default function PulseFeed({ neighborhood, isLeader, onItemSelect }: PulseFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [explainItem, setExplainItem] = useState<FeedItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  const fetchFeed = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          neighborhood,
          limit: '20',
          type: typeFilter,
        });
        if (!reset && cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/feed?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (reset) {
            setItems(data.items);
          } else {
            setItems((prev) => [...prev, ...data.items]);
          }
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor && data.items.length > 0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [neighborhood, cursor, typeFilter]
  );

  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neighborhood, typeFilter]);

  const handleConvert = async (voiceId: string) => {
    const res = await fetch(`/api/voices/${voiceId}/convert`, { method: 'POST' });
    if (res.ok) {
      fetchFeed(true);
    }
  };

  const handleFile311 = async (reportId: string) => {
    if (!confirm('Are you sure you want to file this report to 311?')) return;
    const res = await fetch('/api/auto-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Filing initiated! ID: ${data.filingId}`);
    }
  };

  const handleCardSelect = (item: FeedItem) => {
    setSelectedItem(item);
    onItemSelect?.(item);
  };

  // Separate stories for the stories row
  const stories = items.filter((i) => i.type === 'story');
  const feedItems = items;

  const containerVariants = {
    animate: {
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stories row */}
      {stories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {stories.map((story, i) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 flex items-center justify-center text-lg relative"
              onClick={() => setExplainItem(story)}
            >
              <span>{story.displayName.charAt(0).toUpperCase()}</span>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[8px]">📖</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'post', 'story', 'report'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${typeFilter === t
              ? 'bg-[var(--accent-primary)] text-white shadow-lg'
              : 'paper-card text-ink-secondary hover:text-ink-primary'
              }`}
            style={typeFilter === t ? { boxShadow: 'var(--shadow-glow-accent)' } : {}}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <motion.div variants={containerVariants} animate="animate" className="space-y-4">
        {feedItems.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            onExplain={setExplainItem}
            onSelect={handleCardSelect}
            isLeader={isLeader}
            onConvert={handleConvert}
            onFile311={handleFile311}
          />
        ))}
      </motion.div>

      {/* Load more */}
      {hasMore && !loading && (
        <button
          onClick={() => fetchFeed()}
          className="w-full py-4 text-sm text-ink-secondary hover:text-ink-primary transition-colors paper-card"
        >
          Load more
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 paper-card rounded-lg">
          <p className="text-xl mb-2 text-ink-primary">No pulse yet</p>
          <p className="text-sm text-ink-secondary">Be the first to share what's happening</p>
        </div>
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.type === 'report' ? 'Report Details' : 'Post Details'}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-lg font-semibold">
                {selectedItem.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{selectedItem.displayName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{selectedItem.neighborhood}</p>
              </div>
            </div>
            {selectedItem.mediaUrl && (
              <img src={selectedItem.mediaUrl} alt="" className="w-full rounded-xl" />
            )}
            <p className="text-[var(--text-primary)] leading-relaxed">{selectedItem.caption}</p>
            {selectedItem.aiSummary && (
              <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
                <p className="text-xs text-[var(--text-secondary)]">🤖 AI Analysis</p>
                <p className="text-sm text-[var(--text-primary)] mt-1">{selectedItem.aiSummary}</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* Ask NorthReport Modal */}
      <AskNorthReport
        item={explainItem}
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
      />
    </div>
  );
}
