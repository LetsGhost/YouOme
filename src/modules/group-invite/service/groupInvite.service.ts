import { BaseService } from "../../common/base/base.service";
import { GroupInviteModel } from "../model/groupInvite.model";
import { GroupInviteEntity } from "../entity/groupInvite.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupInviteCreatedEvent } from "../events/groupInvite-created.event";
import { GroupInviteAcceptedEvent } from "../events/groupInvite-accepted.event";

export class GroupInviteService extends BaseService<GroupInviteEntity> {
  constructor() {
    super(GroupInviteModel);
  }

  async createInvite(groupId: string, invitedByUserId: string, invitedUserId?: string, message?: string, expiresAt?: Date) {
    const invite = await this.create({ groupId, invitedByUserId, invitedUserId, message, expiresAt });

    const event = new GroupInviteCreatedEvent(invite._id.toString(), {
      groupId: invite.groupId,
      invitedUserId: invite.invitedUserId,
      invitedByUserId: invite.invitedByUserId,
    });
    await eventBus.publish(event);

    return invite;
  }

  async respondToInvite(inviteId: string, userId: string, accept: boolean) {
    const invite = await this.model.findById(inviteId);

    if (!invite) {
      throw new Error("Group invite not found");
    }

    if (invite.invitedUserId !== userId) {
      throw new Error("Not authorized to respond to this invite");
    }

    if (invite.status !== "pending") {
      throw new Error("Group invite already handled");
    }

    invite.status = accept ? "accepted" : "rejected";
    invite.actedAt = new Date();
    await invite.save();

    if (accept) {
      const event = new GroupInviteAcceptedEvent(invite._id.toString(), {
        groupId: invite.groupId,
        invitedUserId: invite.invitedUserId!,
        invitedByUserId: invite.invitedByUserId,
      });
      await eventBus.publish(event);
    }

    return invite;
  }
}

export const groupInviteService = new GroupInviteService();
