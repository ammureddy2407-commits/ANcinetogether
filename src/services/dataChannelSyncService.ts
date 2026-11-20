export interface DataChannelMessage {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'HEARTBEAT' | 'HEARTBEAT_ACK' | 'REACTION' | 'CHAT' | 'CONTENT_CHANGE';
  currentTime: number;
  isPlaying?: boolean;
  timestamp: number;
  senderId: string;
  senderName: string;
  payload?: any;
}

export type PlaybackAction = 'PLAY' | 'PAUSE' | 'SEEK' | 'HEARTBEAT_SYNC';

export type PlaybackActionHandler = (
  action: PlaybackAction,
  compensatedTime: number,
  isPlaying: boolean,
  senderName: string
) => void;

export class DataChannelSyncService {
  private dataChannel: RTCDataChannel | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private userId: string;
  private userName: string;
  private isOpen = false;
  private rttMs = 0;
  private heartbeatTimer: any = null;

  private onPlaybackCallback: PlaybackActionHandler | null = null;
  private onStateChangeCallback: ((isOpen: boolean, rttMs: number) => void) | null = null;
  private onReactionCallback: ((emoji: string, senderName: string) => void) | null = null;
  private onChatCallback: ((message: any) => void) | null = null;
  private onContentCallback: ((content: any, senderName: string) => void) | null = null;

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
  }

  // Bind to PeerConnection to automatically listen for incoming data channels
  public bindPeerConnection(pc: RTCPeerConnection) {
    this.peerConnection = pc;
    pc.ondatachannel = (event: RTCDataChannelEvent) => {
      this.handleIncomingDataChannel(event);
    };
  }

  // Create DataChannel as the offerer
  public initAsOfferer(pc: RTCPeerConnection): RTCDataChannel | null {
    this.peerConnection = pc;
    try {
      if (this.dataChannel && this.dataChannel.readyState !== 'closed') {
        try {
          this.dataChannel.close();
        } catch (_) {}
      }
      const dc = pc.createDataChannel('cinetogether_playback_sync', {
        ordered: true,
      });
      this.setupDataChannel(dc);
      return dc;
    } catch (e) {
      console.warn('Failed to create RTCDataChannel:', e);
      return null;
    }
  }

  // Bind to incoming DataChannel on answerer/receiver
  public handleIncomingDataChannel(event: RTCDataChannelEvent) {
    if (event.channel && event.channel.label === 'cinetogether_playback_sync') {
      this.setupDataChannel(event.channel);
    }
  }

  private setupDataChannel(dc: RTCDataChannel) {
    this.dataChannel = dc;

    dc.onopen = () => {
      this.isOpen = true;
      this.notifyStateChange();
      this.startHeartbeat();
    };

    dc.onclose = () => {
      this.isOpen = false;
      this.stopHeartbeat();
      this.notifyStateChange();
    };

    dc.onerror = (err) => {
      console.warn('RTCDataChannel error:', err);
    };

    dc.onmessage = (event) => {
      try {
        const msg: DataChannelMessage = JSON.parse(event.data);
        if (msg.senderId === this.userId) return;
        this.handleMessage(msg);
      } catch (e) {
        console.warn('Error parsing DataChannel message:', e);
      }
    };
  }

  private handleMessage(msg: DataChannelMessage) {
    const now = Date.now();
    // One-way transit delay estimation: half of RTT or difference
    const transitDelay = Math.max(0, (now - msg.timestamp) / 1000);

    switch (msg.type) {
      case 'PLAY': {
        const compensatedTime = msg.currentTime + transitDelay;
        if (this.onPlaybackCallback) {
          this.onPlaybackCallback('PLAY', compensatedTime, true, msg.senderName);
        }
        break;
      }

      case 'PAUSE': {
        if (this.onPlaybackCallback) {
          this.onPlaybackCallback('PAUSE', msg.currentTime, false, msg.senderName);
        }
        break;
      }

      case 'SEEK': {
        const compensatedTime = msg.isPlaying ? msg.currentTime + transitDelay : msg.currentTime;
        if (this.onPlaybackCallback) {
          this.onPlaybackCallback('SEEK', compensatedTime, !!msg.isPlaying, msg.senderName);
        }
        break;
      }

      case 'CONTENT_CHANGE': {
        if (this.onContentCallback && msg.payload) {
          this.onContentCallback(msg.payload, msg.senderName);
        }
        break;
      }

      case 'HEARTBEAT': {
        this.sendDirect({
          type: 'HEARTBEAT_ACK',
          currentTime: msg.currentTime,
          timestamp: msg.timestamp,
          senderId: this.userId,
          senderName: this.userName,
        });

        // Drift check on heartbeat: if drift > 0.8s, adjust smoothly without flashing notifications
        if (msg.isPlaying && msg.currentTime > 0 && this.onPlaybackCallback) {
          const compensatedTime = msg.currentTime + transitDelay;
          this.onPlaybackCallback('HEARTBEAT_SYNC', compensatedTime, true, msg.senderName);
        }
        break;
      }

      case 'HEARTBEAT_ACK': {
        const rtt = Math.max(1, now - msg.timestamp);
        this.rttMs = Math.round(rtt);
        this.notifyStateChange();
        break;
      }

      case 'REACTION': {
        if (this.onReactionCallback && msg.payload?.emoji) {
          this.onReactionCallback(msg.payload.emoji, msg.senderName);
        }
        break;
      }

      case 'CHAT': {
        if (this.onChatCallback && msg.payload) {
          this.onChatCallback(msg.payload);
        }
        break;
      }
    }
  }

  private sendDirect(msg: DataChannelMessage): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(msg));
        return true;
      } catch (e) {
        console.warn('DataChannel send error:', e);
      }
    }
    return false;
  }

  // Public playback action dispatchers
  public broadcastPlay(currentTime: number): boolean {
    return this.sendDirect({
      type: 'PLAY',
      currentTime,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
    });
  }

  public broadcastPause(currentTime: number): boolean {
    return this.sendDirect({
      type: 'PAUSE',
      currentTime,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
    });
  }

  public broadcastSeek(currentTime: number, isPlaying: boolean): boolean {
    return this.sendDirect({
      type: 'SEEK',
      currentTime,
      isPlaying,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
    });
  }

  public broadcastReaction(emoji: string): boolean {
    return this.sendDirect({
      type: 'REACTION',
      currentTime: 0,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
      payload: { emoji },
    });
  }

  public broadcastChat(message: any): boolean {
    return this.sendDirect({
      type: 'CHAT',
      currentTime: 0,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
      payload: message,
    });
  }

  public broadcastContentChange(content: any): boolean {
    return this.sendDirect({
      type: 'CONTENT_CHANGE',
      currentTime: 0,
      timestamp: Date.now(),
      senderId: this.userId,
      senderName: this.userName,
      payload: content,
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isOpen) {
        this.sendDirect({
          type: 'HEARTBEAT',
          currentTime: 0,
          timestamp: Date.now(),
          senderId: this.userId,
          senderName: this.userName,
        });
      }
    }, 2500);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.isOpen, this.rttMs);
    }
  }

  public onPlayback(callback: PlaybackActionHandler) {
    this.onPlaybackCallback = callback;
  }

  public onStateChange(callback: (isOpen: boolean, rttMs: number) => void) {
    this.onStateChangeCallback = callback;
  }

  public onReaction(callback: (emoji: string, senderName: string) => void) {
    this.onReactionCallback = callback;
  }

  public onChat(callback: (message: any) => void) {
    this.onChatCallback = callback;
  }

  public onContentChange(callback: (content: any, senderName: string) => void) {
    this.onContentCallback = callback;
  }

  public getIsDataChannelActive(): boolean {
    return this.isOpen;
  }

  public getLatency(): number {
    return this.rttMs;
  }

  public destroy() {
    this.stopHeartbeat();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    this.isOpen = false;
  }
}
