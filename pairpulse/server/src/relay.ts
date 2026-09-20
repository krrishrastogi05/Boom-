import { WebSocket, RawData } from 'ws';
import { AuthManager } from './auth';
import {
  DeviceRole,
  OverlaySignalMessage,
  OverlayState,
  PairPulseMessage,
} from './types';

interface ClientSession {
  ws: WebSocket;
  role: DeviceRole | null;
  pairId: string | null;
  isAuthenticated: boolean;
  isAlive: boolean;
  rateLimitTokens: number;
  lastRateRefill: number;
}

interface PairSession {
  pairId: string;
  controllerSocket?: WebSocket;
  receiverSocket?: WebSocket;
  pendingControllerSocket?: WebSocket; // Socket awaiting pairing confirmation
  overlayState: OverlayState;
  lastSeq: number;
}

export class RelayServer {
  private authManager = new AuthManager();
  private sessions = new Map<WebSocket, ClientSession>();
  private pairs = new Map<string, PairSession>();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor() {
    this.startHeartbeat();
  }

  public handleConnection(ws: WebSocket): void {
    const session: ClientSession = {
      ws,
      role: null,
      pairId: null,
      isAuthenticated: false,
      isAlive: true,
      rateLimitTokens: 20,
      lastRateRefill: Date.now(),
    };

    this.sessions.set(ws, session);

    ws.on('pong', () => {
      session.isAlive = true;
    });

    ws.on('message', (data: RawData) => {
      const t2 = Date.now();
      this.handleMessage(session, data, t2);
    });

    ws.on('close', () => {
      this.handleDisconnect(session);
    });

    ws.on('error', (err) => {
      console.error('[Relay] Socket error:', err.message);
    });
  }

