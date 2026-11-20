import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  MessageSquare,
  Eye,
  EyeOff,
  Sparkles,
  ChevronUp,
  X,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MinimalistChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  partnerName: string;
  partnerAvatar?: string;
  selfName: string;
  selfAvatar?: string;
  isSidebarOpen?: boolean;
}

const QUICK_EMOJIS = ['❤️', '🍿', '😂', '🥺', '🔥', '👏'];

export const MinimalistChatOverlay: React.FC<MinimalistChatOverlayProps> = ({
  messages,
  onSendMessage,
  onSendReaction,
  partnerName,
  partnerAvatar,
  selfName,
  isSidebarOpen = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(messages.length);

  // Track unread messages when overlay is hidden
  useEffect(() => {
    if (!isOverlayVisible && messages.length > lastMessageCountRef.current) {
      const added = messages.length - lastMessageCountRef.current;
      setUnreadCount((prev) => prev + added);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isOverlayVisible]);

  // Global keyboard shortcut: Press 'C' or 'Enter' to quickly focus the chat overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          inputRef.current?.blur();
          setIsFocused(false);
          setShowEmojiPicker(false);
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsOverlayVisible(true);
        setUnreadCount(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsOverlayVisible(true);
        setUnreadCount(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    onSendMessage(clean);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    } else {
      setInputText((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Only take the last 4 messages to preserve cinematic view
  const recentMessages = messages.slice(-4);

  return (
    <div
      className={`absolute bottom-20 left-4 sm:left-6 z-25 max-w-sm sm:max-w-md pointer-events-none transition-all duration-300 ${
        isSidebarOpen ? 'opacity-90' : 'opacity-100'
      }`}
    >
      {/* 1. VISIBILITY TOGGLE BUTTON (Small, unobtrusive glass pill) */}
      <div className="mb-2 flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={() => {
            setIsOverlayVisible(!isOverlayVisible);
            if (!isOverlayVisible) setUnreadCount(0);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300 hover:text-white transition-all shadow-md group"
          title={isOverlayVisible ? 'Hide Cinema Chat' : 'Show Cinema Chat (Press C)'}
        >
          {isOverlayVisible ? (
            <>
              <EyeOff className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200" />
              <span className="hidden sm:inline">Cinema Chat</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3 text-rose-400" />
              <span>Cinema Chat</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </>
          )}
        </button>

        {isOverlayVisible && (
          <span className="text-[10px] text-zinc-400 hidden sm:inline select-none">
            Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">C</kbd> to type
          </span>
        )}
      </div>

      {isOverlayVisible && (
        <div className="space-y-2 group/chat">
          {/* 2. RECENT FLOATING CINEMATIC MESSAGES (Semi-transparent, auto-fading) */}
          <div className="space-y-1.5 pointer-events-none">
            {recentMessages.map((msg, index) => {
              const isPartner = !msg.isSelf;
              const isLatest = index === recentMessages.length - 1;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 max-w-[90%] pointer-events-auto transition-opacity duration-500 ${
                    isLatest
                      ? 'opacity-95'
                      : 'opacity-70 group-hover/chat:opacity-95'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-xs backdrop-blur-md shadow-xl border ${
                      isPartner
                        ? 'bg-zinc-950/75 border-rose-500/25 text-zinc-100 rounded-tl-sm'
                        : 'bg-black/65 border-white/10 text-zinc-200 rounded-tr-sm ml-auto'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`font-semibold text-[10px] tracking-tight ${
                          isPartner ? 'text-rose-400' : 'text-zinc-400'
                        }`}
                      >
                        {isPartner ? partnerName : 'You'}
                      </span>
                      <span className="text-[9px] text-zinc-400 select-none">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="leading-snug break-words text-[12px] font-normal drop-shadow-sm">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. MINIMALIST CINEMATIC INPUT BAR */}
          <div className="pointer-events-auto pt-1 relative">
            {/* Quick Emoji Reaction Strip Popup */}
            {showEmojiPicker && (
              <div className="absolute -top-10 left-0 flex items-center gap-1 bg-black/85 backdrop-blur-xl border border-white/15 p-1 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-40">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 active:scale-95 transition-transform rounded-lg hover:bg-white/10"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Input Bar Form */}
            <form
              onSubmit={handleSend}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-xl ${
                isFocused
                  ? 'bg-black/85 border-rose-500/50 ring-2 ring-rose-500/20'
                  : 'bg-black/55 hover:bg-black/75 border-white/15'
              }`}
            >
              {/* Quick Emoji Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-zinc-400 hover:text-rose-400 transition-colors p-0.5 rounded-full"
                title="Reaction emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={`Whisper to ${partnerName.split(' ')[0]}…`}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-400 flex-1 min-w-[140px] sm:min-w-[190px]"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  inputText.trim()
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 scale-100'
                    : 'text-zinc-400 hover:text-zinc-300 opacity-60'
                }`}
                title="Send message (Enter)"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
