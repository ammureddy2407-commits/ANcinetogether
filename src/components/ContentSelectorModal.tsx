import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Search,
  Upload,
  Film,
  ExternalLink,
  Youtube,
  Bookmark,
  Clock,
  Check,
  Sparkles,
  AlertTriangle,
  Play,
  Heart,
  Link2,
} from 'lucide-react';
import { ContentItem } from '../types';
import { FEATURED_MOVIES, EXTERNAL_SERVICES } from '../data/mockContent';

interface ContentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContent: (item: ContentItem) => void;
  onSelectLocalFile: (file: File) => void;
  favorites: ContentItem[];
  currentContentId?: string;
  initialTab?: 'youtube' | 'online' | 'local' | 'services' | 'favorites';
}

export const ContentSelectorModal: React.FC<ContentSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectContent,
  onSelectLocalFile,
  favorites,
  currentContentId,
  initialTab = 'youtube',
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'online' | 'services' | 'local' | 'favorites'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [customYtUrl, setCustomYtUrl] = useState('');
  const [ytError, setYtError] = useState('');
  const [selectedLocalFileName, setSelectedLocalFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const extractYouTubeId = (url: string): string => {
    const trimmed = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return '';
  };

  const handleCustomYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setYtError('');
    if (!customYtUrl.trim()) return;

    const videoId = extractYouTubeId(customYtUrl);

    if (!videoId) {
      setYtError('Please enter a valid YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    const customItem: ContentItem = {
      id: `custom-yt-${videoId}`,
      title: 'YouTube Stream',
      description: 'Synchronized YouTube video selected for virtual movie night.',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: 'YouTube Video',
      durationSeconds: 3600,
      genre: ['YouTube', 'Video'],
      year: 2025,
      rating: 'All',
      type: 'youtube',
      videoUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
    };

    onSelectContent(customItem);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedLocalFileName(file.name);
      onSelectLocalFile(file);
      onClose();
    }
  };

  const youtubeMovies = FEATURED_MOVIES.filter((m) => m.type === 'youtube');
  const onlineFilms = FEATURED_MOVIES.filter((m) => m.type === 'stream');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              <span>Choose What to Watch Together</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Watch YouTube videos, high-definition online cinema, or files from your computer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS BAR */}
        <div className="px-5 pt-3 pb-2 border-b border-white/5 flex items-center gap-2 bg-[#141414] overflow-x-auto no-scrollbar">
          {/* 1. DEDICATED YOUTUBE TAB */}
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-md shadow-red-950'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Youtube className="w-4 h-4 text-white" />
            <span>YouTube Videos</span>
          </button>

          {/* 2. 4K ONLINE FILMS TAB */}
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'online'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Online Films & 4K</span>
          </button>

          {/* 3. LOCAL FILE TAB */}
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'local'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Watch from Device</span>
          </button>

          {/* 4. STREAMING SERVICES TAB */}
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'services'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Netflix, Prime, Disney+</span>
          </button>

          {/* 5. FAVORITES TAB */}
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ================= 1. DEDICATED YOUTUBE TAB ================= */}
          {activeTab === 'youtube' && (
            <div className="space-y-6">
              {/* URL Input Form */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                    <Youtube className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Watch Any YouTube Video Together</h3>
                    <p className="text-xs text-zinc-400">
                      Paste any public or unlisted YouTube video, trailer, full movie, or stream.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCustomYouTubeSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customYtUrl}
                      onChange={(e) => setCustomYtUrl(e.target.value)}
                      placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
                      className="w-full bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-3 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-950 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Together</span>
                  </button>
                </form>

                {ytError && <p className="text-xs text-rose-400">{ytError}</p>}

                {/* Quick Samples Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                  <span className="text-zinc-500">Quick suggestions:</span>
                  <button
                    type="button"
                    onClick={() => setCustomYtUrl('https://www.youtube.com/watch?v=36YnV9STBqc')}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                  >
                    Rainy Paris 4K
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomYtUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk')}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                  >
                    Ghibli Piano Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomYtUrl('https://www.youtube.com/watch?v=WjqiU5FGSYg')}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                  >
                    The Present (Short Film)
                  </button>
                </div>
              </div>

              {/* Curated YouTube Movies & Streams */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Curated Date Night YouTube Films & Streams
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youtubeMovies.map((movie) => {
                    const isCurrent = movie.id === currentContentId;
                    return (
                      <div
                        key={movie.id}
                        onClick={() => {
                          onSelectContent(movie);
                          onClose();
                        }}
                        className={`group relative rounded-2xl overflow-hidden bg-zinc-900 border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                          isCurrent
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-white/5 hover:border-red-500/40'
                        }`}
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <img
                            src={movie.thumbnail}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow">
                            <Youtube className="w-3 h-3 fill-white" />
                            <span>YouTube</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2 text-[11px] text-zinc-300 font-mono">
                            {movie.duration}
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="font-bold text-xs text-white group-hover:text-red-300 transition-colors truncate">
                            {movie.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                            {movie.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ONLINE 4K FILMS TAB ================= */}
          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, sci-fi, romance, animation…"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineFilms.map((movie) => {
                  const isCurrent = movie.id === currentContentId;
                  return (
                    <div
                      key={movie.id}
                      onClick={() => {
                        onSelectContent(movie);
                        onClose();
                      }}
                      className={`group relative rounded-2xl overflow-hidden bg-zinc-900/80 border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                        isCurrent
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-zinc-300">
                          <span className="font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                            {movie.duration}
                          </span>
                          <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                            {movie.year} · {movie.rating}
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors truncate">
                          {movie.title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {movie.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 3. LOCAL FILE PLAYBACK TAB ================= */}
          {activeTab === 'local' && (
            <div className="max-w-xl mx-auto py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-600/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Watch Video Stored on Your Device
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-md mx-auto">
                  Play your personal movies, home videos, or downloaded media files smoothly in full 1080p/4K resolution directly inside CineTogether.
                </p>
              </div>

              {/* Legal / Synchronization Info Box */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>How Local Synchronization Works:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Your video is loaded locally inside your browser and is <strong>never uploaded to external servers</strong> for privacy and instant speed.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  To watch together, both viewers need the same file on their device, or you can start playing while CineTogether synchronizes timestamps and play/pause commands!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-rose-950 flex items-center gap-2 mx-auto active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Video File (.mp4, .webm, .ogg)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedLocalFileName && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs inline-flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Selected: {selectedLocalFileName}</span>
                </div>
              )}
            </div>
          )}

          {/* ================= 4. EXTERNAL SERVICES TAB ================= */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-white">Compliance Notice: </span>
                Services like Netflix, Amazon Prime, and Disney+ protect their copyrighted streams with DRM. To respect platform terms, open the service alongside CineTogether and keep this room active for live camera and synced chat!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXTERNAL_SERVICES.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-2xl bg-zinc-900/70 border border-white/5 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-base">{svc.title}</h4>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          Official
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{svc.description}</p>
                      <p className="text-[11px] text-zinc-500 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        {svc.complianceNote}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <a
                        href={svc.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 text-center text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Open in {svc.title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => {
                          onSelectContent({
                            id: svc.id,
                            title: svc.title,
                            description: svc.description,
                            thumbnail: svc.logoUrl,
                            duration: 'External Service',
                            durationSeconds: 0,
                            genre: ['Streaming'],
                            year: 2025,
                            rating: 'All',
                            type: 'external_service',
                            externalServiceName: svc.externalServiceName,
                            externalUrl: svc.externalUrl,
                          });
                          onClose();
                        }}
                        className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                      >
                        Set as Room Theme
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 5. FAVORITES TAB ================= */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Heart className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-400">Your favorites list is empty 🍿</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Click the heart icon on any movie in the catalog to save it for your next date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => {
                        onSelectContent(fav);
                        onClose();
                      }}
                      className="group p-3 rounded-2xl bg-zinc-900 border border-white/5 hover:border-rose-500/40 cursor-pointer transition-all"
                    >
                      <div className="aspect-video w-full rounded-xl overflow-hidden mb-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
