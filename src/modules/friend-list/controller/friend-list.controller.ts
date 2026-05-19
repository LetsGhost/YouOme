import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { AuthRequest, authenticate } from "../../../middleware/auth.middleware";
import { friendListService } from "../service/friend-list.service";
import { addFriendSchema, blockFriendSchema } from "../schema/friend-list.schema";

/**
 * @openapi
 * tags:
 *   name: Friend Lists
 *   description: Friend list management endpoints
 */
class FriendListController extends BaseController {
  constructor() {
    super();
    this.getFriendList = this.getFriendList.bind(this);
    this.addFriend = this.addFriend.bind(this);
    this.removeFriend = this.removeFriend.bind(this);
    this.blockFriend = this.blockFriend.bind(this);
    this.checkFriendsStatus = this.checkFriendsStatus.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/friend-list:
     *   get:
     *     summary: Get your friend list
     *     tags: [Friend Lists]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Friend list retrieved
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FriendList'
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/", authenticate, this.getFriendList);
    this.router.get("/summary", authenticate, this.getFriendSummaries);

    /**
     * @openapi
     * /api/friend-list/add:
     *   post:
     *     summary: Add a friend to your friend list
     *     tags: [Friend Lists]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AddFriendDTO'
     *     responses:
     *       200:
     *         description: Friend added
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FriendList'
     *       401:
     *         description: Unauthorized
     *       400:
     *         description: Bad request
     */
    this.router.post("/add", authenticate, this.addFriend);

    /**
     * @openapi
     * /api/friend-list/{friendUserId}:
     *   delete:
     *     summary: Remove a friend from your friend list
     *     tags: [Friend Lists]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: friendUserId
     *         required: true
     *         schema:
     *           type: string
     *         description: Friend user ID
     *     responses:
     *       200:
     *         description: Friend removed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Friend not found
     */
    this.router.delete("/:friendUserId", authenticate, this.removeFriend);

    /**
     * @openapi
     * /api/friend-list/block:
     *   patch:
     *     summary: Block or unblock a friend
     *     tags: [Friend Lists]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/BlockFriendDTO'
     *     responses:
     *       200:
     *         description: Block status updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FriendList'
     *       401:
     *         description: Unauthorized
     *       400:
     *         description: Bad request
     */
    this.router.patch("/block", authenticate, this.blockFriend);

    /**
     * @openapi
     * /api/friend-list/status/{otherUserId}:
     *   get:
     *     summary: Check friendship status with another user
     *     tags: [Friend Lists]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: otherUserId
     *         required: true
     *         schema:
     *           type: string
     *         description: Other user ID
     *     responses:
     *       200:
     *         description: Friendship status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 isFriend:
     *                   type: boolean
     *                 isBlocked:
     *                   type: boolean
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/status/:otherUserId", authenticate, this.checkFriendsStatus);
  }

  private async getFriendList(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const friendList = await friendListService.getOrCreateFriendList(userId);
    res.json(friendList);
  }

  private async getFriendSummaries(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const friends = await friendListService.getFriendSummaries(userId);
    res.json(friends);
  }

  private async addFriend(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dto = addFriendSchema.parse(req.body);
    const friendList = await friendListService.addFriend(userId, dto.friendUserId);
    res.status(201).json(friendList);
  }

  private async removeFriend(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { friendUserId } = req.params;
    const friendList = await friendListService.removeFriend(userId, friendUserId);
    res.json(friendList);
  }

  private async blockFriend(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const dto = blockFriendSchema.parse(req.body);
    const friendList = await friendListService.setBlockStatus(
      userId,
      dto.friendUserId,
      dto.blocked
    );
    res.json(friendList);
  }

  private async checkFriendsStatus(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { otherUserId } = req.params;

    const [isFriend, isBlocked] = await Promise.all([
      friendListService.areFriends(userId, otherUserId),
      friendListService.isBlocked(userId, otherUserId),
    ]);

    res.json({ isFriend, isBlocked });
  }
}

export const friendListController = new FriendListController();
