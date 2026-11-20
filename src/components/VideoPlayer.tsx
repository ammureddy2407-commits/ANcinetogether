import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Sparkles,
  ExternalLink,
  Upload,
  AlertCircle,
  CheckCircle2,
  Youtube,
} from 'lucide-react';
import { ContentItem, PlaybackSyncState, AmbientLightingMood } from '../types';

interface VideoPlayerProps {
  content: ContentItem;
  syncState: PlaybackSyncState;
  onUpdatePlayback: (isPlaying: boolean, currentTime: number) => void;
  onOpenContentSelector: () => void;
  onOpenYouTube?: () => void;
  onMovieEnded?: () => void;
  syncStatus: 'synced' | 'syncing';
  ambientLighting: AmbientLightingMood;
  ambientLightingEnabled?: boolean;
  localFileObj?: File | null;
  onUploadLocalFile?: (file: File) => void;
  isDataChannelActive?: boolean;
  latencyMs?: number;
  onToggleExpanded?: () => void;
  onToggleScreenShare?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  content,
  syncState,
  onUpdatePlayback,
  onOpenContentSelector,
  onOpenYouTube,
  onMovieEnded,
  syncStatus,
  ambientLighting,
  ambientLightingEnabled = true,
  localFileObj,
  onUploadLocalFile,
  isDataChannelActive,
  latencyMs,
  onToggleExpanded,
  onToggleScreenShare,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(content.durationSeconds || 100);
  const [isPlaying, setIsPlaying] = useState(syncState.isPlaying);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [nothingSelectedNotice, setNothingSelectedNotice] = useState(false);

  const controlsTimeoutRef = useRef<any>(null);

