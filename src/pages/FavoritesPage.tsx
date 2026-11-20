import React from 'react';
import { Heart, Play, Trash2, Film, Plus } from 'lucide-react';
import { ContentItem } from '../types';

interface FavoritesPageProps {
  favorites: ContentItem[];
  onWatchMovie: (movie: ContentItem) => void;
  onRemoveFavorite: (movie: ContentItem) => void;
  onExploreMovies: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favorites,
  onWatchMovie,
  onRemoveFavorite,
  onExploreMovies,
}) => {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#080808]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>Saved for Date Night</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Favorites</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Curated wishlist for future cozy movie dates.
          </p>
        </div>

        <button
          onClick={onExploreMovies}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl border border-white/5 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Browse More</span>
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 space-y-3 max-w-md mx-auto mt-12">
          <Heart className="w-12 h-12 text-zinc-700 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-semibold text-white">Your movie night list is empty 🍿</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Click the heart icon on any title you come across to save it for your next date.
          </p>
          <button
            onClick={onExploreMovies}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Find Something to Watch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((movie) => (
            <div
              key={movie.id}
              className="group rounded-3xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <button
                    onClick={() => onRemoveFavorite(movie)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-rose-950/80 text-rose-400 backdrop-blur-md transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2 left-3 text-[11px] text-zinc-300 font-mono">
                    {movie.duration} · {movie.year}
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-sm text-white group-hover:text-rose-200 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {movie.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
                    {movie.genre.map((g, idx) => (
                      <React.Fragment key={g}>
                        {idx > 0 && <span>·</span>}
                        <span>{g}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => onWatchMovie(movie)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch Together Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
