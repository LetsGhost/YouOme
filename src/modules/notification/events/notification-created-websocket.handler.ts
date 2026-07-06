import { EventHandler } from "../../common/messaging/event-handler";
import { websocketService } from "../../common/websocket/websocket.service";
import { NotificationCreatedEvent } from "./notification-created.event";

export class NotificationCreatedWebsocketHandler extends EventHandler<NotificationCreatedEvent> {
  getEventType(): string {
    return "notification.created";
  }

  async handle(event: NotificationCreatedEvent): Promise<void> {
    await websocketService.emit("ws.notification.created", event.payload, {
      userId: event.payload.userId,
    });
  }
}

export const notificationCreatedWebsocketHandler = new NotificationCreatedWebsocketHandler();
