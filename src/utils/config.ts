// Where the realtime backend (server.ts) lives.
//  - Same-origin deploy (Render/Railway/Fly serving both site + API): leave VITE_SERVER_URL empty.
//  - Netlify frontend + separate backend: set VITE_SERVER_URL=https://your-backend.onrender.com
const raw = ((import.meta as any).env?.VITE_SERVER_URL as string | undefined)?.trim() || '';

export const SERVER_URL = raw.replace(/\/+$/, '');

export const apiUrl = (path: string): string => `${SERVER_URL}${path}`;

export const generateRoomCode = (): string => {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(-12).toUpperCase();
  return `CT-${randomPart}`;
};

export function getServerEndpoint() {
  const base = SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const u = new URL(base);
  const secure = u.protocol === 'https:';
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : secure ? 443 : 80,
    secure,
    wsOrigin: `${secure ? 'wss:' : 'ws:'}//${u.host}`,
    httpOrigin: SERVER_URL || undefined, // undefined => socket.io uses same origin
  };
}

export const hasBackendConfigured = (): boolean => {
  if (SERVER_URL) return true;
  if (typeof window === 'undefined') return true;
  // On Netlify / static hosts there is no same-origin backend.
  return !/netlify\.app$|github\.io$|pages\.dev$|vercel\.app$/i.test(window.location.hostname);
};
