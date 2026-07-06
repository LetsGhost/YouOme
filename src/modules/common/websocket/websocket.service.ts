import { eventBus } from "../messaging/event-bus";
import { logger } from "../logger/logger";
import { WsEvent } from "./websocket-event";
import { WsEventMeta } from "./websocket.types";

const log = logger.child({ label: "websocket" });

export class WebsocketService {
  /**
   * Single entrypoint for "creating" a websocket event, from either a
   * backend module (outbound) or a relayed client message (inbound).
   * Always logs, then publishes onto the shared eventBus so any module can
   * subscribe via a normal events/*.handler.ts, exactly like domain events.
   */
  async emit(
    type: string,
    payload: Record<string, unknown> = {},
    meta: WsEventMeta = {}
  ): Promise<void> {
    const direction = meta.direction ?? "outbound";
    const event = new WsEvent(type, meta.userId ?? "system", payload);

    log.info(`[ws:event] ${type}`, {
      direction,
      userId: meta.userId,
      socketId: meta.socketId,
      eventId: event.id,
      payload,
    });

    await eventBus.publish(event);
  }
}

export const websocketService = new WebsocketService();
