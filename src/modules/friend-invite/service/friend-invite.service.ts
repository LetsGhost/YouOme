import { BaseService } from "../../common/base/base.service";
import { eventBus } from "../../common/messaging";
import { FriendInviteEntity } from "../entity/friend-invite.entity";
import { FriendAddedEvent } from "../events/friend-added.event";
import { FriendInviteModel } from "../model/friend-invite.model";

export class FriendService extends BaseService<FriendInviteEntity> {
    constructor() {
        super(FriendInviteModel);
    } 

    async sendInvite(fromUserId: string, toUserId: string) {
        if (fromUserId === toUserId) {
            throw new Error("Cannot send friend invite to yourself");
        }

        const existingInvite = await this.model.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
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

        return this.create({ fromUserId, toUserId });
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

        // Publishes the event for the Friends list so the user can be added to the friend list if accepted
        const event = new FriendAddedEvent(userId, { 
            userId: invite.fromUserId, 
            friendUserId: invite.toUserId 
        });
        await eventBus.publish(event);

        return invite.save();
      }
}

export const friendInviteService = new FriendService();
