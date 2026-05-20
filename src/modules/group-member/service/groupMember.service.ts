import { BaseService } from "../../common/base/base.service";
import { GroupMemberModel } from "../model/groupMember.model";
import { GroupMemberEntity } from "../entity/groupMember.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupMemberCreatedEvent } from "../events/groupMember-created.event";
import { userService } from "../../user/service/user.service";

export type GroupMemberSummary = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
};

export class GroupMemberService extends BaseService<GroupMemberEntity> {
  constructor() {
    super(GroupMemberModel);
  }

  async addMember(groupId: string, userId: string, role = "member", addedByUserId?: string) {
    const existingMember = await this.model.findOne({ groupId, userId, removedAt: { $exists: false } });

    if (existingMember) {
      return existingMember;
    }

    const member = await this.create({ groupId, userId, role, addedByUserId });

    const event = new GroupMemberCreatedEvent(member._id.toString(), {
      groupId: member.groupId,
      userId: member.userId,
      role: member.role,
    });
    await eventBus.publish(event);

    return member;
  }

  async listMembers(groupId: string): Promise<GroupMemberSummary[]> {
    const members = await this.findAll({ groupId });
    const activeMembers = members.filter((member) => !member.removedAt);

    const summaries: Array<GroupMemberSummary | null> = await Promise.all(
      activeMembers.map(async (member) => {
        const user = await userService.findById(member.userId);

        if (!user) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: member.role,
        } satisfies GroupMemberSummary;
      })
    );

    return summaries.filter((member): member is GroupMemberSummary => member !== null);
  }
}

export const groupMemberService = new GroupMemberService();
