import React, { useState } from 'react';
import { Heart, Film, User, Clock, Bookmark, DoorOpen, Menu, X, Sparkles, LogOut, Check } from 'lucide-react';
import { Page, UserProfile, Room } from '../types';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: UserProfile | null;
  onLogout?: () => void;
  activeRoom: Room | null;
  onLeaveRoom?: () => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  user,
  activeRoom,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-white stroke-[2.2]" />
              <Heart className="w-3.5 h-3.5 text-white fill-white absolute -bottom-1 -right-1 drop-shadow" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-rose-200 bg-clip-text text-transparent">
                CineTogether
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-rose-400 text-xs font-semibold">
                ❤️
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('history')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'history'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Watch History
            </button>
            <button
              onClick={() => setCurrentPage('favorites')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'favorites'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setCurrentPage('profile')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'profile'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Active Room Indicator (if in room or minimized) */}
          {activeRoom && currentPage !== 'watch-room' && (
            <button
              onClick={() => setCurrentPage('watch-room')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-200 bg-rose-500/15 border border-rose-500/30 rounded-full hover:bg-rose-500/25 transition-all shadow-sm shadow-rose-950"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>In Room: {activeRoom.name}</span>
            </button>
          )}

          {/* Quick Create Room Button */}
          {currentPage !== 'watch-room' && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onOpenJoinRoom}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
              >
                Join Code
              </button>
              <button
                onClick={onOpenCreateRoom}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-900/50 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Room</span>
              </button>
            </div>
          )}

          {/* User Avatar Menu */}
          {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/5 transition-all border border-white/10"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
              />
              <span className="hidden lg:inline text-xs font-medium text-zinc-200 pr-1 truncate max-w-[100px]">
                {user.name.split(' ')[0]}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  
                  {user.partnerNickname && (
                    <p className="text-[11px] text-rose-400 font-medium mt-0.5">Partner: {user.partnerNickname}</p>
                  )}
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setCurrentPage('profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Your Profile & Preferences</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('favorites');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Favorite Movies</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('history');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Watch History</span>
                  </button>
                </div>
                <div className="pt-1 border-t border-white/5">
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-900/50"
            >
              Get started
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d0d0d] border-b border-white/10 px-4 pt-2 pb-5 space-y-2">
          <button
            onClick={() => {
              setCurrentPage('dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Home Dashboard
          </button>
          <button
            onClick={() => {
              setCurrentPage('history');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Watch History
          </button>
          <button
            onClick={() => {
              setCurrentPage('favorites');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Favorite Movies
          </button>
          <button
            onClick={() => {
              setCurrentPage('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Profile
          </button>
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                onOpenJoinRoom();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-medium text-center text-zinc-300 bg-zinc-800 rounded-lg"
            >
              Join Room
            </button>
            <button
              onClick={() => {
                onOpenCreateRoom();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-medium text-center text-white bg-rose-600 rounded-lg"
            >
              Create Room
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
