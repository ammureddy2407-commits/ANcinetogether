import { apiUrl, getServerEndpoint } from './config';

export type SyncEventType =
  | 'PLAYBACK_STATE'
  | 'CHAT_MESSAGE'
  | 'REACTION'
  | 'CONTENT_CHANGE'
  | 'PARTNER_JOIN'
  | 'PARTNER_LEAVE'
  | 'WEBRTC_SIGNAL'
  | 'SETTINGS_CHANGE'
  | 'HEARTBEAT';

export interface SyncMessage {
  type: SyncEventType;
  roomId: string;
  senderId: string;
  senderName: string;
  payload: any;
  timestamp: number;
}

export class RoomSyncChannel {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private pollInterval: any = null;
  private listeners: ((message: SyncMessage) => void)[] = [];
  private roomId: string;
  private senderId: string;
  private senderName: string;
  private isDestroyed = false;
  private lastKnownMsgIds = new Set<string>();

  constructor(roomId: string, senderId: string, senderName: string) {
    this.roomId = roomId.toUpperCase();
    this.senderId = senderId;
    this.senderName = senderName;

    // 1. Local BroadcastChannel for same-device multi-tab 0ms speed
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(`cinetogether_${this.roomId}`);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.senderId !== this.senderId) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        // BroadcastChannel optional fallback
      }
    }

    // 2. Real WebSocket for Cross-Device Internet Communication
    this.initWebSocket();

    // 3. Fallback HTTP synchronization polling (every 1.5s)
    this.initHttpPolling();
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const wsUrl = `${getServerEndpoint().wsOrigin}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (this.isDestroyed) {
          socket.close();
          return;
        }
        this.ws = socket;
        // Register in room on the server
        socket.send(
          JSON.stringify({
            type: 'REGISTER',
            roomId: this.roomId,
            userId: this.senderId,
            userName: this.senderName,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.senderId !== this.senderId) {
            this.notifyListeners(data);
          }
        } catch (e) {
          console.warn('WS message parse error', e);
        }
      };

      socket.onerror = (e) => {
        console.warn('WebSocket connection notice (HTTP fallback active)', e);
      };

      socket.onclose = () => {
        this.ws = null;
        // Auto-reconnect if not destroyed
        if (!this.isDestroyed) {
          setTimeout(() => {
            if (!this.isDestroyed) this.initWebSocket();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('WebSocket init error', err);
    }
  }

  private initHttpPolling() {
    if (typeof window === 'undefined') return;

    this.pollInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch(
          apiUrl(`/api/rooms/${this.roomId}/sync?userId=${encodeURIComponent(this.senderId)}`)
        );
        if (!res.ok) return;
        const data = await res.json();

        // Deliver any WebRTC signals destined for this user
        if (Array.isArray(data.signals) && data.signals.length > 0) {
          data.signals.forEach((sig: any) => {
            this.notifyListeners({
              type: 'WEBRTC_SIGNAL',
              roomId: this.roomId,
              senderId: sig.senderId,
              senderName: 'Partner',
              payload: { signal: sig.signal },
              timestamp: sig.timestamp,
            });
          });
        }

        // Deliver any new chat messages from other device
        if (Array.isArray(data.messages)) {
          data.messages.forEach((msg: any) => {
            if (msg.senderId !== this.senderId && !this.lastKnownMsgIds.has(msg.id)) {
              this.lastKnownMsgIds.add(msg.id);
              this.notifyListeners({
                type: 'CHAT_MESSAGE',
                roomId: this.roomId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                payload: msg,
                timestamp: Date.now(),
              });
            }
          });
        }
      } catch (err) {
        // Polling error silently handled
      }
    }, 1500);
  }

  public subscribe(callback: (message: SyncMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  public send(type: SyncEventType, payload: any) {
    const message: SyncMessage = {
      type,
      roomId: this.roomId,
      senderId: this.senderId,
      senderName: this.senderName,
      payload,
      timestamp: Date.now(),
    };

    // 1. Same-device broadcast
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        // ignore
      }
    }

    // 2. Real-time WebSocket to other devices
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        // ignore
      }
    }

    // 3. HTTP REST event delivery to guarantee cross-device persistence
    fetch(apiUrl(`/api/rooms/${this.roomId}/event`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    }).catch(() => {
      // ignore
    });
  }

  public close() {
    this.isDestroyed = true;
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners = [];
  }
}
