import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Heart, MessageSquare, Users, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { ChatMessage, Participant } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  participants: Participant[];
  isOpen: boolean;
  onClose?: () => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😭', '😮', '🔥', '🍿', '👏'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onSendReaction,
  participants,
  isOpen,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

  if (!isOpen) return null;

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#101010] border-l border-white/5 transition-all duration-200">
      {/* Header with Tabs */}
      <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-lg">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'participants'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Watchers ({participants.length})</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* QUICK REACTIONS BAR */}
      <div className="px-3 py-2 bg-[#141414] border-b border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">React:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="text-lg p-1 hover:scale-125 transition-transform duration-150 active:scale-95 hover:bg-white/5 rounded-md"
              title={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      {activeTab === 'chat' ? (
        <>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Heart className="w-8 h-8 text-rose-500/40 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-zinc-400">Say hello to your date!</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Send reactions, chat during pauses, and laugh together.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-medium text-zinc-400">
                      {msg.isSelf ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-zinc-600">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.isSelf
                        ? 'bg-rose-600 text-white rounded-br-xs shadow-md shadow-rose-950/30'
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-xs border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="p-2 bg-zinc-900 border-t border-white/10 grid grid-cols-7 gap-1 text-xl">
              {['🥰', '😍', '💋', '✨', '🥺', '😭', '🫣', '🍿', '🍷', '🍫', '🌹', '🎬', '😱', '💤'].map(
                (e) => (
                  <button
                    key={e}
                    onClick={() => addEmojiToInput(e)}
                    className="p-1 hover:bg-white/10 rounded text-center transition-colors"
                  >
                    {e}
                  </button>
                )
              )}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-zinc-950/70 border-t border-white/5 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message… ❤️"
              className="flex-1 bg-zinc-900 text-white placeholder-zinc-500 text-xs px-3.5 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-xl shadow-sm transition-colors"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      ) : (
        /* Participants Tab */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
            In this theater
          </p>
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 ${
                      p.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-200">
                      {p.name} {p.isSelf && '(You)'}
                    </span>
                    {p.isHost && (
                      <span className="text-[9px] font-medium text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {p.status === 'connected' ? 'Connected · 18ms latency' : 'Connecting…'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-center">
            <Sparkles className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-rose-200">Private 2-Person Date</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Playback actions and reactions are synchronized in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
