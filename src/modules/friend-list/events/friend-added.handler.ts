import { logger } from "../../common/logger/logger";
import { EventHandler } from "../../common/messaging";
import { FriendAddedEvent } from "../../friend-invite/events/friend-added.event";
import { friendListService } from "../service/friend-list.service";

export class FriendAddedHandler extends EventHandler<FriendAddedEvent>{
  getEventType(): string {
    return "friend.added";
  }

  async handle(event: FriendAddedEvent): Promise<void> {
    const { userId, friendUserId } = event.payload;

    await Promise.allSettled([
      friendListService.addFriend(userId, friendUserId),
      friendListService.addFriend(friendUserId, userId),
    ]);

    logger.info(`Friend added event handled`, {
      userId,
      friendUserId,
    });
  }
}

export const friendAddedHandler = new FriendAddedHandler();