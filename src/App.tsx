import React, { useState, useEffect } from 'react';
import { Page, UserProfile, Room, ContentItem, WatchHistoryItem } from './types';
import {
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
  getFavorites,
  toggleFavoriteStorage,
  getWatchHistory,
  getStoredRecentRooms,
  saveRecentRoom,
} from './utils/storage';
import { apiUrl, generateRoomCode, hasBackendConfigured } from './utils/config';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { WatchRoomPage } from './pages/WatchRoomPage';
import { HistoryPage } from './pages/HistoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { Film, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [currentPage, setPageRaw] = useState<Page>('landing');
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [favorites, setFavorites] = useState<ContentItem[]>(getFavorites());
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(getWatchHistory());
  const [recentRooms, setRecentRooms] = useState<Room[]>(getStoredRecentRooms());
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [pendingRoom, setPendingRoom] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Anything except the landing page needs a name first.
  const setCurrentPage = (page: Page) => {
    if (!user && page !== 'landing' && page !== 'auth') {
      setAuthPromptOpen(true);
      return;
    }
    setPageRaw(page);
  };

  // Direct invite links: https://your-site/?room=CT-12345
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (!roomParam) return;
    const code = roomParam.trim().toUpperCase();
    window.history.replaceState({}, '', window.location.pathname);
    setPendingRoom(code);
    setPageRaw(getStoredUser() ? 'join-room' : 'auth');
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    setRecentRooms([]);
    setActiveRoom(null);
    setAuthPromptOpen(false);
    setPageRaw('dashboard');
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    saveStoredUser(updated);
  };

  const updateAccountRoomName = (profile: UserProfile, roomName: string) => {
    const updated = { ...profile, name: roomName };
    handleUpdateUser(updated);
    fetch(apiUrl('/api/auth/update-name'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, name: roomName }),
    }).catch((error) => console.warn('Account display name update notice', error));
    return updated;
  };

  const handleToggleFavorite = (item: ContentItem) => {
    const updated = toggleFavoriteStorage(item);
    setFavorites(updated);
  };

  const handleCreateRoom = async (room: Room) => {
    try {
      const res = await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const savedRoom = data.room || room;
      saveRecentRoom(savedRoom);
      setRecentRooms(getStoredRecentRooms());
    } catch (e) {
      saveRecentRoom(room);
      setRecentRooms(getStoredRecentRooms());
      console.warn('Server room save notice', e);
      setNotice("Couldn't reach the CineTogether server, so your partner won't be able to join this room yet.");
    }
  };

  const handleEnterRoom = (room: Room) => {
    if (user && room.hostName) updateAccountRoomName(user, room.hostName);
    setActiveRoom(room);
    setCurrentPage('watch-room');
  };

  const handleStartRoomWithMovie = async (movie: ContentItem) => {
    const newRoom: Room = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      code: generateRoomCode(),
      name: `${movie.title} Night ❤️`,
      hostId: user!.id,
      hostName: user!.name,
      privacy: 'private',
      maxParticipants: 2,
      createdAt: 'Just now',
      settings: {
        allowGuestControl: true,
        chatEnabled: true,
        reactionsEnabled: true,
        requireCamera: false,
        requireMicrophone: false,
        videoQuality: '1080p',
        ambientLighting: 'candlelight',
      },
      currentContent: movie,
    };

    saveRecentRoom(newRoom);
    setRecentRooms(getStoredRecentRooms());
    setActiveRoom(newRoom);
    setCurrentPage('watch-room');

    try {
      const res = await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('Server room save notice', e);
      setNotice("Couldn't reach the CineTogether server, so your partner won't be able to join this room yet.");
    }
  };

  const handleJoinRoom = async (code: string, roomDisplayName?: string, userToJoin?: UserProfile) => {
    const cleanCode = code.trim().toUpperCase();
    const signedInUser = userToJoin || user;
    if (!signedInUser) {
      setPendingRoom(cleanCode);
      setPageRaw('auth');
      return;
    }
    const activeUser = roomDisplayName ? { ...signedInUser, name: roomDisplayName } : signedInUser;

    try {
      const res = await fetch(apiUrl(`/api/rooms/${cleanCode}/join`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: activeUser }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.room) throw new Error('No room returned');
      if (activeUser.email && activeUser.name !== signedInUser.name) updateAccountRoomName(signedInUser, activeUser.name);
      saveRecentRoom(data.room);
      setRecentRooms(getStoredRecentRooms());
      setNotice(null);
      setPendingRoom(null);
      setActiveRoom(data.room);
      setPageRaw('watch-room');
    } catch (e) {
      console.warn('Server join error', e);
      setNotice(
        "Couldn't reach the CineTogether server, so we can't connect you to that room. Check your internet connection and try again."
      );
      setPageRaw('join-room');
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        activeRoom={activeRoom}
        onLeaveRoom={handleLeaveRoom}
        onOpenCreateRoom={() => setCurrentPage('create-room')}
        onOpenJoinRoom={() => setCurrentPage('join-room')}
        onLogout={handleLogout}
      />

      {/* Connection notices */}
      {(notice || !hasBackendConfigured()) && (
        <div className="bg-amber-950/60 border-b border-amber-500/30 text-amber-200 text-xs px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">
            {notice ||
              'Realtime server not connected: rooms will not sync between devices. (Site owner: set VITE_SERVER_URL to your backend URL, see README.)'}
          </span>
          {notice && (
            <button onClick={() => setNotice(null)} aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={setCurrentPage}
            onOpenCreateRoom={() => setCurrentPage('create-room')}
            onOpenJoinRoom={() => setCurrentPage('join-room')}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            pendingRoom={pendingRoom}
            onSuccess={(updated) => {
              handleUpdateUser(updated);
              if (pendingRoom) {
                setPageRaw('join-room');
              } else {
                setPageRaw('dashboard');
                setAuthPromptOpen(false);
              }
            }}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            user={user || { id: 'guest', name: 'Movie lover', email: '', avatar: '', notificationPreferences: { roomInvites: false, chatSounds: false, reactionSounds: false }, createdAt: '' }}
            favorites={favorites}
            watchHistory={watchHistory}
            recentRooms={recentRooms}
            onStartRoomWithMovie={(movie) => user ? handleStartRoomWithMovie(movie) : setAuthPromptOpen(true)}
            onOpenCreateRoom={() => user ? setCurrentPage('create-room') : setAuthPromptOpen(true)}
            onOpenJoinRoom={() => user ? setCurrentPage('join-room') : setAuthPromptOpen(true)}
            onNavigate={setCurrentPage}
            onToggleFavorite={(item) => user ? handleToggleFavorite(item) : setAuthPromptOpen(true)}
            onRejoinRoom={(room) => {
              if (room.hostName) updateAccountRoomName(user, room.hostName);
              setActiveRoom(room);
              setCurrentPage('watch-room');
            }}
          />
        )}

        {user && currentPage === 'create-room' && (
          <CreateRoomPage
            user={user}
            onCreateRoom={handleCreateRoom}
            onEnterRoom={handleEnterRoom}
            onCancel={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'join-room' && (
          <JoinRoomPage
            onJoinRoom={handleJoinRoom}
            onCancel={() => setCurrentPage('dashboard')}
            recentRooms={recentRooms}
            initialCode={pendingRoom || ''}
            defaultName={user?.name || ''}
          />
        )}

        {user && currentPage === 'watch-room' && activeRoom && (
            <WatchRoomPage
            key={`${activeRoom.id}-${activeRoom.code}`}
            room={activeRoom}
            user={user}
            favorites={favorites}
            onLeaveRoom={handleLeaveRoom}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'history' && (
          <HistoryPage
            history={watchHistory}
            onWatchMovie={handleStartRoomWithMovie}
            onExploreMovies={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'favorites' && (
          <FavoritesPage
            favorites={favorites}
            onWatchMovie={handleStartRoomWithMovie}
            onRemoveFavorite={handleToggleFavorite}
            onExploreMovies={() => setCurrentPage('dashboard')}
          />
        )}

        {user && currentPage === 'profile' && (
          <ProfilePage
            user={user}
            watchHistory={watchHistory}
            favoritesCount={favorites.length}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </main>

      {authPromptOpen && !user && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign in to CineTogether">
          <div className="relative w-full max-w-5xl rounded-[2rem] overflow-hidden border border-white/10 bg-[#101012] shadow-2xl grid md:grid-cols-[1fr_0.9fr]">
            <button onClick={() => setAuthPromptOpen(false)} className="absolute top-4 right-4 z-10 rounded-full bg-black/40 hover:bg-black/70 p-2 text-zinc-300" aria-label="Close login"><X className="w-4 h-4" /></button>
            <div className="relative min-h-[300px] md:min-h-[570px] p-8 md:p-12 flex flex-col justify-end">
              <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85" alt="Warm cinema seats" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
              <div className="relative"><div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 mb-4"><Film className="w-3.5 h-3.5" /> Your private movie night</div><h2 className="text-3xl md:text-4xl font-bold leading-tight">Every story is better<br />when shared.</h2><p className="text-sm text-zinc-300 mt-3 max-w-sm">Sign in to create rooms, invite someone special, and keep your movie night list close.</p></div>
            </div>
            <div className="p-7 sm:p-10 md:p-12 flex flex-col justify-center">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center mb-6"><Film className="w-5 h-5" /></div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-300 font-semibold mb-2">Welcome to CineTogether</p>
              <h3 className="text-2xl font-bold">Sign in or create an account</h3>
              <p className="text-sm text-zinc-400 mt-2 mb-7">Continue to your synchronized cinema experience.</p>
              <button onClick={() => { setAuthPromptOpen(false); setPageRaw('auth'); }} className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-3.5 text-sm font-semibold transition-colors">Continue to sign in / register</button>
              <p className="text-[11px] leading-relaxed text-zinc-500 mt-5">Account setup currently saves a profile on this device. Secure email and password accounts require a connected authentication service.</p>
            </div>
          </div>
        </div>
      )}

      {/* Global Minimalist Footer (Hidden in active watch room to keep full immersion) */}
      {currentPage !== 'watch-room' && (
        <footer className="bg-[#0a0a0a] border-t border-white/5 py-8 text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-rose-600/80 flex items-center justify-center text-white">
                <Film className="w-3 h-3" />
              </div>
              <span className="font-bold text-zinc-300">CineTogether</span>
              <span className="text-zinc-600">·</span>
              <span>Miles apart. One screen.</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <button
                onClick={() => setCurrentPage('landing')}
                className="hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('profile')}
                className="hover:text-white transition-colors"
              >
                Preferences
              </button>
              <span>Made with ❤️ for virtual movie dates</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
