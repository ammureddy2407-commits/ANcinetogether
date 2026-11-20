import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Settings,
  Sparkles,
  Wifi,
  Smile,
} from 'lucide-react';
import { Participant } from '../types';

interface CameraOverlayProps {
  selfStream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  isSpeakerMuted: boolean;
  isSpeaking: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onOpenSettings: () => void;
  partner: Participant;
  selfName: string;
  selfAvatar: string;
  onSimulatePartnerSpeech?: () => void;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  selfStream,
  cameraEnabled,
  micEnabled,
  isSpeakerMuted,
  isSpeaking,
  onToggleCamera,
  onToggleMic,
  onToggleSpeaker,
  onOpenSettings,
  partner,
  selfName,
  selfAvatar,
}) => {
  const selfVideoRef = useRef<HTMLVideoElement>(null);

  // Position state for desktop draggable windows
  const [selfPos, setSelfPos] = useState({ x: 24, y: 70 });
  const [partnerPos, setPartnerPos] = useState({ x: 24, y: 240 });
  const [selfMinimized, setSelfMinimized] = useState(false);
  const [partnerMinimized, setPartnerMinimized] = useState(false);

  // Dragging logic
  const [draggingTarget, setDraggingTarget] = useState<'self' | 'partner' | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (selfVideoRef.current && selfStream) {
      selfVideoRef.current.srcObject = selfStream;
    }
  }, [selfStream]);

  const handleMouseDown = (e: React.MouseEvent, target: 'self' | 'partner') => {
    setDraggingTarget(target);
    const pos = target === 'self' ? selfPos : partnerPos;
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingTarget) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 240, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 160, e.clientY - dragOffsetRef.current.y));

      if (draggingTarget === 'self') {
        setSelfPos({ x: newX, y: newY });
      } else {
        setPartnerPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setDraggingTarget(null);
    };

    if (draggingTarget) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTarget]);

  return (
    <>
      {/* ================= DESKTOP FLOATING CAMERAS ================= */}
      <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
        {/* YOUR CAMERA WINDOW */}
        <div
          style={{
            transform: `translate3d(${selfPos.x}px, ${selfPos.y}px, 0)`,
          }}
          className={`pointer-events-auto absolute transition-shadow duration-200 select-none ${
            selfMinimized ? 'w-44' : 'w-56 lg:w-64'
          } rounded-2xl overflow-hidden bg-[#121212]/90 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/80`}
        >
          {/* Header Drag Bar */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'self')}
            className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 cursor-grab active:cursor-grabbing border-b border-white/5"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {selfName} (You)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraEnabled ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
                title={cameraEnabled ? 'Camera Active' : 'Camera Muted'}
              />
              <button
                onClick={() => setSelfMinimized(!selfMinimized)}
                className="p-1 text-zinc-400 hover:text-white rounded"
                title={selfMinimized ? 'Expand' : 'Minimize'}
              >
                {selfMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Video / Placeholder Area */}
          {!selfMinimized && (
            <div className="relative aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden">
              {cameraEnabled && selfStream ? (
                <video
                  ref={selfVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-3">
                  <div className="relative">
                    <img
                      src={selfAvatar}
                      alt={selfName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full text-zinc-400 border border-white/10">
                      <VideoOff className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-2 font-medium">Camera is off</span>
                </div>
              )}

              {/* Speaking Indicator Border */}
              {isSpeaking && (
                <div className="absolute inset-0 border-2 border-rose-500 pointer-events-none animate-pulse rounded-b-2xl" />
              )}

              {/* Status Badges Overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] text-zinc-300">
                {micEnabled ? (
                  <Mic className="w-3 h-3 text-emerald-400" />
                ) : (
                  <MicOff className="w-3 h-3 text-rose-400" />
                )}
                <span>{micEnabled ? 'Mic on' : 'Muted'}</span>
              </div>
            </div>
          )}
        </div>

        {/* PARTNER CAMERA WINDOW */}
        <div
          style={{
            transform: `translate3d(${partnerPos.x}px, ${partnerPos.y}px, 0)`,
          }}
          className={`pointer-events-auto absolute transition-shadow duration-200 select-none ${
            partnerMinimized ? 'w-48' : 'w-64 lg:w-72'
          } rounded-2xl overflow-hidden bg-[#121212]/90 backdrop-blur-md border border-rose-500/20 shadow-2xl shadow-rose-950/20`}
        >
          {/* Header Drag Bar */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'partner')}
            className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-rose-950/40 to-zinc-900/80 cursor-grab active:cursor-grabbing border-b border-white/5"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-rose-400/60" />
              <span className="text-xs font-semibold text-rose-200 truncate flex items-center gap-1">
                {partner.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </div>
              <button
                onClick={() => setPartnerMinimized(!partnerMinimized)}
                className="p-1 text-zinc-400 hover:text-white rounded"
                title={partnerMinimized ? 'Expand' : 'Minimize'}
              >
                {partnerMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Partner Video / Stream */}
          {!partnerMinimized && (
            <div className="relative aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden">
              {partner.cameraEnabled ? (
                <div className="relative w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=640&q=80"
                    alt="Partner Live Stream"
                    className="w-full h-full object-cover filter brightness-95"
                  />
                  {/* Subtle live ambiance simulation */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-3">
                  <div className="relative">
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-500/40"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full text-rose-400 border border-white/10">
                      <Smile className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[11px] text-rose-200 mt-2 font-medium">
                    {partner.name} is listening
                  </span>
                </div>
              )}

              {/* Partner Speaking Pulse */}
              {partner.isSpeaking && (
                <div className="absolute inset-0 border-2 border-rose-400 pointer-events-none animate-pulse rounded-b-2xl shadow-[inset_0_0_20px_rgba(244,63,94,0.3)]" />
              )}

              {/* Status Overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] text-rose-200 border border-rose-500/20">
                <Mic className="w-3 h-3 text-emerald-400" />
                <span>{partner.isSpeaking ? 'Speaking…' : 'Online'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM DOCKED PARTICIPANTS ================= */}
      <div className="md:hidden w-full px-4 py-2 bg-[#0c0c0c] border-t border-white/10 flex items-center justify-between gap-3">
        {/* Self Mini Card */}
        <div className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-white/5">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
            {cameraEnabled && selfStream ? (
              <video
                ref={selfVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <img src={selfAvatar} alt={selfName} className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-0.5 right-0.5">
              {micEnabled ? (
                <Mic className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <MicOff className="w-2.5 h-2.5 text-rose-400" />
              )}
            </div>
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 truncate">{selfName}</p>
            <span className="text-[10px] text-zinc-500">You</span>
          </div>
        </div>

        {/* Partner Mini Card */}
        <div className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-rose-950/20 border border-rose-500/20">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80"
              alt={partner.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0.5 right-0.5">
              <Mic className="w-2.5 h-2.5 text-emerald-400" />
            </div>
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-rose-200 truncate">{partner.name}</p>
            <span className="text-[10px] text-emerald-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Media Bar (Mute, Cam, Speaker, Settings) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#121212]/95 backdrop-blur-xl border border-white/15 px-3 py-2 rounded-2xl shadow-2xl shadow-black">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            micEnabled
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
          }`}
          title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{micEnabled ? 'Mute' : 'Unmuted'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            cameraEnabled
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
          }`}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{cameraEnabled ? 'Camera' : 'Cam Off'}</span>
        </button>

        {/* Speaker Mute Toggle */}
        <button
          onClick={onToggleSpeaker}
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            isSpeakerMuted
              ? 'bg-amber-600/90 hover:bg-amber-500 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
          }`}
          title={isSpeakerMuted ? 'Unmute Partner Audio' : 'Mute Partner Audio'}
        >
          {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isSpeakerMuted ? 'Deafened' : 'Audio'}</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        {/* Settings Toggle */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          title="Audio & Video Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </>
  );
};
