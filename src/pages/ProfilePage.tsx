import React, { useState } from 'react';
import {
  User,
  Heart,
  Mail,
  Bell,
  Film,
  Calendar,
  Check,
  Camera,
  Sparkles,
  Save,
  Volume2,
} from 'lucide-react';
import { UserProfile, WatchHistoryItem } from '../types';

interface ProfilePageProps {
  user: UserProfile;
  watchHistory: WatchHistoryItem[];
  favoritesCount: number;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  watchHistory,
  favoritesCount,
  onUpdateUser,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);
  const [partnerNickname, setPartnerNickname] = useState(user.partnerNickname || '');
  const [bio, setBio] = useState(user.bio || '');
  const [roomInvites, setRoomInvites] = useState(user.notificationPreferences.roomInvites);
  const [chatSounds, setChatSounds] = useState(user.notificationPreferences.chatSounds);
  const [reactionSounds, setReactionSounds] = useState(user.notificationPreferences.reactionSounds);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name,
      email,
      avatar,
      partnerNickname,
      bio,
      notificationPreferences: {
        roomInvites,
        chatSounds,
        reactionSounds,
      },
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto bg-[#080808]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <User className="w-4 h-4" />
          <span>Account & Profile</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Profile</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Manage your personal details, partner nickname, and virtual theater settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/5 text-center space-y-3">
            <div className="relative inline-block mx-auto">
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-rose-500/40 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-zinc-900 shadow">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </span>
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{name}</h3>
              <p className="text-xs text-zinc-400">{email}</p>
              {partnerNickname && (
                <p className="text-xs font-medium text-rose-300 mt-1">
                  Dating: {partnerNickname}
                </p>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 pt-1">
              Member since {user.createdAt || 'February 2025'}
            </p>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5">
                <p className="font-bold text-base text-white">{watchHistory.length}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Movie Nights</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5">
                <p className="font-bold text-base text-rose-300">{favoritesCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Favorites</p>
              </div>
            </div>
          </div>

          {/* Quick Avatar Chooser */}
          <div className="p-4 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Choose Avatar
            </span>
            <div className="flex items-center justify-center gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(preset)}
                  className={`w-9 h-9 rounded-full overflow-hidden transition-all ${
                    avatar === preset ? 'ring-2 ring-rose-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-white/5 space-y-5">
            <h2 className="font-bold text-base text-white">Profile Details</h2>

            {savedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="optional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Partner’s Nickname
              </label>
              <input
                type="text"
                value={partnerNickname}
                onChange={(e) => setPartnerNickname(e.target.value)}
                placeholder="e.g. Rahul ❤️"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                This name will appear on your date night invitations and camera overlay.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Bio / Favorite Genres
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Tell your date about your movie tastes…"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Notifications & Audio Chimes
              </h3>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-zinc-200">Room Invites</p>
                  <p className="text-[11px] text-zinc-500">Show alert when your partner creates a room</p>
                </div>
                <input
                  type="checkbox"
                  checked={roomInvites}
                  onChange={(e) => setRoomInvites(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-zinc-200">Subtle Chat Chimes</p>
                  <p className="text-[11px] text-zinc-500">Gentle sound effect when messages arrive</p>
                </div>
                <input
                  type="checkbox"
                  checked={chatSounds}
                  onChange={(e) => setChatSounds(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-zinc-200">Reaction Sound FX</p>
                  <p className="text-[11px] text-zinc-500">Play chime when romantic hearts float</p>
                </div>
                <input
                  type="checkbox"
                  checked={reactionSounds}
                  onChange={(e) => setReactionSounds(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-950"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
