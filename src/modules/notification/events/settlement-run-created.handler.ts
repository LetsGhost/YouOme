import { EventHandler } from "../../common/messaging/event-handler";
import { SettlementRunCreatedEvent } from "../../settlement/events/settlement-run-created.event";
import { notificationService } from "../service/notification.service";
import { groupService } from "../../group/service/group.service";

export class SettlementRunCreatedNotificationHandler extends EventHandler<SettlementRunCreatedEvent> {
  getEventType(): string {
    return "settlementRun.created";
  }

  async handle(event: SettlementRunCreatedEvent): Promise<void> {
    const group = await groupService.findById(event.payload.groupId);
    const groupName = group?.name ?? "a group";

    await Promise.all(
      event.payload.settlements.flatMap((settlement) => [
        notificationService.createNotification(settlement.fromUserId, "settlement.run_created", {
          groupId: event.payload.groupId,
          groupName,
          runId: event.aggregateId,
          direction: "outgoing",
          amount: settlement.amount,
          counterpartUserId: settlement.toUserId,
        }),
        notificationService.createNotification(settlement.toUserId, "settlement.run_created", {
          groupId: event.payload.groupId,
          groupName,
          runId: event.aggregateId,
          direction: "incoming",
          amount: settlement.amount,
          counterpartUserId: settlement.fromUserId,
        }),
      ])
    );
  }
}

export const settlementRunCreatedNotificationHandler = new SettlementRunCreatedNotificationHandler();
