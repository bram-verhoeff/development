import { Peer } from 'peerjs';

export class PeerManager {
  constructor(options = {}) {
    this.peer = null;
    this.myId = null;
    this.roomId = null;
    this.isHost = false;
    this.connections = new Map(); // peerId -> DataConnection
    this.callbacks = {
      onPeerJoin: options.onPeerJoin || (() => {}),
      onPeerLeave: options.onPeerLeave || (() => {}),
      onPeerUpdate: options.onPeerUpdate || (() => {}),
      onShootEvent: options.onShootEvent || (() => {}),
      onDamageEvent: options.onDamageEvent || (() => {}),
      onStatusChange: options.onStatusChange || (() => {}),
    };
    this.status = 'initializing';
    this.ping = 0;
  }

  init() {
    // Determine room ID from URL hash or query params
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const urlRoom = params.get('room') || (hash.startsWith('room=') ? hash.replace('room=', '') : null);

    if (urlRoom) {
      this.roomId = urlRoom;
      this.isHost = false;
      this.joinRoom(urlRoom);
    } else {
      const generatedRoom = 'vortex-' + Math.random().toString(36).substring(2, 7);
      this.roomId = generatedRoom;
      this.isHost = true;
      this.hostRoom(generatedRoom);
      // Update URL hash without reload
      window.location.hash = `room=${generatedRoom}`;
    }
  }

  hostRoom(roomCode) {
    this.updateStatus(`Hosting room ${roomCode}...`);

    // Host uses roomCode as their Peer ID so clients can connect directly
    const hostPeerId = `vortex-room-${roomCode}`;
    this.peer = new Peer(hostPeerId, {
      debug: 1,
    });

    this.peer.on('open', (id) => {
      this.myId = id;
      this.isHost = true;
      this.updateStatus(`Room active: ${roomCode} (Waiting for combatants)`);
    });

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.warn('Host Peer error:', err.type, err);
      if (err.type === 'unavailable-id') {
        // ID is already taken -> someone is already hosting this room, connect as client instead!
        this.isHost = false;
        this.joinRoom(roomCode);
      } else {
        this.updateStatus(`Network notice: ${err.type}`);
      }
    });
  }

  joinRoom(roomCode) {
    this.updateStatus(`Connecting to room ${roomCode}...`);

    // Client creates a random peer ID and connects to the host ID
    this.peer = new Peer({
      debug: 1,
    });

    this.peer.on('open', (id) => {
      this.myId = id;
      const hostPeerId = `vortex-room-${roomCode}`;
      const conn = this.peer.connect(hostPeerId, { reliable: false });
      this.setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.warn('Client Peer error:', err.type, err);
      if (err.type === 'peer-unavailable') {
        // Host is offline, promote this client to room host
        this.destroy();
        this.isHost = true;
        this.hostRoom(roomCode);
      } else {
        this.updateStatus(`Room notice: ${err.type}`);
      }
    });
  }

  setupConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.callbacks.onPeerJoin(conn.peer);
      this.updateStatus(`Connected (${this.connections.size} peer(s))`);

      // Send initial handshake
      conn.send({
        type: 'handshake',
        senderId: this.myId,
        timestamp: Date.now(),
      });
    });

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      switch (data.type) {
        case 'state':
          this.callbacks.onPeerUpdate(data.senderId, data.payload);
          // If host, relay to other peers
          if (this.isHost) {
            this.broadcastExcept(data, data.senderId);
          }
          break;

        case 'shoot':
          this.callbacks.onShootEvent(data.payload);
          if (this.isHost) {
            this.broadcastExcept(data, data.senderId);
          }
          break;

        case 'damage':
          this.callbacks.onDamageEvent(data.payload);
          if (this.isHost) {
            this.broadcastExcept(data, data.senderId);
          }
          break;

        case 'ping':
          conn.send({ type: 'pong', sentTime: data.sentTime });
          break;

        case 'pong':
          this.ping = Math.round((Date.now() - data.sentTime) / 2);
          break;

        default:
          break;
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.callbacks.onPeerLeave(conn.peer);
      this.updateStatus(`Peer left (${this.connections.size} peer(s))`);
    });

    conn.on('error', (err) => {
      console.warn(`Connection error with ${conn.peer}:`, err);
    });
  }

  broadcast(message) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(message);
      }
    }
  }

  broadcastExcept(message, excludePeerId) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(message);
      }
    }
  }

  sendState(payload) {
    if (this.connections.size === 0) return;
    this.broadcast({
      type: 'state',
      senderId: this.myId,
      payload,
    });
  }

  sendShoot(payload) {
    this.broadcast({
      type: 'shoot',
      senderId: this.myId,
      payload,
    });
  }

  sendDamage(targetId, amount, isHeadshot) {
    this.broadcast({
      type: 'damage',
      senderId: this.myId,
      payload: {
        targetId,
        attackerId: this.myId,
        amount,
        isHeadshot,
      },
    });
  }

  updateStatus(msg) {
    this.status = msg;
    this.callbacks.onStatusChange(msg);
  }

  destroy() {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
