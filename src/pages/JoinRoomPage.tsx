import React, { useState, useEffect } from 'react';
import { DoorOpen, ArrowRight, AlertCircle } from 'lucide-react';
import { Room } from '../types';

interface JoinRoomPageProps {
  onJoinRoom: (code: string, displayName: string) => void;
  onCancel: () => void;
  recentRooms: Room[];
  initialCode?: string;
  defaultName: string;
}

export const JoinRoomPage: React.FC<JoinRoomPageProps> = ({
  onJoinRoom,
  onCancel,
  recentRooms,
  initialCode = '',
  defaultName,
}) => {
  const [roomCode, setRoomCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState(defaultName);
  const [error, setError] = useState('');

  // Check URL params for ?room=CT-XXXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('room');
      if (urlCode) {
        setRoomCode(urlCode.toUpperCase());
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let clean = roomCode.trim().toUpperCase();
    if (displayName.trim().length < 2) {
      setError('Enter the name you want other people in the room to see.');
      return;
    }
    if (!clean) {
      setError('Please enter a room code.');
      return;
    }

    if (!clean.startsWith('CT-') && /^\d+$/.test(clean)) {
      clean = `CT-${clean}`;
    }

    if (!clean.startsWith('CT-') && clean.length < 5) {
      setError('Room code should look like CT-48291.');
      return;
    }

    onJoinRoom(clean, displayName.trim());
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080808]">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/25">
            <DoorOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Join your movie night
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enter the code sent by your date to enter the room.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your name in this room</label>
            <input type="text" required minLength={2} maxLength={30} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How should others see you?" className="w-full bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 p-3 focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Enter room code
            </label>
            <input
              type="text"
              required
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. CT-48291"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl text-center font-mono tracking-widest text-lg text-white placeholder-zinc-500 p-3 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Join Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* RECENT ROOMS SHORTCUTS */}
        {recentRooms.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Or join a recent room:
            </span>
            <div className="space-y-2">
              {recentRooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onJoinRoom(r.code)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-left text-xs text-zinc-300 hover:text-white transition-colors flex items-center justify-between"
                >
                  <div className="truncate">
                    <span className="font-semibold text-white">{r.name}</span>
                    <span className="text-zinc-500 ml-2 font-mono">({r.code})</span>
                  </div>
                  <span className="text-rose-400 text-[11px] shrink-0 font-medium">Rejoin</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
};
