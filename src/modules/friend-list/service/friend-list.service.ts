import { BaseService } from "../../common/base/base.service";
import { FriendListEntity, FriendListEntryEntity } from "../entity/friend-list.entity";
import { FriendListModel } from "../model/friend-list.model";
import { logger } from "../../common/logger/logger";
import { userService } from "../../user/service/user.service";

export class FriendListService extends BaseService<FriendListEntity> {
  constructor() {
    super(FriendListModel);
  }

  /**
   * Get or create a friend list for a user
   */
  async getOrCreateFriendList(userId: string): Promise<FriendListEntity> {
    let friendList = await this.findOne({ userId });

    if (!friendList) {
      friendList = await this.create({
        userId,
        friendUserIds: [],
      });
    }

    return friendList;
  }

  async getFriendSummaries(userId: string) {
    const friendList = await this.getOrCreateFriendList(userId);
    const entries = friendList.friendUserIds ?? [];

    const friends = await Promise.all(
      entries.map(async (entry) => {
        const friendUserId = entry.friendUserId?.toString();

        if (!friendUserId) {
          return null;
        }

        const friendUser = await userService.findById(friendUserId);

        if (!friendUser) {
          return null;
        }

        return {
          id: friendUser._id.toString(),
          name: friendUser.name,
          email: friendUser.email,
          blocked: entry.blocked,
          avatarUrl: friendUser.avatarKey ? `/api/users/${friendUser._id.toString()}/avatar` : null,
        };
      })
    );

    return friends.filter((friend): friend is NonNullable<typeof friend> => friend !== null);
  }

  /**
   * Add a friend to the friend list
   */
  async addFriend(userId: string, friendUserId: string): Promise<FriendListEntity> {
    if (userId === friendUserId) {
      throw new Error("Cannot add yourself as a friend");
    }

    const updated = await this.addFriendEntry(userId, friendUserId);
    await this.addFriendEntry(friendUserId, userId);

    logger.info("Friend added", { userId, friendUserId });

    return updated;
  }

  private async addFriendEntry(userId: string, friendUserId: string): Promise<FriendListEntity> {
    const friendList = await this.getOrCreateFriendList(userId);

    const friendExists = friendList.friendUserIds?.some(
      (entry) => entry.friendUserId === friendUserId
    );

    if (friendExists) {
      return friendList;
    }

    const newEntry: Partial<FriendListEntryEntity> = {
      friendUserId,
      blocked: false,
    };

    const updated = await this.model.findByIdAndUpdate(
      (friendList as any)._id,
      { $push: { friendUserIds: newEntry } },
      { new: true }
    );

    if (!updated) {
      throw new Error("Failed to add friend");
    }

    return updated;
  }

  /**
   * Remove a friend from the friend list
   */
  async removeFriend(userId: string, friendUserId: string): Promise<FriendListEntity> {
    const updated = await this.removeFriendEntry(userId, friendUserId);
    await this.removeFriendEntry(friendUserId, userId);

    logger.info("Friend removed", { userId, friendUserId });
    return updated;
  }

  private async removeFriendEntry(userId: string, friendUserId: string): Promise<FriendListEntity> {
    const friendList = await this.getOrCreateFriendList(userId);

    const updated = await this.model.findByIdAndUpdate(
      (friendList as any)._id,
      { $pull: { friendUserIds: { friendUserId } } },
      { new: true }
    );

    if (!updated) {
      throw new Error("Failed to remove friend");
    }

    return updated;
  }

  /**
   * Block or unblock a friend
   */
  async setBlockStatus(
    userId: string,
    friendUserId: string,
    blocked: boolean
  ): Promise<FriendListEntity> {
    const friendList = await this.getOrCreateFriendList(userId);

    const updated = await this.model.findByIdAndUpdate(
      (friendList as any)._id,
      { $set: { "friendUserIds.$[elem].blocked": blocked } },
      {
        arrayFilters: [{ "elem.friendUserId": friendUserId }],
        new: true,
      }
    );

    if (!updated) {
      throw new Error("Failed to update block status");
    }

    logger.info("Friend block status updated", { userId, friendUserId, blocked });
    return updated;
  }

  /**
   * Get all friends for a user (excluding blocked)
   */
  async getFriends(userId: string, excludeBlocked: boolean = true): Promise<string[]> {
    const friendList = await this.getOrCreateFriendList(userId);

    if (!friendList.friendUserIds) {
      return [];
    }

    const friends = friendList.friendUserIds
      .filter((entry) => !excludeBlocked || !entry.blocked)
      .map((entry) => entry.friendUserId);

    return friends;
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendList = await this.getOrCreateFriendList(userId);

    if (!friendList.friendUserIds) {
      return false;
    }

    return friendList.friendUserIds.some(
      (entry) =>
        !entry.blocked && entry.friendUserId === otherUserId
    );
  }

  /**
   * Check if a user is blocked
   */
  async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const friendList = await this.getOrCreateFriendList(userId);

    if (!friendList.friendUserIds) {
      return false;
    }

    const entry = friendList.friendUserIds.find(
      (e) => e.friendUserId === otherUserId
    );

    return entry?.blocked ?? false;
  }
}

export const friendListService = new FriendListService();
