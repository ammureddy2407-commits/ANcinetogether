export type Page =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'create-room'
  | 'join-room'
  | 'watch-room'
  | 'history'
  | 'favorites'
  | 'profile';

export type ContentType = 'stream' | 'youtube' | 'local' | 'external_service';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  duration: string;
  durationSeconds: number;
  genre: string[];
  year: number;
  rating: string;
  type: ContentType;
  videoUrl?: string; // HTML5 direct mp4/webm or YouTube URL
  externalServiceName?: 'Netflix' | 'Amazon Prime' | 'Disney+' | 'Apple TV+' | 'Hulu';
  externalUrl?: string;
  isFavorite?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  partnerNickname?: string;
  bio?: string;
  notificationPreferences: {
    roomInvites: boolean;
    chatSounds: boolean;
    reactionSounds: boolean;
  };
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isSelf: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream | null;
  status: 'connected' | 'connecting' | 'disconnected';
}

export type AmbientLightingMood = 'candlelight' | 'midnight' | 'cinema' | 'neon-rose' | 'pure-oled';

export interface RoomSettings {
  allowGuestControl: boolean;
  chatEnabled: boolean;
  reactionsEnabled: boolean;
  requireCamera: boolean;
  requireMicrophone: boolean;
  videoQuality: '1080p' | '720p' | 'auto';
  ambientLighting: AmbientLightingMood;
  ambientLightingEnabled?: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  privacy: 'private' | 'invite-only';
  maxParticipants: number;
  createdAt: string;
  settings: RoomSettings;
  currentContent?: ContentItem;
  hasLocalFile?: boolean;
  localFileName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number; // percentage from left
  y: number; // percentage from bottom
}

export interface PlaybackSyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  timestamp: number; // epoch ms when event was sent
  updatedBy: string;
}

export interface WatchHistoryItem {
  id: string;
  content: ContentItem;
  watchedAt: string;
  watchedWith: string;
  progressPercent: number;
  rating?: number;
  reviewNotes?: string;
}
