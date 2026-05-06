import { BaseDomainEvent } from "../../common/messaging/event";

type NotificationCreatedPayload = {
  userId: string;
  type: string;
};

export class NotificationCreatedEvent extends BaseDomainEvent<NotificationCreatedPayload> {
  constructor(aggregateId: string, payload: NotificationCreatedPayload) {
    super("notification.created", aggregateId, payload);
  }
}
