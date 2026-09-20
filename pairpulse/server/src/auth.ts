import * as crypto from 'crypto';
import { DeviceRole } from './types';

export interface PendingPairing {
  code: string;
  pairId: string;
  controllerToken: string;
  expiresAt: number;
}

export interface StoredPair {
  pairId: string;
  controllerToken: string;
  receiverToken: string;
  createdAt: number;
}

export class AuthManager {
  // Map of 6-digit pairing code -> PendingPairing
  private pendingPairings = new Map<string, PendingPairing>();
  // Map of pairId -> StoredPair
  private pairs = new Map<string, StoredPair>();
  // Quick lookup for tokens: token -> { pairId, role }
  private tokenIndex = new Map<string, { pairId: string; role: DeviceRole }>();

  /**
   * Generates a new 6-digit pairing code for an initiating controller.
   * Expires in 5 minutes (300 seconds).
   */
  public createPairingRequest(): { code: string; pairId: string; controllerToken: string; expiresInSeconds: number } {
    this.cleanupExpiredCodes();

    let code = '';
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.pendingPairings.has(code));

    const pairId = 'pair_' + crypto.randomBytes(12).toString('hex');
    const controllerToken = 'tok_ctrl_' + crypto.randomBytes(24).toString('hex');
    const expiresInSeconds = 300;
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    this.pendingPairings.set(code, {
      code,
      pairId,
      controllerToken,
      expiresAt,
    });

    return { code, pairId, controllerToken, expiresInSeconds };
  }

  /**
   * Validates a 6-digit code submitted by a receiver.
   * Completes the pairing, registers credentials, and returns tokens.
   */
  public confirmPairing(code: string): { pairId: string; controllerToken: string; receiverToken: string } | null {
    this.cleanupExpiredCodes();

    const pending = this.pendingPairings.get(code);
    if (!pending) {
      return null;
    }

    // Code matched! Generate receiver token
    const receiverToken = 'tok_recv_' + crypto.randomBytes(24).toString('hex');
    const pair: StoredPair = {
      pairId: pending.pairId,
      controllerToken: pending.controllerToken,
      receiverToken,
      createdAt: Date.now(),
    };

    this.pairs.set(pending.pairId, pair);
    this.tokenIndex.set(pending.controllerToken, { pairId: pending.pairId, role: 'controller' });
    this.tokenIndex.set(receiverToken, { pairId: pending.pairId, role: 'receiver' });

    // Invalidate the ephemeral code immediately so it cannot be reused
    this.pendingPairings.delete(code);

    return {
      pairId: pending.pairId,
      controllerToken: pending.controllerToken,
      receiverToken,
    };
  }

  /**
   * Authenticates a client connection with their persisted token.
   */
  public authenticate(token: string, claimedRole: DeviceRole, claimedPairId: string): boolean {
    const entry = this.tokenIndex.get(token);
    if (!entry) {
      return false;
    }
    return entry.pairId === claimedPairId && entry.role === claimedRole;
  }

  /**
   * Retrieves role and pairId from token
   */
  public lookupToken(token: string): { pairId: string; role: DeviceRole } | null {
    return this.tokenIndex.get(token) || null;
  }

  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [code, pending] of this.pendingPairings.entries()) {
      if (pending.expiresAt <= now) {
        this.pendingPairings.delete(code);
      }
    }
  }
}
