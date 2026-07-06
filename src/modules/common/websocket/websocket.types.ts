export interface ConnectedUser {
  id: string;
  role: string;
}

export type WsEventDirection = "inbound" | "outbound";

export interface WsEventMeta {
  userId?: string;
  socketId?: string;
  direction?: WsEventDirection;
}

export interface InboundWsMessage {
  type: string;
  payload?: Record<string, unknown>;
}
