import React from 'react';
import { Clock, Play, Star, Heart, Calendar, Sparkles } from 'lucide-react';
import { ContentItem, WatchHistoryItem } from '../types';

interface HistoryPageProps {
  history: WatchHistoryItem[];
  onWatchMovie: (movie: ContentItem) => void;
  onExploreMovies: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onWatchMovie,
  onExploreMovies,
}) => {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#080808]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" />
          <span>Memories & Log</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Watch History</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Relive your favorite virtual movie dates, shared ratings, and memories.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 space-y-3 max-w-md mx-auto mt-12">
          <Clock className="w-12 h-12 text-zinc-700 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-semibold text-white">Your movie adventures will appear here.</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every movie you watch together will be preserved with your notes and ratings.
          </p>
          <button
            onClick={onExploreMovies}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Find Something to Watch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/5 hover:border-white/15 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
            >
              {/* Left thumbnail & title */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                  <img
                    src={item.content.thumbnail}
                    alt={item.content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.progressPercent < 100 && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-rose-200 transition-colors">
                    {item.content.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{item.watchedAt}</span>
                    </span>
                    <span>·</span>
                    <span className="text-rose-300 font-medium">with {item.watchedWith}</span>
                  </div>
                  {item.reviewNotes && (
                    <p className="text-xs text-zinc-300 italic pt-1 line-clamp-1">
                      “{item.reviewNotes}”
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Rating and Watch Again button */}
              <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 shrink-0">
                {item.rating && (
                  <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= item.rating!
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onWatchMovie(item.content)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{item.progressPercent < 100 ? 'Continue' : 'Watch Again'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