  // If local file object provided, create object URL
  useEffect(() => {
    if (localFileObj) {
      const url = URL.createObjectURL(localFileObj);
      setLocalVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [localFileObj]);

  // Synchronize playback with syncState from host or partner
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check time drift: tightened to 0.4s for instant WebRTC DataChannel precision
    const drift = Math.abs(video.currentTime - syncState.currentTime);
    if (drift > 0.4) {
      video.currentTime = syncState.currentTime;
      setCurrentTime(syncState.currentTime);
    }

    if (syncState.isPlaying && video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch((err) => {
        console.warn('Browser autoplay prevented, trying muted fallback:', err);
        // Modern browsers allow muted playback without user interaction
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(true);
        }).catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
      });
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setIsPlaying(false);
      setAutoplayBlocked(false);
    }
  }, [syncState]);

  const handleUnmuteAutoplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    video.volume = volume;
    video.play().catch(() => {});
    setIsPlaying(true);
    setAutoplayBlocked(false);
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (content.id === 'nothing-selected') {
      setNothingSelectedNotice(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (autoplayBlocked) {
      handleUnmuteAutoplay();
      return;
    }

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        onUpdatePlayback(true, video.currentTime);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      onUpdatePlayback(false, video.currentTime);
    }
  }, [onUpdatePlayback, autoplayBlocked, volume, content.id]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      onUpdatePlayback(isPlaying, targetTime);
    }
  };

  const jumpSeconds = (amount: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    onUpdatePlayback(isPlaying, target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  };

  const toggleFullscreen = () => {
    setIsFullscreen((expanded) => !expanded);
    onToggleExpanded?.();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpSeconds(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpSeconds(10);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Mouse move to show controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3200);
  };

  // Ambient lighting glow style
  const getAmbientClass = () => {
    if (ambientLightingEnabled === false || ambientLighting === 'pure-oled') {
      return 'shadow-2xl';
    }
    switch (ambientLighting) {
      case 'candlelight':
        return 'shadow-[0_0_120px_rgba(245,158,11,0.28)]';
      case 'midnight':
        return 'shadow-[0_0_120px_rgba(59,130,246,0.25)]';
      case 'cinema':
        return 'shadow-[0_0_100px_rgba(161,161,170,0.22)]';
      case 'neon-rose':
        return 'shadow-[0_0_120px_rgba(244,63,94,0.30)]';
      default:
        return 'shadow-2xl';
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onUploadLocalFile) {
        onUploadLocalFile(file);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-full flex flex-col items-center justify-center bg-black/95 overflow-hidden select-none transition-all duration-700 ${getAmbientClass()}`}
    >
      {/* Dynamic Ambient Lighting Aura behind Player Canvas */}
      {ambientLightingEnabled !== false && ambientLighting !== 'pure-oled' && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
            ambientLighting === 'candlelight'
              ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-amber-950/10 to-transparent'
              : ambientLighting === 'midnight'
              ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/15 via-indigo-950/10 to-transparent'
              : ambientLighting === 'cinema'
              ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-400/12 via-zinc-800/10 to-transparent'
              : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-500/18 via-pink-950/10 to-transparent'
          }`}
        />
      )}
      {/* 1. DRM / EXTERNAL COMPLIANT SERVICE MODE */}
      {content.type === 'external_service' ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-zinc-900 to-black">
          <div className="max-w-xl mx-auto space-y-4 p-8 rounded-3xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Film className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Watch on {content.externalServiceName || 'External Service'}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              To protect copyright and comply with service guidelines, DRM-protected video streams cannot be directly embedded.
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 text-left text-xs space-y-2 border border-white/5">
              <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>How to watch together with CineTogether:</span>
              </div>
              <p className="text-zinc-400">1. Click below to open {content.title} in {content.externalServiceName} in a second window.</p>
              <p className="text-zinc-400">2. Keep CineTogether open here for live camera feeds, romantic audio, and instant chat.</p>
              <p className="text-zinc-400">3. Count down “3, 2, 1, Play!” in chat to start together!</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <a
                href={content.externalUrl || 'https://netflix.com'}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-900/50"
              >
                <span>Open in {content.externalServiceName || 'Service'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onOpenContentSelector}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors"
              >
                Choose Free Cinema Stream
              </button>
            </div>
          </div>
        </div>
      ) : content.type === 'youtube' ? (
        /* 2. YOUTUBE EMBED PLAYER */
        <div className="relative w-full h-full flex items-center justify-center">
          <iframe
            src={content.videoUrl}
            title={content.title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : content.id === 'nothing-selected' ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-zinc-900 to-black">
          <div className="max-w-md space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 text-zinc-400 flex items-center justify-center mx-auto border border-white/10">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nothing selected</h2>
              <p className="text-sm text-zinc-400 mt-2">Choose a movie or start screen sharing to begin watching together.</p>
            </div>
            <button onClick={togglePlay} className="mx-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Play
            </button>
            {nothingSelectedNotice && <p role="status" className="text-xs text-rose-300">Nothing selected</p>}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={onOpenContentSelector} className="text-xs text-rose-300 hover:text-white underline underline-offset-4">Choose a movie</button>
              {onToggleScreenShare && (
                <button onClick={onToggleScreenShare} className="text-xs text-cyan-300 hover:text-white underline underline-offset-4">Share your screen</button>
              )}
            </div>
          </div>
        </div>
      ) : (!localVideoUrl && !content.videoUrl) ? (
        /* Notice when partner has local file on their machine */
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-zinc-900 to-black">
          <div className="max-w-md mx-auto space-y-4 p-8 rounded-3xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Film className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Local Movie on Partner's Device
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your partner selected a local movie file (<span className="text-rose-400 font-semibold">{content.title}</span>) stored on their device.
            </p>
            <div className="p-3.5 rounded-xl bg-zinc-900 text-left text-xs space-y-1.5 border border-white/5">
              <p className="text-zinc-300 font-semibold">How to watch together:</p>
              <p className="text-zinc-400">1. Ask your partner to tap <span className="text-cyan-400 font-semibold">Share Screen</span> at the top to stream their screen live.</p>
              <p className="text-zinc-400">2. Or choose a synchronized movie from our online cinema catalog below!</p>
            </div>
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
              <button
                onClick={onOpenContentSelector}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
              >
                Choose Online Movie
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. HTML5 DIRECT STREAM OR LOCAL FILE */
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={localVideoUrl || content.videoUrl}
            className="w-full h-full object-contain"
            playsInline
            onClick={togglePlay}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || content.durationSeconds || 100);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (onMovieEnded) onMovieEnded();
            }}
          />

          {/* Quick Center Click Indicator on Pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl z-10"
              title="Play Video"
            >
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            </button>
          )}
        </div>
      )}

      {/* AUTOPLAY UNMUTE BANNER */}
      {autoplayBlocked && (
        <button
          onClick={handleUnmuteAutoplay}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 cursor-pointer bg-rose-600/95 hover:bg-rose-500 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce active:scale-95 transition-all border border-rose-400/40"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Movie playing! Tap here to unmute sound 🔊</span>
        </button>
      )}

      {/* SYNC STATUS PILL */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-zinc-200 pointer-events-auto shadow-md">
        {isDataChannelActive ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <span className="font-semibold text-emerald-300">
              ⚡ WebRTC P2P ({latencyMs && latencyMs > 0 ? `${latencyMs}ms` : '<20ms'})
            </span>
          </>
        ) : (
          <>
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? 'bg-cyan-400' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-medium text-zinc-300">
              {syncStatus === 'synced' ? '● Playback Synced' : '⚠ Syncing playback…'}
            </span>
          </>
        )}
      </div>

      {/* TOP RIGHT CONTENT INFO & CHANGER */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {content.type === 'youtube' && (
          <div className="hidden sm:flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-md backdrop-blur-md">
            <Youtube className="w-3.5 h-3.5 fill-white" />
            <span>YouTube Active</span>
          </div>
        )}

        <button
          onClick={onOpenYouTube || onOpenContentSelector}
          className="px-3 py-1.5 bg-red-600/85 hover:bg-red-600 backdrop-blur-md border border-red-500/40 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          title="Watch YouTube Together"
        >
          <Youtube className="w-3.5 h-3.5 fill-white" />
          <span>Watch YouTube</span>
        </button>

        <button
          onClick={onOpenContentSelector}
          className="px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 rounded-xl text-xs font-medium text-white transition-all flex items-center gap-1.5 shadow-lg"
        >
          <Film className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Change Movie</span>
        </button>
      </div>

      {/* BOTTOM CINEMATIC CONTROLS BAR (For HTML5 & Local Video) */}
      {content.type !== 'external_service' && content.type !== 'youtube' && (
        <div
          className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 sm:px-6 pt-10 pb-4 transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Scrubber */}
          <div className="relative group/timeline w-full flex items-center mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-white">
            {/* Left Controls: Play, Skips, Timestamp */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => jumpSeconds(-10)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => jumpSeconds(10)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Timestamp */}
              <div className="text-xs font-mono text-zinc-300 pl-1 select-none">
                <span>{formatTime(currentTime)}</span>
                <span className="text-zinc-500 mx-1">/</span>
                <span className="text-zinc-500">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume, Title, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden md:inline text-xs font-medium text-zinc-300 max-w-[200px] truncate">
                {content.title}
              </span>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for local video picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleLocalFileSelect}
        className="hidden"
      />
    </div>
  );
};
