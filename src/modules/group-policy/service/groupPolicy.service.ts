import { BaseService } from "../../common/base/base.service";
import { GroupPolicyModel } from "../model/groupPolicy.model";
import { GroupPolicyEntity } from "../entity/groupPolicy.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupPolicyCreatedEvent } from "../events/groupPolicy-created.event";

export class GroupPolicyService extends BaseService<GroupPolicyEntity> {
  constructor() {
    super(GroupPolicyModel);
  }

  /**
   * Creates the policy for a group, or updates it in place if one already
   * exists. A group has exactly one policy, so this is upsert semantics
   * rather than a strict create - calling this twice for the same group
   * (e.g. once from the `group.created` seed handler, once from the API)
   * must not create duplicate policy documents.
   */
  async createPolicy(groupId: string, policy: Partial<GroupPolicyEntity>) {
    const existing = await this.model.findOne({ groupId });

    if (existing) {
      existing.set({ ...policy, groupId });
      await existing.save();
      return existing;
    }

    const created = await this.create({ groupId, ...policy });
    const event = new GroupPolicyCreatedEvent(created._id.toString(), { groupId: created.groupId });
    await eventBus.publish(event);
    return created;
  }

  async getByGroupId(groupId: string) {
    return this.model.findOne({ groupId });
  }

  async updatePolicy(groupId: string, updates: Partial<GroupPolicyEntity>) {
    const policy = await this.model.findOneAndUpdate(
      { groupId },
      { $set: updates },
      { new: true }
    );

    if (!policy) {
      throw new Error("Policy not found for this group");
    }

    return policy;
  }
}

export const groupPolicyService = new GroupPolicyService();
