import { BaseService } from "../../common/base/base.service";
import { GroupPolicyModel } from "../model/groupPolicy.model";
import { GroupPolicyEntity } from "../entity/groupPolicy.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupPolicyCreatedEvent } from "../events/groupPolicy-created.event";

export class GroupPolicyService extends BaseService<GroupPolicyEntity> {
  constructor() {
    super(GroupPolicyModel);
  }

  async createPolicy(groupId: string, policy: Partial<GroupPolicyEntity>) {
    const created = await this.create({ groupId, ...policy });
    const event = new GroupPolicyCreatedEvent(created._id.toString(), { groupId: created.groupId });
    await eventBus.publish(event);
    return created;
  }
}

export const groupPolicyService = new GroupPolicyService();
