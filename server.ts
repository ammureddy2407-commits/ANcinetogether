import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { randomInt, createHash, timingSafeEqual, randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { DatabaseSync } from 'node:sqlite';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Allow the Netlify-hosted frontend (or any origin you set in ALLOWED_ORIGIN) to call this API.
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.get('/healthz', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

// Persistent account database. Only verified email, display name, avatar and
// creation time are stored; one-time codes stay short-lived in process memory.
const dataDirectory = path.join(__dirname, 'data');
mkdirSync(dataDirectory, { recursive: true });
const accountDb = new DatabaseSync(path.join(dataDirectory, 'cinetogether.sqlite'));
accountDb.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const emailCodes = new Map<string, { hash: string; expiresAt: number; attempts: number; lastSentAt: number }>();
const emailHash = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest();

app.post('/api/auth/request-code', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const mode = req.body?.mode === 'login' ? 'login' : 'register';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const account = accountDb.prepare('SELECT id FROM accounts WHERE email = ?').get(email);
  if (mode === 'login' && !account) return res.status(404).json({ error: 'No account uses this email yet. Choose Create account to register.' });
  if (mode === 'register' && account) return res.status(409).json({ error: 'An account already uses this email. Choose Sign in instead.' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return res.status(503).json({ error: 'Email verification is not configured yet. The site owner must set RESEND_API_KEY and RESEND_FROM_EMAIL on the server.' });
  }

  const existing = emailCodes.get(email);
  if (existing && Date.now() - existing.lastSentAt < 60_000) {
    return res.status(429).json({ error: 'Please wait one minute before requesting another code.' });
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your CineTogether verification code',
        html: `<div style="font-family:Arial,sans-serif;color:#18181b"><h2>Verify your email</h2><p>Your CineTogether code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Email provider rejected verification email:', detail);
      return res.status(502).json({ error: 'We could not send the email. Check the mail provider configuration and try again.' });
    }
    emailCodes.set(email, { hash: emailHash(email, code).toString('hex'), expiresAt: Date.now() + 10 * 60_000, attempts: 0, lastSentAt: Date.now() });
    return res.json({ success: true, expiresInSeconds: 600 });
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    return res.status(502).json({ error: 'We could not send the email. Please try again.' });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const mode = req.body?.mode === 'login' ? 'login' : 'register';
  const pending = emailCodes.get(email);
  if (!pending || pending.expiresAt < Date.now()) {
    emailCodes.delete(email);
    return res.status(400).json({ error: 'That code has expired. Request a new verification code.' });
  }
  if (pending.attempts >= 5) {
    emailCodes.delete(email);
    return res.status(429).json({ error: 'Too many incorrect attempts. Request a new verification code.' });
  }
  pending.attempts += 1;
  const supplied = emailHash(email, code);
  const expected = Buffer.from(pending.hash, 'hex');
  if (!/^\d{6}$/.test(code) || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(400).json({ error: 'That verification code is incorrect.' });
  }
  emailCodes.delete(email);

  let account = accountDb.prepare('SELECT id, email, name, avatar, created_at FROM accounts WHERE email = ?').get(email) as any;
  if (mode === 'register') {
    const name = String(req.body?.name || '').trim().slice(0, 30);
    const avatar = String(req.body?.avatar || '').slice(0, 500);
    if (name.length < 2) return res.status(400).json({ error: 'Enter your name to create your account.' });
    try {
      const id = `usr-${randomUUID()}`;
      const createdAt = new Date().toISOString();
      accountDb.prepare('INSERT INTO accounts (id, email, name, avatar, created_at) VALUES (?, ?, ?, ?, ?)').run(id, email, name, avatar, createdAt);
      account = { id, email, name, avatar, created_at: createdAt };
    } catch (error) {
      console.error('Account database write failed:', error);
      return res.status(500).json({ error: 'We could not save your account. Please try again.' });
    }
  }
  if (!account) return res.status(404).json({ error: 'No account uses this email yet. Create an account first.' });

  return res.json({
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      partnerNickname: '',
      bio: '',
      notificationPreferences: { roomInvites: true, chatSounds: true, reactionSounds: true },
      createdAt: `Joined ${new Date(account.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`,
    },
  });
});

// Email-only access flow: no verification-code delivery is required.
app.post('/api/auth/continue', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  let account = accountDb.prepare('SELECT id, email, name, avatar, created_at FROM accounts WHERE email = ?').get(email) as any;
  if (!account) {
    try {
      const id = `usr-${randomUUID()}`;
      const name = email.split('@')[0].slice(0, 30) || 'Movie lover';
      const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      const createdAt = new Date().toISOString();
      accountDb.prepare('INSERT INTO accounts (id, email, name, avatar, created_at) VALUES (?, ?, ?, ?, ?)').run(id, email, name, avatar, createdAt);
      account = { id, email, name, avatar, created_at: createdAt };
    } catch (error) {
      console.error('Account database write failed:', error);
      return res.status(500).json({ error: 'We could not save your account. Please try again.' });
    }
  }
  return res.json({
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      partnerNickname: '',
      bio: '',
      notificationPreferences: { roomInvites: true, chatSounds: true, reactionSounds: true },
      createdAt: `Joined ${new Date(account.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`,
    },
  });
});

app.post('/api/auth/update-name', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || '').trim().slice(0, 30);
  if (!email || name.length < 2) return res.status(400).json({ error: 'A valid email and name are required.' });
  const result = accountDb.prepare('UPDATE accounts SET name = ? WHERE email = ?').run(name, email);
  if (!result.changes) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ success: true });
});

// In-memory room store for real-time multi-device sessions
interface RoomData {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  privacy: string;
  maxParticipants: number;
  createdAt: string;
  settings: any;
  currentContent: any;
  playbackState: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    timestamp: number;
    updatedBy: string;
  };
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    cameraEnabled: boolean;
    micEnabled: boolean;
    lastSeen: number;
  }>;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    text: string;
    timestamp: string;
    isSelf?: boolean;
  }>;
  signals: Array<{
    targetUserId: string;
    senderId: string;
    signal: any;
    timestamp: number;
  }>;
}

const rooms = new Map<string, RoomData>();

// REST API ROUTES
app.post('/api/rooms', (req, res) => {
  const room = req.body;
  if (!room || !room.code) {
    return res.status(400).json({ error: 'Invalid room data' });
  }
  const cleanCode = room.code.toUpperCase();
  if (rooms.has(cleanCode)) {
    return res.status(409).json({ error: 'Room code already exists. Create a new room with a fresh code.' });
  }
  const roomData: RoomData = {
    ...room,
    code: cleanCode,
    privacy: Number(room.maxParticipants) > 10 ? 'private' : room.privacy,
    maxParticipants: Math.max(2, Math.min(20, Number(room.maxParticipants) || 2)),
    settings: {
      allowGuestControl: true,
      chatEnabled: true,
      reactionsEnabled: true,
      requireCamera: false,
      requireMicrophone: false,
      videoQuality: '1080p',
      ambientLighting: 'candlelight',
      ...(room.settings || {}),
    },
    playbackState: room.playbackState || {
      isPlaying: false,
      currentTime: 0,
      duration: room.currentContent?.durationSeconds || 100,
      timestamp: Date.now(),
      updatedBy: room.hostId,
    },
    participants: room.participants || [],
    messages: room.messages || [],
    signals: [],
  };
  rooms.set(cleanCode, roomData);
  res.json({ success: true, room: roomData });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.post('/api/rooms/:code/join', (req, res) => {
  const code = req.params.code.toUpperCase();
  let room = rooms.get(code);
  const { user } = req.body;

  if (!room) {
    return res.status(404).json({ error: 'Room not found. Check the invite code and try again.' });
  }

  if (user?.id && user.id !== room.hostId) {
    const alreadyJoined = room.participants.some((participant) => participant.id === user.id);
    const occupiedSeats = new Set([room.hostId, ...room.participants.map((participant) => participant.id)]).size;
    if (!alreadyJoined && occupiedSeats >= room.maxParticipants) {
      return res.status(409).json({ error: `This room is full (${room.maxParticipants} participants maximum).` });
    }
  }

  if (user && user.id) {
    const existing = room.participants.find((p) => p.id === user.id);
    if (!existing) {
      room.participants.push({
        id: user.id,
        name: user.name || 'Anonymous',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        cameraEnabled: user.cameraEnabled ?? true,
        micEnabled: user.micEnabled ?? true,
        lastSeen: Date.now(),
      });
    } else {
      existing.lastSeen = Date.now();
    }
  }

  broadcastToRoom(code, {
    type: 'PARTNER_JOIN',
    roomId: code,
    senderId: user?.id,
    senderName: user?.name,
    payload: { user, room },
    timestamp: Date.now(),
  });

  res.json({ success: true, room });
});

// Periodic state poll / sync endpoint (HTTP fallback for WebSockets)
app.get('/api/rooms/:code/sync', (req, res) => {
  const code = req.params.code.toUpperCase();
  const userId = req.query.userId as string;
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Update participant last seen
  if (userId) {
    const p = room.participants.find((part) => part.id === userId);
    if (p) p.lastSeen = Date.now();
  }

  // Retrieve any WebRTC signals destined for this user or any signal from other room participants
  const userSignals = room.signals.filter(
    (s) => s.senderId !== userId && (!s.targetUserId || s.targetUserId === userId)
  );
  // Clear retrieved signals
  room.signals = room.signals.filter(
    (s) => !(s.senderId !== userId && (!s.targetUserId || s.targetUserId === userId))
  );

  res.json({
    playbackState: room.playbackState,
    currentContent: room.currentContent,
    messages: room.messages,
    participants: room.participants,
    signals: userSignals,
  });
});

app.post('/api/rooms/:code/event', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { type, payload, senderId, senderName } = req.body;

  if (type === 'PLAYBACK_STATE') {
    room.playbackState = {
      ...payload,
      timestamp: Date.now(),
      updatedBy: senderId,
    };
  } else if (type === 'CHAT_MESSAGE') {
    room.messages.push(payload);
    if (room.messages.length > 100) room.messages.shift();
  } else if (type === 'CONTENT_CHANGE') {
    room.currentContent = payload;
    room.playbackState.currentTime = 0;
    room.playbackState.isPlaying = false;
  } else if (type === 'WEBRTC_SIGNAL') {
    if (payload && payload.signal) {
      room.signals.push({
        targetUserId: payload.targetUserId,
        senderId,
        signal: payload.signal,
        timestamp: Date.now(),
      });
      // Purge stale signals older than 30s
      const now = Date.now();
      room.signals = room.signals.filter((s) => now - s.timestamp < 30000);
    }
  }

  // Broadcast to all active WebSocket clients in this room
  broadcastToRoom(code, {
    type,
    roomId: code,
    senderId,
    senderName,
    payload,
    timestamp: Date.now(),
  }, senderId);

  res.json({ success: true });
});

// CREATE HTTP SERVER
const server = createServer(app);

// PEERJS SIGNALING SERVER (Native WebRTC audio/video stream routing)
// PeerJS's own WebSocket server rejects every upgrade that is not on its path, which breaks
// Socket.IO websockets on the same port. Give it a private event bus instead of the real
// HTTP server and forward only /peerjs upgrades to it (see the 'upgrade' handler below).
const peerUpgradeBus = new EventEmitter();
const peerServer = ExpressPeerServer(peerUpgradeBus as any, {
  path: '/',
  allow_discovery: false,
  corsOptions: { origin: allowedOrigin === '*' ? true : allowedOrigin.split(',').map((o) => o.trim()) },
});
app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`[PeerJS Server] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[PeerJS Server] Client disconnected: ${client.getId()}`);
});

// SOCKET.IO SIGNALING & PRESENCE SERVER
const io = new SocketIOServer(server, {
  path: '/socket.io',
  cors: { origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map((o) => o.trim()) },
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userId, userName, peerId }) => {
    if (!roomId) return;
    const cleanRoom = roomId.toUpperCase();
    socket.join(cleanRoom);
    console.log(`[Socket.IO] ${userName} (${userId}) joined room ${cleanRoom} with peerId ${peerId}`);
    socket.to(cleanRoom).emit('peer-joined', { userId, userName, peerId });

    // Send current room state back to newly joined client
    const room = rooms.get(cleanRoom);
    if (room) {
      socket.emit('room-initial-state', {
        currentContent: room.currentContent,
        playbackState: room.playbackState,
        messages: room.messages,
        participants: room.participants,
        hostId: room.hostId,
        hostName: room.hostName,
      });
    }
  });

  // Synchronized Video Player State (Play, Pause, Seek)
  socket.on('playback-update', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      const room = rooms.get(cleanRoom);
      if (room) {
        room.playbackState = {
          isPlaying: data.isPlaying,
          currentTime: data.currentTime,
          duration: data.duration || room.playbackState.duration,
          timestamp: Date.now(),
          updatedBy: data.senderName || data.senderId,
        };
      }
      // Broadcast synchronized playback state to all other room participants
      socket.to(cleanRoom).emit('playback-update', data);
    }
  });

  // Real-time Chat message exchange
  socket.on('chat-message', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      const room = rooms.get(cleanRoom);
      if (room && data.message) {
        room.messages.push(data.message);
        if (room.messages.length > 100) room.messages.shift();
      }
      socket.to(cleanRoom).emit('chat-message', data);
    }
  });

  // Floating Reaction exchange
  socket.on('reaction', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      socket.to(cleanRoom).emit('reaction', data);
    }
  });

  // Movie content change exchange
  socket.on('content-change', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      const room = rooms.get(cleanRoom);
      if (room && data.content) {
        room.currentContent = data.content;
        room.playbackState.currentTime = 0;
        room.playbackState.isPlaying = false;
        room.playbackState.timestamp = Date.now();
      }
      socket.to(cleanRoom).emit('content-change', data);
    }
  });

  socket.on('settings-update', (data) => {
    if (!data?.roomId || !data?.settings) return;
    const cleanRoom = String(data.roomId).toUpperCase();
    const room = rooms.get(cleanRoom);
    if (!room) return;
    room.settings = { ...room.settings, ...data.settings };
    socket.to(cleanRoom).emit('settings-update', { ...data, settings: room.settings });
  });

  // WebRTC & PeerJS stream update / re-call notification
  socket.on('stream-updated', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      socket.to(cleanRoom).emit('stream-updated', data);
    }
  });

  socket.on('request-peer-call', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      socket.to(cleanRoom).emit('request-peer-call', data);
    }
  });

  socket.on('webrtc-signal', (data) => {
    if (data && data.roomId) {
      const cleanRoom = data.roomId.toUpperCase();
      socket.to(cleanRoom).emit('webrtc-signal', data);
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('peer-left', { socketId: socket.id });
      }
    }
  });
});

// WEBSOCKET SERVER
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/socket.io')) {
    return; // handled by Socket.IO's own upgrade listener
  }
  if (url.pathname.startsWith('/peerjs')) {
    peerUpgradeBus.emit('upgrade', request, socket, head);
    return;
  }
  // Handle application websocket connection requests specifically on /ws or /socket
  if (url.pathname === '/ws' || url.pathname.startsWith('/ws/') || url.pathname === '/socket') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

interface ClientMeta {
  ws: WebSocket;
  roomId?: string;
  userId?: string;
  userName?: string;
}

const clients = new Map<WebSocket, ClientMeta>();

wss.on('connection', (ws) => {
  clients.set(ws, { ws });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const client = clients.get(ws);
      if (!client) return;

      if (msg.type === 'REGISTER') {
        client.roomId = (msg.roomId || '').toUpperCase();
        client.userId = msg.userId;
        client.userName = msg.userName;

        // Also broadcast presence
        if (client.roomId) {
          broadcastToRoom(client.roomId, {
            type: 'PARTNER_JOIN',
            roomId: client.roomId,
            senderId: client.userId,
            senderName: client.userName,
            payload: { userId: client.userId, userName: client.userName },
            timestamp: Date.now(),
          }, client.userId);
        }
        return;
      }

      if (msg.roomId) {
        const roomId = msg.roomId.toUpperCase();
        const room = rooms.get(roomId);

        if (room) {
          if (msg.type === 'PLAYBACK_STATE') {
            room.playbackState = msg.payload;
          } else if (msg.type === 'CHAT_MESSAGE') {
            room.messages.push(msg.payload);
            if (room.messages.length > 100) room.messages.shift();
          } else if (msg.type === 'CONTENT_CHANGE') {
            room.currentContent = msg.payload;
            room.playbackState.currentTime = 0;
            room.playbackState.isPlaying = false;
          } else if (msg.type === 'WEBRTC_SIGNAL') {
            if (msg.payload && msg.payload.signal) {
              room.signals.push({
                targetUserId: msg.payload.targetUserId,
                senderId: msg.senderId,
                signal: msg.payload.signal,
                timestamp: Date.now(),
              });
            }
          }
        }

        // Broadcast to all other clients in the room
        broadcastToRoom(roomId, msg, msg.senderId);
      }
    } catch (e) {
      console.warn('WS message error:', e);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client && client.roomId && client.userId) {
      broadcastToRoom(client.roomId, {
        type: 'PARTNER_LEAVE',
        roomId: client.roomId,
        senderId: client.userId,
        senderName: client.userName,
        payload: { userId: client.userId },
        timestamp: Date.now(),
      });
    }
    clients.delete(ws);
  });
});

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const raw = JSON.stringify(message);
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      if (excludeUserId && meta.userId === excludeUserId) {
        continue;
      }
      ws.send(raw);
    }
  }
}

// SETUP VITE IN DEV / STATIC IN PROD
async function start() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CineTogether server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
