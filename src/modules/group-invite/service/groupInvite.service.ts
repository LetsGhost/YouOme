import { BaseService } from "../../common/base/base.service";
import { GroupInviteModel } from "../model/groupInvite.model";
import { GroupInviteEntity } from "../entity/groupInvite.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupInviteCreatedEvent } from "../events/groupInvite-created.event";

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
}

export const groupInviteService = new GroupInviteService();
