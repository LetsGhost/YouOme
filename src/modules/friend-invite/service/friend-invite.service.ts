import { BaseService } from "../../common/base/base.service";
import { eventBus } from "../../common/messaging";
import { FriendInviteEntity } from "../entity/friend-invite.entity";
import { FriendAddedEvent } from "../events/friend-added.event";
import { FriendInviteModel } from "../model/friend-invite.model";
import { userService } from "../../user/service/user.service";
import { notificationService } from "../../notification/service/notification.service";

export class FriendService extends BaseService<FriendInviteEntity> {
    constructor() {
        super(FriendInviteModel);
    } 

    async sendInvite(fromUserId: string, toUserEmail: string) {
        const toUser = await userService.findByEmail(toUserEmail.trim());

        if (!toUser) {
            throw new Error("No user found with that email");
        }

        if (fromUserId === toUser._id.toString()) {
            throw new Error("Cannot send friend invite to yourself");
        }

        const existingInvite = await this.model.findOne({
            $or: [
                { fromUserId, toUserId: toUser._id.toString() },
                { fromUserId: toUser._id.toString(), toUserId: fromUserId }
            ]
        });

        if (existingInvite) {
            if (existingInvite.status === "pending") {
                throw new Error("Friend invite already pending");
            }
            if (existingInvite.status === "accepted") {
                throw new Error("You are already friends");
            }
        }

        const invite = await this.create({ fromUserId, toUserId: toUser._id.toString() });
        const sender = await userService.findById(fromUserId);

        await notificationService.createNotification(toUser._id.toString(), "friend.request", {
            inviteId: invite._id.toString(),
            fromUserId,
            fromUserEmail: sender?.email ?? "",
            fromUserName: sender?.name ?? sender?.email ?? "Someone",
        });

        return invite;
    }

    async respondToInvite(inviteId: string, userId: string, accept: boolean) {
        const invite = await this.model.findById(inviteId);

        if (!invite) {
            throw new Error("Friend invite not found");
        }

        if (invite.toUserId !== userId) {
            throw new Error("Not authorized to respond to this invite");
        }

        invite.status = accept ? "accepted" : "rejected";
        await invite.save();

        if (accept) {
            const event = new FriendAddedEvent(invite.fromUserId, {
                userId: invite.fromUserId,
                friendUserId: invite.toUserId,
            });
            await eventBus.publish(event);
        }

        return invite;
      }
}

export const friendInviteService = new FriendService();