  private handleMessage(session: ClientSession, rawData: RawData, t2: number): void {
    let msg: PairPulseMessage;
    try {
      msg = JSON.parse(rawData.toString()) as PairPulseMessage;
    } catch {
      this.sendError(session.ws, 'Invalid JSON payload');
      return;
    }

    if (!msg || typeof msg.type !== 'string') {
      this.sendError(session.ws, 'Missing message type');
      return;
    }

    switch (msg.type) {
      case 'PING': {
        this.send(session.ws, {
          type: 'PONG',
          clientTimestamp: msg.clientTimestamp,
          serverTimestamp: Date.now(),
        });
        break;
      }

      case 'PAIR_REQUEST': {
        // Laptop A (Controller) initiates pairing and awaits Laptop B
        const pairingInfo = this.authManager.createPairingRequest();
        session.role = 'controller';
        session.pairId = pairingInfo.pairId;

        // Ensure PairSession exists and remember this pending controller socket
        const pairSession = this.getOrCreatePairSession(pairingInfo.pairId);
        pairSession.pendingControllerSocket = session.ws;

        this.send(session.ws, {
          type: 'PAIR_CODE',
          code: pairingInfo.code,
          expiresInSeconds: pairingInfo.expiresInSeconds,
        });
        console.log(`[Relay] New pairing code generated: ${pairingInfo.code} for pairId: ${pairingInfo.pairId}`);
        break;
      }

      case 'PAIR_CONFIRM': {
        // Laptop B (Receiver) submits the 6-digit code
        if (!msg.code || typeof msg.code !== 'string') {
          this.send(session.ws, { type: 'PAIR_FAIL', reason: 'Missing pairing code' });
          return;
        }

        const result = this.authManager.confirmPairing(msg.code.trim());
        if (!result) {
          this.send(session.ws, { type: 'PAIR_FAIL', reason: 'Invalid or expired pairing code' });
          return;
        }

        session.role = 'receiver';
        session.pairId = result.pairId;
        session.isAuthenticated = true;

        const pairSession = this.getOrCreatePairSession(result.pairId);
        pairSession.receiverSocket = session.ws;

        // Send credentials to Receiver
        this.send(session.ws, {
          type: 'PAIR_OK',
          pairId: result.pairId,
          role: 'receiver',
          token: result.receiverToken,
        });

        // Notify and authenticate the waiting Controller if connected
        const ctrlSocket = pairSession.pendingControllerSocket;
        if (ctrlSocket && ctrlSocket.readyState === WebSocket.OPEN) {
          const ctrlSession = this.sessions.get(ctrlSocket);
          if (ctrlSession) {
            ctrlSession.isAuthenticated = true;
            ctrlSession.role = 'controller';
            ctrlSession.pairId = result.pairId;
            pairSession.controllerSocket = ctrlSocket;
            pairSession.pendingControllerSocket = undefined;

            this.send(ctrlSocket, {
              type: 'PAIR_OK',
              pairId: result.pairId,
              role: 'controller',
              token: result.controllerToken,
            });
            console.log(`[Relay] Pairing confirmed! PairId: ${result.pairId}`);
          }
        }
        break;
      }

      case 'AUTH': {
        if (!msg.token || !msg.role || !msg.pairId) {
          this.send(session.ws, { type: 'AUTH_FAIL', reason: 'Missing credentials' });
          return;
        }

        const isValid = this.authManager.authenticate(msg.token, msg.role, msg.pairId);
        if (!isValid) {
          this.send(session.ws, { type: 'AUTH_FAIL', reason: 'Authentication failed' });
          return;
        }

        session.isAuthenticated = true;
        session.role = msg.role;
        session.pairId = msg.pairId;

        const pairSession = this.getOrCreatePairSession(msg.pairId);
        if (msg.role === 'controller') {
          pairSession.controllerSocket = session.ws;
          pairSession.lastSeq = 0; // Reset sequence on controller authentication
        } else {
          pairSession.receiverSocket = session.ws;
        }

        const partnerOnline =
          msg.role === 'controller'
            ? pairSession.receiverSocket?.readyState === WebSocket.OPEN
            : pairSession.controllerSocket?.readyState === WebSocket.OPEN;

        this.send(session.ws, {
          type: 'AUTH_OK',
          pairId: msg.pairId,
          role: msg.role,
          currentOverlayState: pairSession.overlayState,
          pairedOnline: partnerOnline,
        });

        // Inform the partner if online
        const partnerSocket = msg.role === 'controller' ? pairSession.receiverSocket : pairSession.controllerSocket;
        if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
          this.send(partnerSocket, {
            type: 'STATE_SYNC',
            state: pairSession.overlayState,
            seq: pairSession.lastSeq,
            pairedOnline: true,
          });
        }
        console.log(`[Relay] Authenticated ${msg.role} for pair: ${msg.pairId}`);
        break;
      }

      case 'OVERLAY_ON':
      case 'OVERLAY_OFF':
      case 'OVERLAY_TOGGLE': {
        this.handleOverlaySignal(session, msg, t2);
        break;
      }

      case 'STATE_SYNC': {
        if (!session.isAuthenticated || !session.pairId) {
          this.sendError(session.ws, 'Unauthorized');
          return;
        }
        const pairSession = this.pairs.get(session.pairId);
        if (pairSession) {
          const partnerOnline =
            session.role === 'controller'
              ? pairSession.receiverSocket?.readyState === WebSocket.OPEN
              : pairSession.controllerSocket?.readyState === WebSocket.OPEN;

          this.send(session.ws, {
            type: 'STATE_SYNC',
            state: pairSession.overlayState,
            seq: pairSession.lastSeq,
            pairedOnline: partnerOnline,
          });
        }
        break;
      }

      default:
        this.sendError(session.ws, `Unknown message type: ${(msg as any).type}`);
    }
  }

  /**
   * Ultra-fast hot path: Zero DB lookups, zero allocations, direct forward to receiver
   */
  private handleOverlaySignal(session: ClientSession, msg: OverlaySignalMessage, t2: number): void {
    if (!session.isAuthenticated || session.role !== 'controller' || !session.pairId) {
      this.sendError(session.ws, 'Only authenticated controller can send overlay signals');
      return;
    }

    // Rate Limiting (Token Bucket: 20 tokens max, refills 20/sec)
    const now = Date.now();
    const elapsedSec = (now - session.lastRateRefill) / 1000;
    session.rateLimitTokens = Math.min(20, session.rateLimitTokens + elapsedSec * 20);
    session.lastRateRefill = now;

    if (session.rateLimitTokens < 1) {
      console.warn(`[Relay] Rate limit exceeded for controller on pair ${session.pairId}`);
      return;
    }
    session.rateLimitTokens -= 1;

    const pairSession = this.pairs.get(session.pairId);
    if (!pairSession) {
      return;
    }

    // Monotonic sequence number validation
    if (typeof msg.seq === 'number') {
      if (pairSession.lastSeq > 0 && msg.seq <= pairSession.lastSeq && (pairSession.lastSeq - msg.seq) < 50) {
        console.warn(`[Relay] Ignored stale sequence number: ${msg.seq} (last: ${pairSession.lastSeq})`);
        return;
      }
      pairSession.lastSeq = msg.seq;
    }

    // Update server's in-memory tracking of overlay state
    if (msg.type === 'OVERLAY_ON') {
      pairSession.overlayState = 'ON';
    } else if (msg.type === 'OVERLAY_OFF') {
      pairSession.overlayState = 'OFF';
    } else if (msg.type === 'OVERLAY_TOGGLE') {
      pairSession.overlayState = pairSession.overlayState === 'ON' ? 'OFF' : 'ON';
    }

    // Record high-resolution server forwarding timestamp
    msg.t2 = t2;
    msg.t3 = Date.now();

    // Direct, immediate forward to receiver
    const receiverSocket = pairSession.receiverSocket;
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      this.send(receiverSocket, msg);
    } else {
      console.warn(`[Relay] Receiver not connected for pair: ${session.pairId}`);
    }
  }

  private handleDisconnect(session: ClientSession): void {
    this.sessions.delete(session.ws);

    if (session.pairId) {
      const pairSession = this.pairs.get(session.pairId);
      if (pairSession) {
        if (session.ws === pairSession.controllerSocket) {
          pairSession.controllerSocket = undefined;
          console.log(`[Relay] Controller disconnected from pair: ${session.pairId}`);
        } else if (session.ws === pairSession.receiverSocket) {
          pairSession.receiverSocket = undefined;
          console.log(`[Relay] Receiver disconnected from pair: ${session.pairId}`);
        } else if (session.ws === pairSession.pendingControllerSocket) {
          pairSession.pendingControllerSocket = undefined;
        }

        // Notify the remaining peer of partner disconnect
        const remainingPeer = pairSession.controllerSocket || pairSession.receiverSocket;
        if (remainingPeer && remainingPeer.readyState === WebSocket.OPEN) {
          this.send(remainingPeer, {
            type: 'STATE_SYNC',
            state: pairSession.overlayState,
            seq: pairSession.lastSeq,
            pairedOnline: false,
          });
        }
      }
    }
  }

  private getOrCreatePairSession(pairId: string): PairSession {
    let session = this.pairs.get(pairId);
    if (!session) {
      session = {
        pairId,
        overlayState: 'OFF',
        lastSeq: 0,
      };
      this.pairs.set(pairId, session);
    }
    return session;
  }

  private send(ws: WebSocket, data: PairPulseMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    this.send(ws, { type: 'ERROR', message });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [ws, session] of this.sessions.entries()) {
        if (!session.isAlive) {
          console.log('[Relay] Terminating dead connection (missed pong)');
          ws.terminate();
          continue;
        }
        session.isAlive = false;
        ws.ping();
      }
    }, 25000);
  }

  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
