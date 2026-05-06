import { BaseService } from "../../common/base/base.service";
import { P2PThreadModel } from "../model/p2pThread.model";
import { P2PThreadEntity } from "../entity/p2pThread.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { P2PThreadCreatedEvent } from "../events/p2pThread-created.event";

export class P2PThreadService extends BaseService<P2PThreadEntity> {
  constructor() {
    super(P2PThreadModel);
  }

  async createThread(userAId: string, userBId: string, baseCurrency?: string) {
    const thread = await this.create({ userAId, userBId, baseCurrency });
    const event = new P2PThreadCreatedEvent(thread._id.toString(), { userAId: thread.userAId, userBId: thread.userBId });
    await eventBus.publish(event);
    return thread;
  }
}

export const p2pThreadService = new P2PThreadService();
