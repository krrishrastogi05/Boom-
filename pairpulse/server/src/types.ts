export type DeviceRole = 'controller' | 'receiver';

export type MessageType =
  | 'AUTH'
  | 'AUTH_OK'
  | 'AUTH_FAIL'
  | 'PAIR_REQUEST'
  | 'PAIR_CODE'
  | 'PAIR_CONFIRM'
  | 'PAIR_OK'
  | 'PAIR_FAIL'
  | 'OVERLAY_ON'
  | 'OVERLAY_OFF'
  | 'OVERLAY_TOGGLE'
  | 'STATE_SYNC'
  | 'PING'
  | 'PONG'
  | 'ERROR';

export type OverlayState = 'ON' | 'OFF' | 'UNKNOWN';

export interface BaseMessage {
  type: MessageType;
  timestamp?: number; // Epoch milliseconds
  seq?: number;       // Monotonically increasing sequence number
}

// Authentication
export interface AuthMessage extends BaseMessage {
  type: 'AUTH';
  token: string;
  role: DeviceRole;
  pairId: string;
}

export interface AuthOkMessage extends BaseMessage {
  type: 'AUTH_OK';
  pairId: string;
  role: DeviceRole;
  currentOverlayState: OverlayState;
  pairedOnline: boolean;
}

export interface AuthFailMessage extends BaseMessage {
  type: 'AUTH_FAIL';
  reason: string;
}

// Pairing Flow
export interface PairRequestMessage extends BaseMessage {
  type: 'PAIR_REQUEST';
  // Controller requests a short pairing code
}

export interface PairCodeMessage extends BaseMessage {
  type: 'PAIR_CODE';
  code: string;
  expiresInSeconds: number;
}

export interface PairConfirmMessage extends BaseMessage {
  type: 'PAIR_CONFIRM';
  code: string;
  role: DeviceRole; // Receiver submitting code
}

export interface PairOkMessage extends BaseMessage {
  type: 'PAIR_OK';
  pairId: string;
  role: DeviceRole;
  token: string;
}

export interface PairFailMessage extends BaseMessage {
  type: 'PAIR_FAIL';
  reason: string;
}

// Signaling & State
export interface OverlaySignalMessage extends BaseMessage {
  type: 'OVERLAY_ON' | 'OVERLAY_OFF' | 'OVERLAY_TOGGLE';
  seq: number;
  t0?: number; // Hotkey detected on Controller
  t1?: number; // Sent from Controller
  t2?: number; // Received at Relay
  t3?: number; // Forwarded from Relay
  t4?: number; // Received at Receiver
  t5?: number; // Overlay rendered / displayed
}

export interface StateSyncMessage extends BaseMessage {
  type: 'STATE_SYNC';
  state: OverlayState;
  seq: number;
  pairedOnline: boolean;
}

export interface PingMessage extends BaseMessage {
  type: 'PING';
  clientTimestamp?: number;
}

export interface PongMessage extends BaseMessage {
  type: 'PONG';
  clientTimestamp?: number;
  serverTimestamp?: number;
}

export interface ErrorMessage extends BaseMessage {
  type: 'ERROR';
  message: string;
}

export type PairPulseMessage =
  | AuthMessage
  | AuthOkMessage
  | AuthFailMessage
  | PairRequestMessage
  | PairCodeMessage
  | PairConfirmMessage
  | PairOkMessage
  | PairFailMessage
  | OverlaySignalMessage
  | StateSyncMessage
  | PingMessage
  | PongMessage
  | ErrorMessage;
