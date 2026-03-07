'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function ContentComposer({ isOpen, onClose, onCreated }: ContentComposerProps) {
  const [type, setType] = useState<'story' | 'post'>('post');
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      setError('Image must be under 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Get user location
      let latitude = 43.2557;
      let longitude = -79.8711;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // Use Waterloo center as default
      }

      // Submit to the correct endpoint based on type
      const endpoint = type === 'post' ? '/api/posts' : '/api/stories';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          mediaBase64: imagePreview || null,
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create');
        return;
      }

      setCaption('');
      setImagePreview(null);
      onClose();
      onCreated?.();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg glass-card p-6 space-y-4 rounded-b-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Share Your Thoughts</h3>
              <button onClick={onClose} className="text-[#888] hover:text-white text-xl">
                ✕
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setType('post')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'post' ? 'bg-[#6366f1] text-white' : 'bg-white/10 text-[#888]'
                }`}
              >
                Post (Permanent)
              </button>
              <button
                onClick={() => setType('story')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'story' ? 'bg-[#6366f1] text-white' : 'bg-white/10 text-[#888]'
                }`}
              >
                Story (24h)
              </button>
            </div>

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening in your neighborhood?"
              className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none resize-none h-28 focus:ring-1 focus:ring-[#6366f1]"
              maxLength={500}
            />
            <div className="text-xs text-[#888] text-right">{caption.length}/500</div>

            {/* Image upload */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="" className="w-full max-h-40 object-cover rounded-xl" />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm text-[#888] hover:border-white/40 transition-colors"
              >
                + Add Photo (optional)
              </button>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !caption.trim()}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Sharing...' : `Share ${type === 'story' ? 'Story' : 'Post'}`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
