import { UserProfile, WatchHistoryItem, ContentItem, Room } from '../types';
import { FEATURED_MOVIES } from '../data/mockContent';

const STORAGE_KEYS = {
  USER: 'cinetogether_user',
  FAVORITES: 'cinetogether_favorites',
  HISTORY: 'cinetogether_history',
  ROOMS: 'cinetogether_recent_rooms',
  ACTIVE_ROOM: 'cinetogether_active_room',
};

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

function generateUniqueUserId(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `usr-${rand}-${Date.now().toString(36)}`;
}

// Old builds silently created a demo account ("Sarah Jenkins") for everyone.
// Treat any such leftover as "no account" so people set up their own name.
const isLegacyDemoUser = (u: any): boolean =>
  !u ||
  !u.id ||
  !u.email ||
  u.id === 'usr-default-1' ||
  u.id === 'usr-google-user' ||
  u.email === 'sarah@example.com' ||
  u.email === 'sarah.jenkins@gmail.com' ||
  u.name === 'Sarah Jenkins' ||
  u.name === 'Sarah Jenkins (Google)';

/** Returns the saved profile, or null if this browser has not set one up yet. */
export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!isLegacyDemoUser(parsed)) return parsed as UserProfile;
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch (e) {
    console.error('Failed to load user', e);
  }
  return null;
};

export const createUserProfile = (name: string, partnerNickname?: string, avatar?: string): UserProfile => {
  const user: UserProfile = {
    id: generateUniqueUserId(),
    name: name.trim(),
    email: '',
    avatar: avatar || AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
    partnerNickname: partnerNickname?.trim() || '',
    bio: '',
    notificationPreferences: { roomInvites: true, chatSounds: true, reactionSounds: true },
    createdAt: `Joined ${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`,
  };
  saveStoredUser(user);
  return user;
};

export const clearStoredUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
  } catch (e) {
    console.error('Failed to clear user', e);
  }
};

export const saveStoredUser = (user: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const getFavorites = (): ContentItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load favorites', e);
  }
  return FEATURED_MOVIES.filter((m) => m.isFavorite);
};

export const toggleFavoriteStorage = (item: ContentItem): ContentItem[] => {
  const current = getFavorites();
  const exists = current.some((f) => f.id === item.id);
  const updated = exists ? current.filter((f) => f.id !== item.id) : [...current, { ...item, isFavorite: true }];
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
  return updated;
};

export const getWatchHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load history', e);
  }
  return [];
};

export const addToWatchHistory = (entry: WatchHistoryItem): WatchHistoryItem[] => {
  const current = getWatchHistory();
  const filtered = current.filter((h) => h.content.id !== entry.content.id);
  const updated = [entry, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save watch history', e);
  }
  return updated;
};

export const getStoredRecentRooms = (): Room[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load rooms', e);
  }
  return [];
};

export const saveRecentRoom = (room: Room) => {
  const current = getStoredRecentRooms();
  const filtered = current.filter((r) => r.code !== room.code);
  const updated = [room, ...filtered].slice(0, 5);
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save rooms', e);
  }
};
