import { ObjectId } from "mongoose";

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
    let friendList = await this.findOne({ userId: userId as unknown as ObjectId });

    if (!friendList) {
      friendList = await this.create({
        userId: userId as unknown as ObjectId,
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

    const friendList = await this.getOrCreateFriendList(userId);

    // Check if friend already exists
    const friendExists = friendList.friendUserIds?.some(
      (entry) => entry.friendUserId?.toString() === friendUserId
    );

    if (friendExists) {
      throw new Error("Friend already in your friend list");
    }

    // Add friend entry
    const newEntry: Partial<FriendListEntryEntity> = {
      friendUserId: friendUserId as unknown as ObjectId,
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

    logger.info("Friend added", { userId, friendUserId });

    // Ensure reciprocal friend entry exists for the other user as well.
    // Do not fail the primary operation if this secondary update has issues.
    (async () => {
      try {
        const otherList = await this.getOrCreateFriendList(friendUserId);

        const otherExists = otherList.friendUserIds?.some(
          (entry) => entry.friendUserId?.toString() === userId
        );

        if (!otherExists) {
          const reverseEntry: Partial<FriendListEntryEntity> = {
            friendUserId: userId as unknown as ObjectId,
            blocked: false,
          };

          await this.model.findByIdAndUpdate(
            (otherList as any)._id,
            { $push: { friendUserIds: reverseEntry } },
            { new: true }
          );

          logger.info("Reciprocal friend added", { userId: friendUserId, friendUserId: userId });
        }
      } catch (err) {
        logger.error("Failed to add reciprocal friend", {
          error: err instanceof Error ? err.stack ?? err.message : String(err),
          userId,
          friendUserId,
        });
      }
    })();

    return updated;
  }

  /**
   * Remove a friend from the friend list
   */
  async removeFriend(userId: string, friendUserId: string): Promise<FriendListEntity> {
    const friendList = await this.getOrCreateFriendList(userId);

    const updated = await this.model.findByIdAndUpdate(
      (friendList as any)._id,
      { $pull: { friendUserIds: { friendUserId: friendUserId as unknown as ObjectId } } },
      { new: true }
    );

    if (!updated) {
      throw new Error("Failed to remove friend");
    }

    logger.info("Friend removed", { userId, friendUserId });
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
        arrayFilters: [{ "elem.friendUserId": friendUserId as unknown as ObjectId }],
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
  async getFriends(userId: string, excludeBlocked: boolean = true): Promise<ObjectId[]> {
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
        !entry.blocked && entry.friendUserId?.toString() === otherUserId
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
      (e) => e.friendUserId?.toString() === otherUserId
    );

    return entry?.blocked ?? false;
  }
}

export const friendListService = new FriendListService();
