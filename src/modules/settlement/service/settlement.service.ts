import { BaseService } from "../../common/base/base.service";
import { SettlementModel } from "../model/settlement.model";
import { SettlementEntity } from "../entity/settlement.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { SettlementCreatedEvent } from "../events/settlement-created.event";

export class SettlementService extends BaseService<SettlementEntity> {
  constructor() {
    super(SettlementModel);
  }

  async createSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number
  ) {
    const settlement = await this.create({
      groupId,
      fromUserId,
      toUserId,
      amount,
      status: "pending",
    });

    const event = new SettlementCreatedEvent(settlement._id.toString(), {
      groupId: settlement.groupId,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: settlement.amount,
    });
    await eventBus.publish(event);

    return settlement;
  }
}

export const settlementService = new SettlementService();
