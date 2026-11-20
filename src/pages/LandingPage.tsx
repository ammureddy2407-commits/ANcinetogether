import React from 'react';
import {
  Film,
  Heart,
  Video,
  MessageSquare,
  Sparkles,
  Users,
  Tv,
  Upload,
  ArrowRight,
  Shield,
  Play,
  Smile,
  Mic,
  Maximize2,
} from 'lucide-react';
import { Page } from '../types';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenCreateRoom,
  onOpenJoinRoom,
}) => {
  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-rose-500/30 selection:text-rose-200">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Subtle romantic ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-rose-900/15 via-rose-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Quiet kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-rose-300 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Miles apart. One screen.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Movie nights are{' '}
              <span className="bg-gradient-to-r from-rose-400 via-rose-200 to-white bg-clip-text text-transparent">
                better together.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Watch, laugh, react, and stay connected — even when you’re miles apart.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={onOpenCreateRoom}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Create a Room</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenJoinRoom}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-sm border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span>Join a Room</span>
              </button>
            </div>
          </div>

          {/* HERO VISUAL MOCKUP */}
          <div className="mt-14 max-w-5xl mx-auto relative group">
            {/* Frame Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-600/30 via-zinc-800 to-rose-600/20 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Cinematic Theater Preview Container */}
            <div className="relative rounded-3xl overflow-hidden bg-[#101010] border border-white/15 shadow-2xl">
              {/* Fake Browser / Room Header */}
              <div className="px-5 py-3 bg-zinc-950/90 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-semibold text-zinc-300">
                    CineTogether ❤️ · Friday Night Room (CT-48291)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Synced
                  </span>
                </div>
              </div>

              {/* Theater Canvas: Left Movie Screen + Right Side Stacked Cams & Chat */}
              <div className="relative aspect-[16/9] w-full bg-black flex overflow-hidden">
                {/* Left Area: Full Movie Canvas */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80"
                    alt="Movie Scene Preview"
                    className="w-full h-full object-cover filter brightness-90"
                  />

                  {/* Floating Hearts Reaction Mock */}
                  <div className="absolute bottom-24 right-1/4 animate-bounce">
                    <span className="text-4xl drop-shadow-lg">❤️</span>
                  </div>
                  <div className="absolute bottom-36 right-1/3 animate-pulse">
                    <span className="text-3xl drop-shadow-lg">🍿</span>
                  </div>

                  {/* Bottom Timeline Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-rose-600 rounded-lg">
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </div>
                      <span className="font-mono text-zinc-400">24:18 / 1:38:00</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">1080p Full HD</span>
                      <Maximize2 className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Cam 1, Cam 2 below it, and Chat below on the same side */}
                <div className="w-56 sm:w-64 md:w-72 bg-[#121212] border-l border-white/10 flex flex-col justify-between shrink-0 p-2.5 space-y-2">
                  {/* CAM 1: Partner Camera (Top) */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-rose-500/30 shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
                      alt="Partner Camera"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-full text-[9px] text-rose-200 flex items-center gap-1 backdrop-blur-sm border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Alex ❤️</span>
                    </div>
                  </div>

                  {/* CAM 2: Your Camera (Below Partner Camera) */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      alt="Your Camera"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-full text-[9px] text-zinc-200 flex items-center gap-1 backdrop-blur-sm">
                      <Mic className="w-2.5 h-2.5 text-emerald-400" />
                      <span>You (Live)</span>
                    </div>
                  </div>

                  {/* CHATTING SECTION: Below the two cameras on the same right side */}
                  <div className="flex-1 bg-zinc-950/70 rounded-xl border border-white/5 p-2 flex flex-col justify-between min-h-[90px]">
                    <div className="space-y-1.5 text-[10px]">
                      <div className="bg-zinc-900 p-1.5 rounded-lg text-zinc-300">
                        <span className="text-rose-400 font-semibold block">Alex:</span>
                        “This soundtrack is giving me chills 🥰”
                      </div>
                      <div className="bg-rose-600/90 text-white p-1.5 rounded-lg ml-auto max-w-[85%] text-right">
                        “Best movie date ever ❤️”
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-1 border-t border-white/5 text-[9px] text-zinc-500">
                      <span>Quick React: ❤️ 🍿 😂 🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-[#0c0c0c] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">
              Simple & Intimate
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              How CineTogether Works
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              No tricky browser extensions or complicated signups required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Create a room',
                desc: 'Create a private movie room with customizable date ambiance in seconds.',
                icon: Film,
              },
              {
                step: '02',
                title: 'Invite your person',
                desc: 'Share the room code or invitation link with your date or partner.',
                icon: Heart,
              },
              {
                step: '03',
                title: 'Pick something to watch',
                desc: 'Choose supported online content or pick a video directly from your device.',
                icon: Tv,
              },
              {
                step: '04',
                title: 'Watch together',
                desc: 'Enjoy synchronized playback while seeing, talking, and laughing with each other.',
                icon: Video,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="p-6 rounded-3xl bg-zinc-900/60 border border-white/5 hover:border-rose-500/30 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-bold text-rose-400">
                        {card.step}
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-white/5 text-rose-400 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-rose-200 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE FEATURES SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Built for Romance & True Cinema
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Every detail is designed so you can forget the miles between you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Synchronized Playback',
              desc: 'Sub-second synchronization ensures you gasp, tear up, and laugh at the exact same frame.',
              icon: Play,
            },
            {
              title: 'Live Video Cameras',
              desc: 'High-definition WebRTC video feeds let you see your partner’s genuine expressions.',
              icon: Video,
            },
            {
              title: 'Real-time Chat & Whispers',
              desc: 'Share private inside jokes, sweet comments, and timestamped thoughts without interrupting.',
              icon: MessageSquare,
            },
            {
              title: 'Romantic Floating Reactions',
              desc: 'Tap floating hearts, popcorn, laughing, and fire reactions that gently flutter across the screen.',
              icon: Heart,
            },
            {
              title: 'Private & Secure Rooms',
              desc: 'End-to-end invite-only rooms protect your intimate moments. No uninvited guests.',
              icon: Shield,
            },
            {
              title: 'Watch from Your Device',
              desc: 'Select local video files (.mp4, .webm) right from your computer with zero cloud upload delay.',
              icon: Upload,
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-6 rounded-3xl bg-[#121212] border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white">{feat.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-rose-950/60 via-zinc-900 to-rose-950/40 border border-rose-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready for your virtual movie date?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Grab your favorite snacks, cozy up with a blanket, and start your movie night in under a minute together with your partner.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onOpenCreateRoom}
                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-sm shadow-xl shadow-rose-950 transition-all"
              >
                Start Movie Date Now
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-2xl text-sm transition-colors"
              >
                Explore Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
