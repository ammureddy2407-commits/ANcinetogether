import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  Share2,
  Settings,
  LogOut,
  MessageSquare,
  Users,
  Sparkles,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Film,
  Camera,
  Video,
  Youtube,
  MonitorUp,
  MonitorOff,
  Mic,
  Smile,
  X,
  Play,
  Copy,
  Flame,
  Moon,
  Check,
  Tv,
} from 'lucide-react';
import {
  ChatMessage,
  ContentItem,
  FloatingReaction,
  Page,
  Participant,
  PlaybackSyncState,
  Room,
  RoomSettings,
  UserProfile,
  AmbientLightingMood,
} from '../types';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { RoomSyncChannel, SyncMessage } from '../utils/syncChannel';
import { VideoPlayer } from '../components/VideoPlayer';
import { RightSidebarPanel } from '../components/RightSidebarPanel';
import { FloatingReactions } from '../components/FloatingReactions';
import { ContentSelectorModal } from '../components/ContentSelectorModal';
import { RoomSettingsModal } from '../components/RoomSettingsModal';
import { InviteModal } from '../components/InviteModal';
import { MovieEndModal } from '../components/MovieEndModal';
import { addToWatchHistory } from '../utils/storage';
import { DataChannelSyncService } from '../services/dataChannelSyncService';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { io, Socket } from 'socket.io-client';
import { apiUrl, getServerEndpoint } from '../utils/config';

interface WatchRoomPageProps {
  room: Room;
  user: UserProfile;
  favorites: ContentItem[];
  onLeaveRoom: () => void;
  onNavigate: (page: Page) => void;
}

// Robust helper to attach or replace video & audio tracks on WebRTC transceivers
function attachLocalTracks(
  pc: RTCPeerConnection | null,
  stream: MediaStream | null,
  isScreenSharing: boolean,
  screenStream: MediaStream | null
) {
  if (!pc || pc.signalingState === 'closed') return;

  const videoTrack =
    (isScreenSharing && screenStream ? screenStream.getVideoTracks()[0] : null) ||
    (stream ? stream.getVideoTracks()[0] : null);
  const audioTrack = stream ? stream.getAudioTracks()[0] : null;

  const transceivers = pc.getTransceivers();
  let videoAttached = false;
  let audioAttached = false;

  transceivers.forEach((t) => {
    // In WebRTC standards, receiver.track.kind is ALWAYS 'video' or 'audio' even if track is pending
    const kind = t.receiver?.track?.kind || t.sender?.track?.kind;
    if (kind === 'video') {
      if (videoTrack) {
        t.sender.replaceTrack(videoTrack).catch((e) => console.warn('replaceTrack video notice:', e));
        videoAttached = true;
      }
    } else if (kind === 'audio') {
      if (audioTrack) {
        t.sender.replaceTrack(audioTrack).catch((e) => console.warn('replaceTrack audio notice:', e));
        audioAttached = true;
      }
    }
  });

  // Fallback: If no transceivers exist yet, add tracks directly
  const senders = pc.getSenders();
  if (!videoAttached && videoTrack && stream) {
    const hasSender = senders.some((s) => s.track?.kind === 'video');
    if (!hasSender) {
      try {
        pc.addTrack(videoTrack, stream);
      } catch (_) {}
    }
  }

  if (!audioAttached && audioTrack && stream) {
    const hasSender = senders.some((s) => s.track?.kind === 'audio');
    if (!hasSender) {
      try {
        pc.addTrack(audioTrack, stream);
      } catch (_) {}
    }
  }
}

// Ambient lighting backdrop configurations simulating theater moods
export function getAmbientBackdropConfig(
  mood: AmbientLightingMood = 'candlelight',
  enabled: boolean = true
) {
  if (!enabled || mood === 'pure-oled') {
    return {
      containerBg: 'bg-[#080808]',
      theaterBg: 'bg-black',
      wallGlowOverlay: '',
      accentBorder: 'border-white/10',
      label: 'Pure OLED',
      tagline: 'Pitch Black',
      badgeDot: 'bg-zinc-600',
    };
  }

  switch (mood) {
    case 'candlelight':
      return {
        containerBg: 'bg-[#0e0905]',
        theaterBg: 'bg-gradient-to-b from-[#1c1006] via-[#120a03] to-[#080401]',
        wallGlowOverlay: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/22 via-amber-950/20 to-transparent',
        accentBorder: 'border-amber-500/25',
        label: 'Candlelight',
        tagline: 'Warm Glow',
        badgeDot: 'bg-amber-400',
      };
    case 'midnight':
      return {
        containerBg: 'bg-[#040814]',
        theaterBg: 'bg-gradient-to-b from-[#08152e] via-[#040b19] to-[#02050e]',
        wallGlowOverlay: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/22 via-indigo-950/25 to-transparent',
        accentBorder: 'border-blue-500/25',
        label: 'Midnight',
        tagline: 'Deep Blue',
        badgeDot: 'bg-blue-400',
      };
    case 'cinema':
      return {
        containerBg: 'bg-[#101012]',
        theaterBg: 'bg-gradient-to-b from-[#1f1f24] via-[#131316] to-[#09090a]',
        wallGlowOverlay: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-300/15 via-zinc-800/18 to-transparent',
        accentBorder: 'border-zinc-400/25',
        label: 'Cinema',
        tagline: 'Dim Grey',
        badgeDot: 'bg-zinc-300',
      };
    case 'neon-rose':
      return {
        containerBg: 'bg-[#11050d]',
        theaterBg: 'bg-gradient-to-b from-[#220718] via-[#13030e] to-[#090106]',
        wallGlowOverlay: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-500/25 via-pink-950/22 to-transparent',
        accentBorder: 'border-rose-500/25',
        label: 'Neon Rose',
        tagline: 'Romantic Aura',
        badgeDot: 'bg-rose-400',
      };
    default:
      return {
        containerBg: 'bg-[#080808]',
        theaterBg: 'bg-black',
        wallGlowOverlay: '',
        accentBorder: 'border-white/10',
        label: 'Cinema',
        tagline: 'Default',
        badgeDot: 'bg-zinc-400',
      };
  }
}

