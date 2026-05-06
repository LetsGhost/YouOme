import { BaseService } from "../../common/base/base.service";
import { GroupMemberModel } from "../model/groupMember.model";
import { GroupMemberEntity } from "../entity/groupMember.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupMemberCreatedEvent } from "../events/groupMember-created.event";

export class GroupMemberService extends BaseService<GroupMemberEntity> {
  constructor() {
    super(GroupMemberModel);
  }

  async addMember(groupId: string, userId: string, role = "member", addedByUserId?: string) {
    const member = await this.create({ groupId, userId, role, addedByUserId });

    const event = new GroupMemberCreatedEvent(member._id.toString(), {
      groupId: member.groupId,
      userId: member.userId,
      role: member.role,
    });
    await eventBus.publish(event);

    return member;
  }
}

export const groupMemberService = new GroupMemberService();
