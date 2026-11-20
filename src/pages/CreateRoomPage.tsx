import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Shield,
  Users,
  Copy,
  Check,
  ArrowRight,
  Sliders,
  Share2,
  Film,
  Lock,
} from 'lucide-react';
import { Room, RoomSettings, UserProfile } from '../types';
import { generateRoomCode } from '../utils/config';

interface CreateRoomPageProps {
  user: UserProfile;
  onCreateRoom: (room: Room) => Promise<void> | void;
  onEnterRoom: (room: Room) => void;
  onCancel: () => void;
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({
  user,
  onCreateRoom,
  onEnterRoom,
  onCancel,
}) => {
  const [roomName, setRoomName] = useState('Friday Night ❤️');
  const [hostName, setHostName] = useState(user.name);
  const [privacy, setPrivacy] = useState<'private' | 'invite-only'>('private');
  const [maxParticipants, setMaxParticipants] = useState<number>(2);

  // Settings
  const [allowGuestControl, setAllowGuestControl] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [requireCamera, setRequireCamera] = useState(false);
  const [requireMicrophone, setRequireMicrophone] = useState(false);
  const [ambientLighting, setAmbientLighting] = useState<RoomSettings['ambientLighting']>('candlelight');

  // Created state
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);

    const newRoom: Room = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      code: generateRoomCode(),
      name: roomName.trim() || 'Movie Date ❤️',
      hostId: user.id,
      hostName: hostName.trim(),
      privacy,
      maxParticipants,
      createdAt: 'Just now',
      settings: {
        allowGuestControl,
        chatEnabled,
        reactionsEnabled,
        requireCamera,
        requireMicrophone,
        videoQuality: '1080p',
        ambientLighting,
      },
      currentContent: undefined,
    };

    try {
      await onCreateRoom(newRoom);
      setCreatedRoom(newRoom);
    } finally {
      setIsCreating(false);
    }
  };

  const copyCode = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    if (!createdRoom) return;
    const url = `${window.location.origin}?room=${createdRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080808]">
      <div className="w-full max-w-xl bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {!createdRoom ? (
          /* FORM VIEW */
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-300 mb-2">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Host a Date Night</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Create a Watch Room
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Customize your private room settings and prepare your cozy cinema theater.
              </p>
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Room Name
              </label>
              <input
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Friday Night ❤️"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 px-4 py-3 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your name in this room</label>
              <input type="text" required minLength={2} maxLength={30} value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="How should others see you?" className="w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 px-4 py-3 focus:outline-none focus:border-rose-500" />
            </div>

            {/* Privacy & Max Participants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Privacy Mode
                </label>
                <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPrivacy('private')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      privacy === 'private' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Private</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacy('invite-only')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      privacy === 'invite-only' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Invite Only</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Audience Size
                </label>
                <div className="relative">
                  <select
                    value={maxParticipants}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setMaxParticipants(count);
                      if (count > 10) setPrivacy('private');
                    }}
                    className="w-full appearance-none bg-zinc-900 border border-white/10 rounded-xl text-sm text-white px-4 py-3 pr-10 focus:outline-none focus:border-rose-500"
                  >
                    {[2, 4, 6, 8, 10, 12, 16, 20].map((num) => (
                      <option key={num} value={num}>{num} people</option>
                    ))}
                  </select>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">Rooms for more than 10 people are private and invite-only.</p>
              </div>
            </div>

            {/* Optional Room Settings */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Room Permissions & Experience
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-white/5 cursor-pointer">
                  <span className="text-xs text-zinc-200">Allow guests to control playback</span>
                  <input
                    type="checkbox"
                    checked={allowGuestControl}
                    onChange={(e) => setAllowGuestControl(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-white/5 cursor-pointer">
                  <span className="text-xs text-zinc-200">Enable real-time chat & whispers</span>
                  <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-white/5 cursor-pointer">
                  <span className="text-xs text-zinc-200">Enable floating emoji reactions (❤️, 🍿)</span>
                  <input
                    type="checkbox"
                    checked={reactionsEnabled}
                    onChange={(e) => setReactionsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-white/5 cursor-pointer">
                  <span className="text-xs text-zinc-200">Prompt for camera before entering</span>
                  <input
                    type="checkbox"
                    checked={requireCamera}
                    onChange={(e) => setRequireCamera(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2"
              >
                <span>{isCreating ? 'Preparing your room…' : 'Create Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* AFTER CREATION VIEW */
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/40">
              <Sparkles className="w-8 h-8 fill-rose-500/30" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Your Room is Ready!
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Share this room ID or link with your partner to begin your movie date.
              </p>
            </div>

            {/* Room ID Box */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                Room ID
              </span>
              <p className="font-mono text-3xl font-extrabold tracking-widest text-rose-300">
                {createdRoom.code}
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={copyLink}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Invite Link'}</span>
              </button>

              <button
                onClick={() => onEnterRoom(createdRoom)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xl shadow-rose-950 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Enter Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