export const WatchRoomPage: React.FC<WatchRoomPageProps> = ({
  room,
  user,
  favorites,
  onLeaveRoom,
  onNavigate,
}) => {
  // Room state
  const [currentContent, setCurrentContent] = useState<ContentItem>(
    room.currentContent || {
      id: 'nothing-selected',
      title: 'Nothing selected',
      description: 'Choose a movie or share a screen to start watching together.',
      thumbnail: '',
      duration: '0m',
      durationSeconds: 0,
      genre: [],
      year: new Date().getFullYear(),
      rating: '—',
      type: 'stream',
    }
  );
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(room.settings);
  const [ambientMenuOpen, setAmbientMenuOpen] = useState(false);
  const [expandedTheater, setExpandedTheater] = useState(false);

  // Sync state
  const [syncState, setSyncState] = useState<PlaybackSyncState>({
    isPlaying: false,
    currentTime: 0,
    duration: currentContent.durationSeconds || 100,
    timestamp: Date.now(),
    updatedBy: user.id,
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

  // Participants & Partner State
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerJoinedBanner, setPartnerJoinedBanner] = useState(false);
  const [partner, setPartner] = useState<Participant>({
    id: 'partner-pending',
    name: 'Partner not invited',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    isHost: false,
    isSelf: false,
    cameraEnabled: true,
    micEnabled: true,
    isSpeaking: false,
    status: 'disconnected',
  });

  // Chat & Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Modals & Panels
  const [chatOpen, setChatOpen] = useState(true);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentModalTab, setContentModalTab] = useState<'youtube' | 'online' | 'local' | 'services' | 'favorites'>('youtube');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [movieEndModalOpen, setMovieEndModalOpen] = useState(false);

  const handleOpenYouTube = () => {
    setContentModalTab('youtube');
    setContentModalOpen(true);
  };

  const handleOpenContentSelector = () => {
    setContentModalTab('online');
    setContentModalOpen(true);
  };

  // Real WebRTC / Media devices hook
  const {
    stream: selfStream,
    cameraEnabled,
    micEnabled,
    isSpeakerMuted,
    hasCameraPermission,
    hasMicPermission,
    errorMessage: mediaErrorMessage,
    videoDevices,
    audioDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    selectedAudioOutput,
    isSpeaking: selfIsSpeaking,
    screenStream,
    isScreenSharing,
    toggleScreenShare,
    stopScreenShare,
    startMedia,
    toggleCamera,
    toggleMic,
    toggleSpeaker,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedAudioOutput,
  } = useMediaDevices(true);

  // Sync Channel & WebRTC refs
  const syncChannelRef = useRef<RoomSyncChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelServiceRef = useRef<DataChannelSyncService | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // PeerJS & Socket.io Signaling refs
  const peerRef = useRef<Peer | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeCallRef = useRef<MediaConnection | null>(null);
  const activeDataConnRef = useRef<DataConnection | null>(null);
  const selfStreamRef = useRef<MediaStream | null>(selfStream);
  const screenStreamRef = useRef<MediaStream | null>(screenStream);
  const partnerPeerIdRef = useRef<string | null>(null);

  // WebRTC DataChannel live state
  const [isDataChannelActive, setIsDataChannelActive] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [channelLatency, setChannelLatency] = useState(0);
  const [remoteSyncToast, setRemoteSyncToast] = useState<string | null>(null);
  const isRemotePlaybackUpdateRef = useRef(false);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    selfStreamRef.current = selfStream;

    // Attach/replace tracks on direct RTCPeerConnection
    if (peerConnectionRef.current) {
      attachLocalTracks(peerConnectionRef.current, selfStream, isScreenSharing, screenStream);
    }

    // Attach/replace tracks on PeerJS media call
    if (activeCallRef.current && (activeCallRef.current as any).peerConnection) {
      const pc = (activeCallRef.current as any).peerConnection as RTCPeerConnection;
      attachLocalTracks(pc, selfStream, isScreenSharing, screenStream);
    }

    // When camera/mic gets tracks, notify partner so call can establish or exchange media immediately
    if (selfStream && selfStream.getTracks().length > 0 && socketRef.current) {
      const cleanRoom = room.code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanUser = user.id.replace(/[^a-z0-9]/g, '');
      const myPeerId = `ct-${cleanRoom}-${cleanUser}`;
      socketRef.current.emit('stream-updated', {
        roomId: room.code,
        peerId: myPeerId,
        userId: user.id,
      });
    }
  }, [selfStream, isScreenSharing, screenStream, room.code, user.id]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Format seconds helper for notifications
  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  // Initialize DataChannel playback sync service instance
  useEffect(() => {
    const syncService = new DataChannelSyncService(user.id, user.name);
    dataChannelServiceRef.current = syncService;

    syncService.onPlayback((action, compensatedTime, isPlaying, senderName) => {
      isRemotePlaybackUpdateRef.current = true;
      setSyncStatus('syncing');
      setSyncState({
        isPlaying,
        currentTime: compensatedTime,
        duration: currentContent.durationSeconds || 100,
        timestamp: Date.now(),
        updatedBy: senderName,
      });

      if (action !== 'HEARTBEAT_SYNC') {
        const actionText =
          action === 'PLAY'
            ? 'resumed playback'
            : action === 'PAUSE'
            ? 'paused playback'
            : `jumped to ${formatSeconds(compensatedTime)}`;

        setRemoteSyncToast(`${senderName} ${actionText} ⚡`);
        setTimeout(() => setRemoteSyncToast(null), 3200);
      }

      setTimeout(() => {
        setSyncStatus('synced');
        isRemotePlaybackUpdateRef.current = false;
      }, 500);
    });

    syncService.onStateChange((isOpen, latencyMs) => {
      setIsDataChannelActive(isOpen);
      setChannelLatency(latencyMs);
    });

    syncService.onReaction((emoji, senderName) => {
      const newReaction: FloatingReaction = {
        id: `reaction-${Date.now()}-${Math.random()}`,
        emoji,
        senderName: senderName.split(' ')[0],
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 20,
      };
      setReactions((prev) => [...prev, newReaction]);
    });

    syncService.onChat((chatMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === chatMsg.id)) return prev;
        return [...prev, chatMsg];
      });
    });

    syncService.onContentChange((content, senderName) => {
      setCurrentContent(content);
      setLocalFile(null);
      setRemoteSyncToast(`${senderName} changed the movie to "${content.title}" 🍿`);
      setTimeout(() => setRemoteSyncToast(null), 4000);
    });

    return () => {
      syncService.destroy();
      dataChannelServiceRef.current = null;
    };
  }, [user.id, user.name, currentContent.durationSeconds]);

  // Fetch initial room state from server on mount
  useEffect(() => {
    const fetchRoomState = async () => {
      try {
        const res = await fetch(apiUrl(`/api/rooms/${room.code}`));
        if (res.ok) {
          const data = await res.json();
          if (data.currentContent) {
            setCurrentContent(data.currentContent);
          }
          if (data.playbackState) {
            setSyncState(data.playbackState);
          }
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          }
          // Populate existing partner from room participants or host
          if (Array.isArray(data.participants)) {
            const other = data.participants.find((p: any) => p.id !== user.id);
            if (other) {
              setPartner((prev) => ({
                ...prev,
                id: other.id,
                name: other.name || prev.name,
                avatar: other.avatar || prev.avatar,
                status: 'connected',
              }));
              setPartnerConnected(true);
            } else if (data.hostId && data.hostId !== user.id) {
              setPartner((prev) => ({
                ...prev,
                id: data.hostId,
                name: data.hostName || 'Host',
                status: 'connected',
              }));
              setPartnerConnected(true);
            }
          }
        }
      } catch (err) {
        console.warn('Initial room state fetch notice', err);
      }
    };
    fetchRoomState();
  }, [room.code, user.id]);

  // Handle incoming remote media stream from PeerJS or WebRTC
  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    setPartner((prev) => {
      const existing = prev.stream ? prev.stream.getTracks() : [];
      const composite = new MediaStream(existing);

      remoteStream.getTracks().forEach((track) => {
        if (!composite.getTracks().some((cur) => cur.id === track.id)) {
          composite.addTrack(track);
        }
      });

      return {
        ...prev,
        stream: composite,
        cameraEnabled: composite.getVideoTracks().length > 0,
        micEnabled: composite.getAudioTracks().length > 0,
        status: 'connected',
      };
    });
    setPartnerConnected(true);
  }, []);

  // Handle PeerJS DataConnection for low-latency synchronization
  const setupDataConnection = useCallback((conn: DataConnection) => {
    activeDataConnRef.current = conn;

    conn.on('open', () => {
      console.log('[PeerJS] DataConnection open for real-time synchronization');
      setIsDataChannelActive(true);
      setChannelLatency(15);
    });

    conn.on('data', (raw: any) => {
      if (!raw) return;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (data.senderId === user.id) return;

      if (data.type === 'PLAY') {
        isRemotePlaybackUpdateRef.current = true;
        setSyncStatus('syncing');
        setSyncState((prev) => ({
          ...prev,
          isPlaying: true,
          currentTime: data.currentTime,
          updatedBy: data.senderName,
        }));
        setRemoteSyncToast(`${data.senderName} resumed playback ⚡`);
        setTimeout(() => setRemoteSyncToast(null), 3000);
        setTimeout(() => {
          setSyncStatus('synced');
          isRemotePlaybackUpdateRef.current = false;
        }, 500);
      } else if (data.type === 'PAUSE') {
        isRemotePlaybackUpdateRef.current = true;
        setSyncStatus('syncing');
        setSyncState((prev) => ({
          ...prev,
          isPlaying: false,
          currentTime: data.currentTime,
          updatedBy: data.senderName,
        }));
        setRemoteSyncToast(`${data.senderName} paused playback ⚡`);
        setTimeout(() => setRemoteSyncToast(null), 3000);
        setTimeout(() => {
          setSyncStatus('synced');
          isRemotePlaybackUpdateRef.current = false;
        }, 500);
      } else if (data.type === 'SEEK') {
        isRemotePlaybackUpdateRef.current = true;
        setSyncStatus('syncing');
        setSyncState((prev) => ({
          ...prev,
          isPlaying: data.isPlaying ?? prev.isPlaying,
          currentTime: data.currentTime,
          updatedBy: data.senderName,
        }));
        setRemoteSyncToast(`${data.senderName} jumped to ${formatSeconds(data.currentTime)} ⚡`);
        setTimeout(() => setRemoteSyncToast(null), 3000);
        setTimeout(() => {
          setSyncStatus('synced');
          isRemotePlaybackUpdateRef.current = false;
        }, 500);
      } else if (data.type === 'CONTENT_CHANGE' && data.payload) {
        setCurrentContent(data.payload);
        setLocalFile(null);
        setRemoteSyncToast(`${data.senderName} changed the movie to "${data.payload.title}" 🍿`);
        setTimeout(() => setRemoteSyncToast(null), 4000);
      } else if (data.type === 'REACTION' && data.payload?.emoji) {
        const newReaction: FloatingReaction = {
          id: `reaction-${Date.now()}-${Math.random()}`,
          emoji: data.payload.emoji,
          senderName: (data.senderName || 'Partner').split(' ')[0],
          x: 20 + Math.random() * 60,
          y: 10 + Math.random() * 20,
        };
        setReactions((prev) => [...prev, newReaction]);
      } else if (data.type === 'CHAT' && data.payload) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.payload.id)) return prev;
          return [...prev, data.payload];
        });
      }
    });

    conn.on('close', () => {
      setIsDataChannelActive(false);
    });
  }, [user.id]);

  // PEERJS & SOCKET.IO SIGNALING SERVER SETUP
  useEffect(() => {
    const cleanRoom = room.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanUser = user.id.replace(/[^a-z0-9]/g, '');
    const myPeerId = `ct-${cleanRoom}-${cleanUser}`;

    const endpoint = getServerEndpoint();

    let peer: Peer;
    try {
      peer = new Peer(myPeerId, {
        host: endpoint.host,
        port: endpoint.port,
        path: '/peerjs',
        secure: endpoint.secure,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });
    } catch (e) {
      peer = new Peer(myPeerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });
    }
    peerRef.current = peer;

    // Connect to Socket.IO signaling server
    const socket = io(endpoint.httpOrigin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', {
        roomId: room.code,
        userId: user.id,
        userName: user.name,
        peerId: myPeerId,
      });
    });

    const callRemotePeer = (targetPeerId: string) => {
      if (!peer || peer.destroyed) return;
      partnerPeerIdRef.current = targetPeerId;
      const streamToSend = (isScreenSharing && screenStreamRef.current) || selfStreamRef.current || new MediaStream();

      try {
        console.log('[PeerJS] Calling partner stream:', targetPeerId);
        const call = peer.call(targetPeerId, streamToSend);
        activeCallRef.current = call;

        call.on('stream', (remoteStream) => {
          console.log('[PeerJS] Received remote media stream:', remoteStream.getTracks());
          handleRemoteStream(remoteStream);
        });

        call.on('close', () => {
          console.log('[PeerJS] Media call closed');
        });

        call.on('error', (err) => {
          console.warn('[PeerJS] Media call error:', err);
        });
      } catch (e) {
        console.warn('[PeerJS] Call error:', e);
      }

      // Establish PeerJS DataConnection for low-latency movie synchronization
      try {
        const conn = peer.connect(targetPeerId, {
          label: 'cinetogether_playback_sync',
          reliable: true,
        });
        setupDataConnection(conn);
      } catch (e) {
        console.warn('[PeerJS] DataConnection error:', e);
      }
    };

    socket.on('peer-joined', ({ userId, userName, peerId }) => {
      if (peerId && peerId !== myPeerId) {
        console.log('[Socket.IO] Partner joined room:', userName, peerId);
        partnerPeerIdRef.current = peerId;
        setPartner((prev) => ({
          ...prev,
          id: userId || prev.id,
          name: userName || prev.name,
          status: 'connected',
        }));
        setPartnerConnected(true);
        setPartnerJoinedBanner(true);
        setTimeout(() => setPartnerJoinedBanner(false), 4000);

        // Initiate PeerJS call to exchange media stream
        callRemotePeer(peerId);
      }
    });

    socket.on('peer-left', () => {
      setPartnerConnected(false);
    });

    // Real-time synchronized video player state (play, pause, seek) via Socket.IO
    socket.on('playback-update', (data: any) => {
      if (!data || data.senderId === user.id) return;
      isRemotePlaybackUpdateRef.current = true;
      setSyncStatus('syncing');
      setSyncState((prev) => ({
        ...prev,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        duration: data.duration || prev.duration,
        updatedBy: data.senderName || 'Partner',
      }));

      const actionText =
        data.action === 'PLAY'
          ? 'resumed playback'
          : data.action === 'PAUSE'
          ? 'paused playback'
          : `jumped to ${formatSeconds(data.currentTime)}`;

      setRemoteSyncToast(`${data.senderName || 'Partner'} ${actionText} ⚡`);
      setTimeout(() => setRemoteSyncToast(null), 3200);

      setTimeout(() => {
        setSyncStatus('synced');
        isRemotePlaybackUpdateRef.current = false;
      }, 500);
    });

    // Real-time chat messages via Socket.IO
    socket.on('chat-message', (data: any) => {
      if (!data?.message || data.message.senderId === user.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, { ...data.message, isSelf: false }];
      });
    });

    // Real-time floating reactions via Socket.IO
    socket.on('reaction', (data: any) => {
      if (!data?.emoji || data.senderId === user.id) return;
      const newReaction: FloatingReaction = {
        id: `reaction-${Date.now()}-${Math.random()}`,
        emoji: data.emoji,
        senderName: (data.senderName || 'Partner').split(' ')[0],
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 20,
      };
      setReactions((prev) => [...prev, newReaction]);
    });

    // Movie content change via Socket.IO
    socket.on('content-change', (data: any) => {
      if (!data?.content || data.senderId === user.id) return;
      setCurrentContent(data.content);
      setLocalFile(null);
      setRemoteSyncToast(`${data.senderName || 'Partner'} changed movie to "${data.content.title}" 🍿`);
      setTimeout(() => setRemoteSyncToast(null), 3500);
    });

    // Real-time Ambient Lighting and Room Settings sync via Socket.IO
    socket.on('settings-update', (data: any) => {
      if (!data?.settings || data.senderId === user.id) return;
      setRoomSettings(data.settings);
      const moodName =
        data.settings.ambientLighting === 'candlelight'
          ? 'Candlelight (Warm Glow)'
          : data.settings.ambientLighting === 'midnight'
          ? 'Midnight (Deep Blue)'
          : data.settings.ambientLighting === 'cinema'
          ? 'Cinema (Dim Grey)'
          : data.settings.ambientLighting;
      const isEnabled = data.settings.ambientLightingEnabled !== false;
      setRemoteSyncToast(
        isEnabled
          ? `${data.senderName || 'Partner'} set ambient lighting to ${moodName} ✨`
          : `${data.senderName || 'Partner'} turned off ambient lighting 🎬`
      );
      setTimeout(() => setRemoteSyncToast(null), 3200);
    });

    // Partner media stream updated notification (e.g. camera permission just granted)
    socket.on('stream-updated', ({ peerId }: any) => {
      if (peerId && peerId !== myPeerId) {
        console.log('[Socket.IO] Partner stream updated, establishing media call:', peerId);
        partnerPeerIdRef.current = peerId;
        callRemotePeer(peerId);
      }
    });

    socket.on('request-peer-call', ({ peerId }: any) => {
      if (peerId && peerId !== myPeerId) {
        partnerPeerIdRef.current = peerId;
        callRemotePeer(peerId);
      }
    });

    peer.on('open', (id) => {
      console.log('[PeerJS] Connected to signaling server with ID:', id);
      setIsPeerConnected(true);

      socket.emit('join-room', {
        roomId: room.code,
        userId: user.id,
        userName: user.name,
        peerId: id,
      });

      syncChannelRef.current?.send('PARTNER_JOIN', {
        userId: user.id,
        name: user.name,
        peerId: id,
      });
    });

    peer.on('call', (incomingCall) => {
      console.log('[PeerJS] Answering incoming media call from:', incomingCall.peer);
      activeCallRef.current = incomingCall;
      partnerPeerIdRef.current = incomingCall.peer;

      const streamToSend = (isScreenSharing && screenStreamRef.current) || selfStreamRef.current || new MediaStream();
      incomingCall.answer(streamToSend);

      incomingCall.on('stream', (remoteStream) => {
        console.log('[PeerJS] Remote stream received from incoming call:', remoteStream.getTracks());
        handleRemoteStream(remoteStream);
      });

      incomingCall.on('close', () => {
        console.log('[PeerJS] Call closed');
      });

      incomingCall.on('error', (err) => {
        console.warn('[PeerJS] Call error:', err);
      });
    });

    peer.on('connection', (conn) => {
      console.log('[PeerJS] Incoming DataConnection from:', conn.peer);
      setupDataConnection(conn);
    });

    peer.on('error', (err) => {
      console.warn('[PeerJS] Peer error:', err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (activeCallRef.current) {
        activeCallRef.current.close();
        activeCallRef.current = null;
      }
      if (activeDataConnRef.current) {
        activeDataConnRef.current.close();
        activeDataConnRef.current = null;
      }
      peer.destroy();
      peerRef.current = null;
      setIsPeerConnected(false);
    };
  }, [room.code, user.id, user.name, handleRemoteStream, setupDataConnection, isScreenSharing]);

  // Setup WebRTC peer connection and sync channel
  useEffect(() => {
    const channel = new RoomSyncChannel(room.code, user.id, user.name);
    syncChannelRef.current = channel;

    const syncService = dataChannelServiceRef.current;

    // Initialize WebRTC RTCPeerConnection with public high-availability STUN servers
    let pc: RTCPeerConnection | null = null;
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      });
      peerConnectionRef.current = pc;

      // Automatically hook incoming data channel on receiver
      if (syncService) {
        syncService.bindPeerConnection(pc);
      }

      // Pre-allocate audio & video transceivers so SDP negotiation always reserves A/V lines
      try {
        pc.addTransceiver('video', { direction: 'sendrecv' });
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        attachLocalTracks(pc, selfStream, isScreenSharing, screenStream);
      } catch (err) {
        console.warn('Transceiver pre-allocation notice:', err);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send('WEBRTC_SIGNAL', {
            signal: { candidate: event.candidate.toJSON() },
          });
        }
      };

      pc.ontrack = (event) => {
        const incomingTrack = event.track;
        if (!incomingTrack) return;

        setPartner((prev) => {
          // Always create a fresh MediaStream object so React state changes trigger video element update
          const existingTracks = prev.stream ? prev.stream.getTracks() : [];
          const composite = new MediaStream(existingTracks);

          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach((t) => {
              if (!composite.getTracks().some((existing) => existing.id === t.id)) {
                composite.addTrack(t);
              }
            });
          }

          if (!composite.getTracks().some((t) => t.id === incomingTrack.id)) {
            composite.addTrack(incomingTrack);
          }

          const hasVideo = composite.getVideoTracks().length > 0;
          const hasAudio = composite.getAudioTracks().length > 0;

          return {
            ...prev,
            stream: composite,
            cameraEnabled: hasVideo,
            micEnabled: hasAudio,
            status: 'connected',
          };
        });
        setPartnerConnected(true);
      };

      pc.onconnectionstatechange = () => {
        if (pc?.connectionState === 'connected') {
          setPartnerConnected(true);
        }
      };
    } catch (e) {
      console.warn('RTCPeerConnection initialization notice', e);
    }

    const unsubscribe = channel.subscribe(async (msg: SyncMessage) => {
      if (msg.type === 'PLAYBACK_STATE') {
        // Only apply if not already updated by DataChannel
        if (!isRemotePlaybackUpdateRef.current) {
          setSyncStatus('syncing');
          setSyncState(msg.payload);
          setTimeout(() => setSyncStatus('synced'), 600);
        }
      } else if (msg.type === 'CHAT_MESSAGE') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.payload.id)) return prev;
          return [...prev, msg.payload];
        });
      } else if (msg.type === 'REACTION') {
        setReactions((prev) => [...prev, msg.payload]);
      } else if (msg.type === 'CONTENT_CHANGE') {
        setCurrentContent(msg.payload);
      } else if (msg.type === 'PARTNER_JOIN') {
        setPartnerConnected(true);
        setPartnerJoinedBanner(true);
        if (msg.senderName && msg.senderId !== user.id) {
          setPartner((prev) => ({
            ...prev,
            id: msg.senderId || prev.id,
            name: msg.senderName,
            status: 'connected',
          }));
        }
        setTimeout(() => setPartnerJoinedBanner(false), 4000);

        // Host/active peer creates WebRTC DataChannel & SDP Offer to new partner
        if (pc && pc.signalingState !== 'closed') {
          try {
            // Attach our local video & audio tracks before offer creation
            attachLocalTracks(pc, selfStream, isScreenSharing, screenStream);

            if (syncService) {
              syncService.initAsOfferer(pc);
            }
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            channel.send('WEBRTC_SIGNAL', {
              signal: { sdp: pc.localDescription },
              targetUserId: msg.senderId,
            });
            // Reciprocate presence so joining peer also receives our join notification
            channel.send('PARTNER_JOIN', { userId: user.id, name: user.name });
          } catch (err) {
            console.warn('WebRTC offer error', err);
          }
        }
      } else if (msg.type === 'WEBRTC_SIGNAL') {
        const signal = msg.payload?.signal;
        if (!pc || !signal || pc.signalingState === 'closed') return;

        try {
          if (signal.sdp) {
            const sdp = signal.sdp;
            if (sdp.type === 'offer') {
              // Attach our local media tracks to transceivers before answering
              attachLocalTracks(pc, selfStream, isScreenSharing, screenStream);

              await pc.setRemoteDescription(new RTCSessionDescription(sdp));

              // Drain any pending ICE candidates buffered before remoteDescription was set
              for (const cand of pendingIceCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
              pendingIceCandidatesRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send('WEBRTC_SIGNAL', {
                signal: { sdp: pc.localDescription },
                targetUserId: msg.senderId,
              });
            } else if (sdp.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));

              // Drain any pending ICE candidates buffered before remoteDescription was set
              for (const cand of pendingIceCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
              pendingIceCandidatesRef.current = [];
            }
          } else if (signal.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
            } else {
              pendingIceCandidatesRef.current.push(signal.candidate);
            }
          }
        } catch (err) {
          console.warn('WebRTC signaling processing error', err);
        }
      }
    });

    // Notify room across internet that user joined
    channel.send('PARTNER_JOIN', { userId: user.id, name: user.name });

    // Fallback offer initiator if peer is already in room
    const fallbackOfferTimer = setTimeout(async () => {
      if (
        pc &&
        pc.signalingState === 'stable' &&
        !dataChannelServiceRef.current?.getIsDataChannelActive()
      ) {
        try {
          attachLocalTracks(pc, selfStream, isScreenSharing, screenStream);
          if (syncService) {
            syncService.initAsOfferer(pc);
          }
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          channel.send('WEBRTC_SIGNAL', {
            signal: { sdp: pc.localDescription },
          });
        } catch (_) {}
      }
    }, 2800);

    return () => {
      clearTimeout(fallbackOfferTimer);
      unsubscribe();
      channel.close();
      if (pc) {
        pc.close();
        peerConnectionRef.current = null;
      }
    };
  }, [room.code, room.hostId, roomSettings.allowGuestControl, user.id, user.name]);

  // Keep local stream tracks in sync with WebRTC and PeerJS transceivers
  useEffect(() => {
    attachLocalTracks(peerConnectionRef.current, selfStream, isScreenSharing, screenStream);
    if (activeCallRef.current?.peerConnection) {
      attachLocalTracks(activeCallRef.current.peerConnection, selfStream, isScreenSharing, screenStream);
    }
  }, [selfStream, isScreenSharing, screenStream]);

  // Handle Playback Update (play/pause, seek)
  const handleUpdatePlayback = useCallback(
    (isPlaying: boolean, currentTime: number) => {
      if (user.id !== room.hostId && !roomSettings.allowGuestControl) return;
      // Guard against infinite loop when playback was updated by remote partner
      if (isRemotePlaybackUpdateRef.current) {
        return;
      }

      const newState: PlaybackSyncState = {
        isPlaying,
        currentTime,
        duration: currentContent.durationSeconds || 100,
        timestamp: Date.now(),
        updatedBy: user.id,
      };
      setSyncState(newState);

      const isSeek = Math.abs(currentTime - syncState.currentTime) > 1.0;

      // 1. Instant Socket.IO real-time synchronization
      if (socketRef.current?.connected) {
        socketRef.current.emit('playback-update', {
          roomId: room.code,
          action: isSeek ? 'SEEK' : isPlaying ? 'PLAY' : 'PAUSE',
          currentTime,
          isPlaying,
          duration: currentContent.durationSeconds || 100,
          senderId: user.id,
          senderName: user.name,
          timestamp: Date.now(),
        });
      }

      // 2. High-priority peer-to-peer WebRTC DataChannel delivery
      if (dataChannelServiceRef.current?.getIsDataChannelActive()) {
        if (isSeek) {
          dataChannelServiceRef.current.broadcastSeek(currentTime, isPlaying);
        } else if (isPlaying) {
          dataChannelServiceRef.current.broadcastPlay(currentTime);
        } else {
          dataChannelServiceRef.current.broadcastPause(currentTime);
        }
      }

      // 3. Direct PeerJS DataConnection delivery
      if (activeDataConnRef.current && activeDataConnRef.current.open) {
        try {
          activeDataConnRef.current.send({
            type: isSeek ? 'SEEK' : isPlaying ? 'PLAY' : 'PAUSE',
            currentTime,
            isPlaying,
            senderId: user.id,
            senderName: user.name,
            timestamp: Date.now(),
          });
        } catch (_) {}
      }

      // 4. Broadcast via RoomSyncChannel for cross-tab & cloud persistence
      syncChannelRef.current?.send('PLAYBACK_STATE', newState);
    },
    [currentContent.durationSeconds, room.code, syncState.currentTime, user.id, user.name]
  );

  // Handle sending a chat message
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Send via Socket.IO
    socketRef.current?.emit('chat-message', {
      roomId: room.code,
      message: { ...newMsg, isSelf: false },
    });

    // Send via direct WebRTC DataChannel if active
    dataChannelServiceRef.current?.broadcastChat({
      ...newMsg,
      isSelf: false,
    });

    // Send via PeerJS DataConnection
    if (activeDataConnRef.current && activeDataConnRef.current.open) {
      try {
        activeDataConnRef.current.send({
          type: 'CHAT',
          currentTime: 0,
          senderId: user.id,
          senderName: user.name,
          payload: { ...newMsg, isSelf: false },
          timestamp: Date.now(),
        });
      } catch (_) {}
    }

    // Broadcast to partner tab & server
    syncChannelRef.current?.send('CHAT_MESSAGE', {
      ...newMsg,
      isSelf: false,
    });
  };

  // Handle sending a reaction
  const handleSendReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      senderName: user.name.split(' ')[0],
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 20,
    };

    setReactions((prev) => [...prev, newReaction]);

    // Send via Socket.IO
    socketRef.current?.emit('reaction', {
      roomId: room.code,
      emoji,
      senderId: user.id,
      senderName: user.name,
    });

    // Send via direct WebRTC DataChannel if active
    dataChannelServiceRef.current?.broadcastReaction(emoji);

    // Send via PeerJS DataConnection
    if (activeDataConnRef.current && activeDataConnRef.current.open) {
      try {
        activeDataConnRef.current.send({
          type: 'REACTION',
          currentTime: 0,
          senderId: user.id,
          senderName: user.name,
          payload: { emoji },
          timestamp: Date.now(),
        });
      } catch (_) {}
    }

    // Broadcast reaction
    syncChannelRef.current?.send('REACTION', newReaction);

    // Also add subtle notice in chat if desired
    handleSendMessage(`${emoji}`);
  };

  // Handle Content Selection
  const updateRoomSettings = (settings: RoomSettings) => {
    setRoomSettings(settings);
    socketRef.current?.emit('settings-update', {
      roomId: room.code,
      settings,
      senderId: user.id,
      senderName: user.name,
    });
  };

  const handleSelectContent = (item: ContentItem) => {
    if (user.id !== room.hostId && !roomSettings.allowGuestControl) return;
    setCurrentContent(item);
    setLocalFile(null);
    handleUpdatePlayback(false, 0);

    // Send via Socket.IO
    socketRef.current?.emit('content-change', {
      roomId: room.code,
      content: item,
      senderId: user.id,
      senderName: user.name,
    });

    // Send via direct WebRTC DataChannel
    dataChannelServiceRef.current?.broadcastContentChange(item);

    // Send via PeerJS DataConnection
    if (activeDataConnRef.current && activeDataConnRef.current.open) {
      try {
        activeDataConnRef.current.send({
          type: 'CONTENT_CHANGE',
          currentTime: 0,
          senderId: user.id,
          senderName: user.name,
          payload: item,
          timestamp: Date.now(),
        });
      } catch (_) {}
    }

    syncChannelRef.current?.send('CONTENT_CHANGE', item);
  };

  // Handle Local File Selection
  const handleSelectLocalFile = (file: File) => {
    setLocalFile(file);
    const localItem: ContentItem = {
      id: `local-${file.name}`,
      title: file.name,
      description: 'Local video file loaded securely from device.',
      thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
      duration: 'Local File',
      durationSeconds: 7200,
      genre: ['Personal Video', 'Local File'],
      year: 2025,
      rating: 'All',
      type: 'local',
    };
    setCurrentContent(localItem);
    handleUpdatePlayback(false, 0);

    dataChannelServiceRef.current?.broadcastContentChange(localItem);
    syncChannelRef.current?.send('CONTENT_CHANGE', localItem);
  };

  // Handle Movie Ended & Rating Save
  const handleMovieEnded = () => {
    setMovieEndModalOpen(true);
  };

  const handleSaveMovieRating = (rating: number, review: string) => {
    addToWatchHistory({
      id: `hist-${Date.now()}`,
      content: currentContent,
      watchedAt: 'Today',
      watchedWith: partner.name,
      progressPercent: 100,
      rating,
      reviewNotes: review,
    });
  };

  const participants: Participant[] = [
    {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isHost: true,
      isSelf: true,
      cameraEnabled,
      micEnabled,
      isSpeaking: selfIsSpeaking,
      status: 'connected',
    },
    partner,
  ];

  return (
    <div className={`relative flex flex-col bg-[#080808] overflow-hidden select-none ${expandedTheater ? 'fixed inset-0 z-[100] h-screen w-screen' : 'h-[calc(100vh-4rem)]'}`}>
      {/* 1. ROOM HEADER */}
      {!expandedTheater && <header className="h-14 bg-[#0d0d0d] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 truncate">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              CineTogether
            </span>
            <span className="text-rose-500 font-bold">❤️</span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Room Title */}
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
              {room.name}
            </h1>
          </div>

          {/* Participant Presence Indicators & Real-time WebRTC DataChannel Status */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>You</span>
            </span>
            <span className="text-zinc-600">·</span>
            {partnerConnected ? (
              <span className="flex items-center gap-1 text-rose-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{partner.name}</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Waiting for partner…</span>
              </span>
            )}

            {/* PeerJS & WebRTC Live Stream & Signaling Indicator */}
            {isPeerConnected && isDataChannelActive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PeerJS & Socket.io Live ({channelLatency > 0 ? `${channelLatency}ms` : '<15ms'})</span>
              </span>
            ) : isPeerConnected ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-[11px] font-medium text-emerald-300 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PeerJS Signaling Active</span>
              </span>
            ) : partnerConnected ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/10 text-[11px] font-medium text-zinc-400 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Cloud Sync Active</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick YouTube Watch Button */}
          <button
            onClick={handleOpenYouTube}
            className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-red-950 active:scale-95"
            title="Watch YouTube Together"
          >
            <Youtube className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">YouTube</span>
          </button>

          {/* Screen Share Toggle Button */}
          <button
            onClick={toggleScreenShare}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isScreenSharing
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-cyan-950'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Desktop Window or Screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <MonitorUp className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>

          {/* Invite Partner */}
          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-rose-950"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite Partner</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-colors"
            title="Room Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Toggle Cams & Chat Panel */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`px-3 py-1.5 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              chatOpen ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Right Side Cams & Chat"
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{chatOpen ? 'Hide Sidebar' : 'Show Cams & Chat'}</span>
          </button>

          {/* Leave Room */}
          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-400 text-xs font-medium border border-white/5 transition-colors flex items-center gap-1.5"
            title="Leave Theater"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leave</span>
          </button>
        </div>
      </header>}

      {/* PARTNER JOINED TOAST BANNER */}
      {partnerJoinedBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4" />
          <span>Your partner joined! 🎬 Enjoy movie night!</span>
        </div>
      )}

      {/* REMOTE PLAYBACK ACTION TOAST (WebRTC Real-time Notification) */}
      {remoteSyncToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-rose-500/40 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-3 duration-300">
          <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{remoteSyncToast}</span>
        </div>
      )}

      {/* PERMISSION WARNING BANNER (Non-blocking, helpful) */}
      {hasCameraPermission === false && (
        <div className="bg-amber-950/70 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Camera access is disabled or unavailable. You can continue watching smoothly with live audio & chat!
            </span>
          </div>
          <button
            onClick={() => startMedia()}
            className="text-[11px] underline font-semibold text-amber-300 hover:text-white"
          >
            Retry Camera
          </button>
        </div>
      )}
      {mediaErrorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-[min(92vw,34rem)] rounded-xl border border-amber-400/30 bg-zinc-950/95 px-4 py-2.5 text-xs text-amber-100 shadow-xl">
          {mediaErrorMessage}
        </div>
      )}

      {/* 2. MAIN THEATER WORKSPACE */}
      {/* LEFT: Whole screen movie player | RIGHT: Cams stacked one below the other + Chatting section */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {expandedTheater && (
          <button onClick={() => void toggleScreenShare()} className="absolute top-3 right-3 z-40 rounded-xl border border-white/15 bg-black/75 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-zinc-800 flex items-center gap-2">
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4 text-cyan-300" />}
            {isScreenSharing ? 'Stop sharing' : 'Share screen'}
          </button>
        )}
        {/* Whole Screen Movie Player or Live Screen Share on the Left */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-black overflow-hidden h-full">
          {isScreenSharing && screenStream ? (
            /* LIVE SCREEN SHARING DISPLAY */
            <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />

              {/* Screen Share Top Badges & Controls */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/30 text-xs text-cyan-200 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-semibold">Live Screen Share: Your Desktop Window</span>
              </div>

              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={toggleScreenShare}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <MonitorOff className="w-3.5 h-3.5" />
                  <span>Stop Screen Share</span>
                </button>
              </div>
            </div>
          ) : (
            /* Synchronized video player */
            <VideoPlayer
              content={currentContent}
              syncState={syncState}
              onUpdatePlayback={handleUpdatePlayback}
              onOpenContentSelector={handleOpenContentSelector}
              onOpenYouTube={handleOpenYouTube}
              onMovieEnded={handleMovieEnded}
              syncStatus={syncStatus}
              ambientLighting={roomSettings.ambientLighting}
              localFileObj={localFile}
              onUploadLocalFile={handleSelectLocalFile}
              isDataChannelActive={isDataChannelActive}
              latencyMs={channelLatency}
              onToggleExpanded={() => setExpandedTheater((value) => !value)}
              onToggleScreenShare={() => void toggleScreenShare()}
            />
          )}

          {/* Floating animated reactions layer over the movie or screen share */}
          <FloatingReactions reactions={reactions} />

        </div>

        {/* Right side: Live Cams (one below the other) and Chatting Section */}
        <RightSidebarPanel
          selfStream={selfStream}
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
          isSpeakerMuted={isSpeakerMuted}
          isSpeaking={selfIsSpeaking}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onToggleSpeaker={toggleSpeaker}
          onOpenSettings={() => setSettingsModalOpen(true)}
          partner={partner}
        partnerConnected={partnerConnected}
        onInvitePartner={() => setInviteModalOpen(true)}
          selfName={user.name}
          selfAvatar={user.avatar}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={toggleScreenShare}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
          isOpen={chatOpen}
          onToggleOpen={() => setChatOpen(!chatOpen)}
        />
      </div>

      {/* MODALS */}
      <ContentSelectorModal
        isOpen={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        onSelectContent={handleSelectContent}
        onSelectLocalFile={handleSelectLocalFile}
        favorites={favorites}
        currentContentId={currentContent.id}
        initialTab={contentModalTab}
      />

      <RoomSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={roomSettings}
        onUpdateSettings={updateRoomSettings}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        audioOutputDevices={audioOutputDevices}
        selectedVideoDevice={selectedVideoDevice}
        selectedAudioDevice={selectedAudioDevice}
        selectedAudioOutput={selectedAudioOutput}
        onSelectVideoDevice={setSelectedVideoDevice}
        onSelectAudioDevice={setSelectedAudioDevice}
        onSelectAudioOutput={setSelectedAudioOutput}
      />

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        room={room}
      />

      <MovieEndModal
        isOpen={movieEndModalOpen}
        onClose={() => setMovieEndModalOpen(false)}
        content={currentContent}
        partnerName={partner.name}
        onSelectNextMovie={() => setContentModalOpen(true)}
        onSaveRating={handleSaveMovieRating}
      />
    </div>
  );
};
