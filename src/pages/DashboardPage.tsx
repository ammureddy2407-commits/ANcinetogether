import React from 'react';
import {
  Sparkles,
  Play,
  Heart,
  DoorOpen,
  Clock,
  ArrowRight,
  Plus,
  Users,
  Video,
  Film,
  Bookmark,
  Share2,
  Youtube,
} from 'lucide-react';
import { ContentItem, Page, Room, UserProfile, WatchHistoryItem } from '../types';
import { FEATURED_MOVIES } from '../data/mockContent';

interface DashboardPageProps {
  user: UserProfile;
  favorites: ContentItem[];
  watchHistory: WatchHistoryItem[];
  recentRooms: Room[];
  onStartRoomWithMovie: (item: ContentItem) => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onNavigate: (page: Page) => void;
  onToggleFavorite: (item: ContentItem) => void;
  onRejoinRoom: (room: Room) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  favorites,
  watchHistory,
  recentRooms,
  onStartRoomWithMovie,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onNavigate,
  onToggleFavorite,
  onRejoinRoom,
}) => {
  const continueWatchingItems = watchHistory.filter((h) => h.progressPercent < 100);
  const heroMovie = FEATURED_MOVIES[0]; // Tears of Steel

  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#141414] via-[#1a1215] to-[#121212] border border-white/10 p-6 sm:p-10 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-rose-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Welcome back, {user.name.split(' ')[0]}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready for movie night?
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
              Connect with {user.partnerNickname || 'your partner'} across any distance. Start a synchronized theater room or jump back into your recent dates.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenCreateRoom}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-rose-950 transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Room</span>
              </button>

              <button
                onClick={onOpenJoinRoom}
                className="px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors flex items-center gap-2"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Join Room</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* CONTINUE WATCHING SECTION */}
        {continueWatchingItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Continue Watching
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Pick up right where you two paused</p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>View all history</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueWatchingItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-white/20 transition-all flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={item.content.thumbnail}
                      alt={item.content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => onStartRoomWithMovie(item.content)}
                        className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950 transition-transform group-hover:scale-110 active:scale-95"
                        title="Resume in Room"
                      >
                        <Play className="w-5 h-5 fill-white translate-x-0.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-xs text-white truncate max-w-[200px]">
                        {item.content.title}
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {item.progressPercent}% finished · with {item.watchedWith}
                      </p>
                    </div>
                    <button
                      onClick={() => onStartRoomWithMovie(item.content)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED / TRENDING CATALOG */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Featured For Date Night
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Full-length cinematic movies & romance experiences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_MOVIES.map((movie) => {
              const isFav = favorites.some((f) => f.id === movie.id);
              return (
                <div
                  key={movie.id}
                  className="group rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {movie.type === 'youtube' && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow backdrop-blur-md">
                          <Youtube className="w-3 h-3 fill-white" />
                          <span>YouTube</span>
                        </div>
                      )}

                      {/* Favorite Toggle Button */}
                      <button
                        onClick={() => onToggleFavorite(movie)}
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md transition-colors text-white"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFav ? 'text-rose-500 fill-rose-500' : 'text-zinc-300'
                          }`}
                        />
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
                      onClick={() => onStartRoomWithMovie(movie)}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch in Room</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* YOUR FAVORITES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Your Favorites</span>
                <span className="text-xs text-rose-400 font-medium">({favorites.length})</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Movies you saved for your next cozy night</p>
            </div>
            <button
              onClick={() => onNavigate('favorites')}
              className="text-xs text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {favorites.length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 space-y-2">
              <Heart className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-medium text-zinc-400">Your movie night list is empty 🍿</p>
              <button
                onClick={() => onStartRoomWithMovie(FEATURED_MOVIES[0])}
                className="text-xs text-rose-400 hover:underline"
              >
                Find Something to Watch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => onStartRoomWithMovie(fav)}
                  className="group rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-rose-500/40 cursor-pointer transition-all p-2.5"
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-2">
                    <img
                      src={fav.thumbnail}
                      alt={fav.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="font-semibold text-xs text-white truncate">{fav.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{fav.duration}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT ROOMS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Recent Rooms
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Jump right back into active or past sessions</p>
            </div>
          </div>

          {recentRooms.length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 space-y-2">
              <DoorOpen className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-medium text-zinc-400">No movie rooms yet.</p>
              <button
                onClick={onOpenCreateRoom}
                className="text-xs text-rose-400 hover:underline"
              >
                Create Your First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono font-bold text-xs border border-rose-500/20">
                      CT
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">{room.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Code: <span className="font-mono text-rose-300">{room.code}</span> · {room.createdAt}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRejoinRoom(room)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-rose-600 text-xs font-semibold text-white rounded-xl transition-colors shrink-0"
                  >
                    Enter Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
