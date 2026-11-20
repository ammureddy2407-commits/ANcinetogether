import React, { useState } from 'react';
import { Star, Heart, Film, ArrowRight, Sparkles, Check } from 'lucide-react';
import { ContentItem } from '../types';

interface MovieEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  partnerName: string;
  onSelectNextMovie: () => void;
  onSaveRating: (rating: number, review: string) => void;
}

export const MovieEndModal: React.FC<MovieEndModalProps> = ({
  isOpen,
  onClose,
  content,
  partnerName,
  onSelectNextMovie,
  onSaveRating,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRating(rating, review);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center">
        {/* Top Celebration Banner */}
        <div className="p-6 bg-gradient-to-b from-rose-950/40 to-transparent flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 ring-1 ring-rose-500/30">
            <Heart className="w-8 h-8 fill-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Rate Your Movie Night ❤️
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            You just finished watching <span className="text-white font-medium">“{content.title}”</span> together with {partnerName}.
          </p>
        </div>

        {/* Rating Stars */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400 drop-shadow'
                      : 'text-zinc-700'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-rose-300">
            {rating === 5 && 'Pure cinematic perfection & romance! 🥰'}
            {rating === 4 && 'Loved it, memorable date night! 🍿'}
            {rating === 3 && 'Decent movie, great company! ✨'}
            {rating <= 2 && 'Good thing the company was great! 😂'}
          </p>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a sweet memory, inside joke, or favorite scene from tonight…"
            rows={3}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 resize-none"
          />

          {saved && (
            <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Saved to your Watch Memories & History!</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {!saved ? (
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-rose-950"
              >
                Save Movie Night Memory
              </button>
            ) : null}

            <button
              onClick={() => {
                onSelectNextMovie();
                onClose();
              }}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Film className="w-4 h-4 text-rose-400" />
              <span>Choose Next Movie</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
