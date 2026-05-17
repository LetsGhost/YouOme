import { BaseService } from "../../common/base/base.service";
import { GroupModel } from "../model/group.model";
import { GroupEntity } from "../entity/group.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupCreatedEvent } from "../events/group-created.event";
import { groupMemberService } from "../../group-member/service/groupMember.service";

export class GroupService extends BaseService<GroupEntity> {
  constructor() {
    super(GroupModel);
  }

  async createGroup(name: string, createdByUserId: string, baseCurrency?: string) {
    const group = await this.create({ name, createdByUserId, baseCurrency });

    const event = new GroupCreatedEvent(group._id.toString(), {
      name: group.name,
      createdByUserId: group.createdByUserId,
    });
    await eventBus.publish(event);

    return group;
  }

  async findAccessibleGroups(userId: string) {
    const ownedGroups = await this.findAll({ createdByUserId: userId });
    const memberships = await groupMemberService.findAll({ userId });
    const membershipGroupIds = memberships
      .filter((membership: { removedAt?: Date }) => !membership.removedAt)
      .map((membership: { groupId: string }) => membership.groupId);

    const ownedGroupIds = ownedGroups.map((group) => group._id.toString());
    const uniqueGroupIds = [...new Set([...membershipGroupIds, ...ownedGroupIds])];

    if (uniqueGroupIds.length === 0) {
      return [];
    }

    return this.model.find({ _id: { $in: uniqueGroupIds } });
  }
}

export const groupService = new GroupService();
