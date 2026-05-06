import { BaseService } from "../../common/base/base.service";
import { DebtLedgerEntryModel } from "../model/debtLedgerEntry.model";
import { DebtLedgerEntryEntity } from "../entity/debtLedgerEntry.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { DebtLedgerEntryCreatedEvent } from "../events/debtLedgerEntry-created.event";

export class DebtLedgerService extends BaseService<DebtLedgerEntryEntity> {
  constructor() {
    super(DebtLedgerEntryModel);
  }

  async createEntry(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    options: { sourceType?: string; sourceId?: string } = {}
  ) {
    const entry = await this.create({
      groupId,
      fromUserId,
      toUserId,
      amount,
      sourceType: options.sourceType,
      sourceId: options.sourceId,
    });

    const event = new DebtLedgerEntryCreatedEvent(entry._id.toString(), {
      groupId: entry.groupId,
      fromUserId: entry.fromUserId,
      toUserId: entry.toUserId,
      amount: entry.amount,
    });
    await eventBus.publish(event);

    return entry;
  }
}

export const debtLedgerService = new DebtLedgerService();
