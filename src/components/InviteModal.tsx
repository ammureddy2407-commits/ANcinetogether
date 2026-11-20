import React, { useState } from 'react';
import { X, Copy, Check, Share2, Heart, Sparkles, Send } from 'lucide-react';
import { Room } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, room }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitedDirectly, setInvitedDirectly] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${currentUrl}?room=${room.code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sendDirectInvite = () => {
    setInvitedDirectly(true);
    setTimeout(() => setInvitedDirectly(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            <h3 className="font-bold text-white text-base">Invite Your Date</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="text-center p-3">
            <p className="text-sm font-semibold text-white">“{room.name}”</p>
            <p className="text-xs text-zinc-400 mt-1">
              Create a new room for each movie night, then use your device’s share sheet to choose who you want to watch with.
            </p>
          </div>

          {/* Room Code Card */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Room Code
              </span>
              <p className="font-mono text-2xl font-bold tracking-widest text-rose-300">
                {room.code}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Direct Invitation Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-zinc-900 border border-white/5 rounded-xl text-xs text-zinc-300 px-3.5 py-2.5 font-mono select-all focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-950"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Native share sheet (WhatsApp, Messages, etc.) */}
          {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
            <button
              onClick={() =>
                (navigator as any)
                  .share({
                    title: 'Watch a movie with me on CineTogether',
                    text: `Join my movie night! Room code: ${room.code}`,
                    url: inviteLink,
                  })
                  .catch(() => {})
              }
              className="w-full px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp, Messages…</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
