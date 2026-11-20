import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Settings,
  Send,
  Smile,
  Heart,
  MessageSquare,
  Sparkles,
  Wifi,
  ChevronRight,
  ChevronLeft,
  MonitorUp,
  MonitorOff,
  UserPlus,
} from 'lucide-react';
import { ChatMessage, Participant } from '../types';

interface RightSidebarPanelProps {
  // Camera props
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
  partnerConnected: boolean;
  onInvitePartner: () => void;
  selfName: string;
  selfAvatar: string;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;

  // Chat props
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;

  // Sidebar toggle
  isOpen: boolean;
  onToggleOpen: () => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😭', '😮', '🔥', '🍿', '👏'];

export const RightSidebarPanel: React.FC<RightSidebarPanelProps> = ({
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
  partnerConnected,
  onInvitePartner,
  selfName,
  selfAvatar,
  isScreenSharing,
  onToggleScreenShare,
  messages,
  onSendMessage,
  onSendReaction,
  isOpen,
  onToggleOpen,
}) => {
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Hook self video stream
  useEffect(() => {
    if (selfVideoRef.current && selfStream) {
      selfVideoRef.current.srcObject = selfStream;
    }
  }, [selfStream, cameraEnabled]);

  const [, setTrackVersion] = useState(0);

  // Hook partner live WebRTC stream
  useEffect(() => {
    const videoEl = partnerVideoRef.current;
    if (!videoEl || !partner.stream) return;

    if (videoEl.srcObject !== partner.stream) {
      videoEl.srcObject = partner.stream || null;
    }
    videoEl.play().catch((err) => {
      console.warn('Partner video autoplay notice:', err);
    });

    const handleTrackEvent = () => {
      if (videoEl.srcObject !== partner.stream) {
        videoEl.srcObject = partner.stream || null;
      }
      setTrackVersion((v) => v + 1);
      videoEl.play().catch(() => {});
    };

    partner.stream.addEventListener('addtrack', handleTrackEvent);
    partner.stream.addEventListener('removetrack', handleTrackEvent);

    return () => {
      partner.stream?.removeEventListener('addtrack', handleTrackEvent);
      partner.stream?.removeEventListener('removetrack', handleTrackEvent);
    };
  }, [partner.stream, partner.cameraEnabled]);

  // Auto-scroll chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (nearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const addEmojiToInput = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-20 right-0 z-30 bg-[#141414]/90 hover:bg-zinc-800 border-l border-y border-white/15 px-2.5 py-4 rounded-l-2xl shadow-2xl text-zinc-300 hover:text-white flex flex-col items-center gap-2 group transition-all"
        title="Show Cams & Chat"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <div className="flex flex-col items-center gap-1">
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
          Cams & Chat
        </span>
      </button>
    );
  }

  return (
    <aside className="w-full sm:w-80 md:w-84 lg:w-92 h-full flex flex-col bg-[#101010] border-l border-white/10 shrink-0 z-30 transition-all duration-300 select-none shadow-2xl">
      {/* SCREEN SHARE ACTIVE NOTICE BANNER */}
      {isScreenSharing && (
        <div className="px-3.5 py-1.5 bg-cyan-950/80 border-b border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-[11px]">Sharing Desktop Screen</span>
          </div>
          <button
            onClick={onToggleScreenShare}
            className="px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-semibold transition-colors shadow-sm"
          >
            Stop Share
          </button>
        </div>
      )}

      {/* 2. CAMS SECTION: ONE BELOW THE OTHER */}
      <div className="p-2 bg-[#0d0d0d] border-b border-white/10 space-y-2 shrink-0">
        <div className="grid grid-cols-1 gap-2">
        {/* CAM 1 (TOP): PARTNER'S CAMERA */}
        <div className="relative h-32 sm:h-36 rounded-xl overflow-hidden bg-zinc-950 border border-rose-500/25 shadow-lg group">
          {/* Always rendered in DOM so partner's audio plays and video appears without DOM remount race conditions */}
          <video
            ref={partnerVideoRef}
            autoPlay
            playsInline
            muted={isSpeakerMuted}
            onLoadedMetadata={() => {
              partnerVideoRef.current?.play().catch(() => {});
            }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              partner.stream && partner.stream.getVideoTracks().length > 0 && partner.cameraEnabled !== false
                ? 'opacity-100'
                : 'opacity-0 absolute inset-0 pointer-events-none'
            }`}
          />

          {(!partner.stream || partner.stream.getVideoTracks().length === 0 || partner.cameraEnabled === false) && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900/90">
              {!partnerConnected ? (
                <>
                  <UserPlus className="w-7 h-7 text-rose-300 mb-1" />
                  <span className="text-[11px] text-zinc-100 font-semibold">Partner not invited</span>
                  <button onClick={onInvitePartner} className="mt-2 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[10px] text-white font-semibold">Invite your partner</button>
                </>
              ) : (
                <>
                  <img
                    src={partner.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=640&q=80'}
                    alt={partner.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/30"
                  />
                  <span className="text-[11px] text-zinc-200 mt-2 font-medium">{partner.name}</span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">
                    {partner.stream?.getAudioTracks().length ? 'Mic connected • Camera loading…' : 'Camera is off'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Speaking border effect */}
          {partner.isSpeaking && (
            <div className="absolute inset-0 border-2 border-rose-500 pointer-events-none animate-pulse rounded-2xl" />
          )}

          {/* Partner badge & live status */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-rose-200 border border-rose-500/20">
            <span className={`w-1.5 h-1.5 rounded-full ${partnerConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            <span className="font-semibold">{partnerConnected ? partner.name : 'Partner not invited'}</span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
            {partnerConnected && <Mic className="w-2.5 h-2.5 text-emerald-400" />}
            <span>{partnerConnected ? (partner.isSpeaking ? 'Speaking…' : 'Listening') : 'Waiting for invite'}</span>
          </div>
        </div>

        {/* CAM 2 (BELOW PARTNER): YOUR CAMERA */}
        <div className="relative h-32 sm:h-36 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-lg group">
          {cameraEnabled && selfStream ? (
            <video
              ref={selfVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
              <img
                src={selfAvatar}
                alt={selfName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
              />
              <span className="text-[11px] text-zinc-400 mt-1 font-medium">Your camera is off</span>
            </div>
          )}

          {/* Speaking border effect */}
          {isSpeaking && (
            <div className="absolute inset-0 border-2 border-rose-400 pointer-events-none animate-pulse rounded-2xl" />
          )}

          {/* Self badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-zinc-200 border border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${cameraEnabled ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            <span className="font-semibold">You ({selfName.split(' ')[0]})</span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
            {micEnabled ? (
              <Mic className="w-2.5 h-2.5 text-emerald-400" />
            ) : (
              <MicOff className="w-2.5 h-2.5 text-rose-400" />
            )}
            <span>{micEnabled ? (isSpeaking ? 'Speaking…' : 'Mic on') : 'Muted'}</span>
          </div>
        </div>
        </div>

        {/* DEDICATED HARDWARE CONTROLS ROW (MUTE, CAM, SCREEN SHARE, SPEAKER, SETTINGS) */}
        <div className="grid grid-cols-5 gap-1">
          {/* Mic */}
          <button
            onClick={onToggleMic}
            className={`group/control relative py-1 px-0.5 rounded-lg text-[9px] font-semibold flex flex-col items-center justify-center gap-0 transition-all ${
              micEnabled
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950'
            }`}
            title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/control:opacity-100 group-focus-visible/control:opacity-100">{micEnabled ? 'Mute your microphone' : 'Unmute your microphone'}</span>
            {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{micEnabled ? 'Mic' : 'Muted'}</span>
          </button>

          {/* Camera */}
          <button
            onClick={onToggleCamera}
            className={`group/control relative py-1 px-0.5 rounded-lg text-[9px] font-semibold flex flex-col items-center justify-center gap-0 transition-all ${
              cameraEnabled
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950'
            }`}
            title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/control:opacity-100 group-focus-visible/control:opacity-100">{cameraEnabled ? 'Turn your camera off' : 'Turn your camera on'}</span>
            {cameraEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span>{cameraEnabled ? 'Cam' : 'Off'}</span>
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`group/control relative py-1 px-0.5 rounded-lg text-[9px] font-semibold flex flex-col items-center justify-center gap-0 transition-all ${
              isScreenSharing
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Window or Desktop Screen'}
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/control:opacity-100 group-focus-visible/control:opacity-100">{isScreenSharing ? 'Stop sharing your screen' : 'Share your screen'}</span>
            {isScreenSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <MonitorUp className="w-3.5 h-3.5" />}
            <span>{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>

          {/* Speaker */}
          <button
            onClick={onToggleSpeaker}
            className={`group/control relative py-1 px-0.5 rounded-lg text-[9px] font-semibold flex flex-col items-center justify-center gap-0 transition-all ${
              isSpeakerMuted
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5'
            }`}
            title={isSpeakerMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/control:opacity-100 group-focus-visible/control:opacity-100">{isSpeakerMuted ? 'Unmute room audio' : 'Mute room audio'}</span>
            {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeakerMuted ? 'Muted' : 'Audio'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="group/control relative py-1 px-0.5 rounded-lg text-[9px] font-semibold flex flex-col items-center justify-center gap-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-all"
            title="Device Settings"
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/control:opacity-100 group-focus-visible/control:opacity-100">Device and room settings</span>
            <Settings className="w-3.5 h-3.5" />
            <span>Setup</span>
          </button>
        </div>
      </div>

      {/* 3. CHAT SECTION ON THE SAME RIGHT SIDE */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#101010] overflow-hidden">
        {/* Quick Reaction Buttons Bar */}
        <div className="px-3 py-1.5 bg-[#141414] border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">React:</span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendReaction(emoji)}
                className="text-base p-1 hover:scale-125 transition-transform duration-150 active:scale-95 hover:bg-white/10 rounded-lg"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 [scrollbar-gutter:stable]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
              <Heart className="w-6 h-6 text-rose-500/40 mb-1.5" />
              <p className="text-xs font-semibold text-zinc-400">Date night chat</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Share laughs, whispers, and instant movie reactions.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {msg.isSelf ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-zinc-600">{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.isSelf
                      ? 'bg-rose-600 text-white rounded-br-xs shadow-md shadow-rose-950/30'
                      : 'bg-zinc-900 text-zinc-100 rounded-bl-xs border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Selector Tray */}
        {showEmojiPicker && (
          <div className="p-2 bg-zinc-900 border-t border-white/10 grid grid-cols-7 gap-1 text-lg shrink-0">
            {['🥰', '😍', '💋', '✨', '🥺', '😭', '🫣', '🍿', '🍷', '🍫', '🌹', '🎬', '😱', '💤'].map(
              (e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEmojiToInput(e)}
                  className="p-1 hover:bg-white/10 rounded text-center transition-colors"
                >
                  {e}
                </button>
              )
            )}
          </div>
        )}

        {/* Message Input Box */}
        <form
          onSubmit={handleSend}
          className="p-2.5 bg-zinc-950/90 border-t border-white/5 flex items-center gap-1.5 shrink-0"
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            title="Emoji picker"
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message… ❤️"
            className="flex-1 bg-zinc-900 text-white placeholder-zinc-500 text-xs px-3 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
