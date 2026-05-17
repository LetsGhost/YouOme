import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupInviteService } from "../service/groupInvite.service";
import { createGroupInviteSchema } from "../schema/groupInvite.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { GroupAccessRequest, groupAccessMiddleware } from "../../../middleware/group-access.middleware";
import { groupAccessService } from "../../group/service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Group Invites
 *   description: Group invitation endpoints
 */
class GroupInviteController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/group-invites:
     *   post:
     *     summary: Create a group invite
     *     tags: [Group Invites]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateGroupInviteDTO'
     *     responses:
     *       201:
     *         description: Invite created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/group-invites/{id}:
     *   get:
     *     summary: Get group invite by ID
     *     tags: [Group Invites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Invite ID
     *     responses:
     *       200:
     *         description: Invite found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Invite not found
     */
    this.router.get("/:id", authenticate, groupAccessMiddleware as any, this.getById);
  }

  private async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dto = createGroupInviteSchema.parse(req.body);
      
      // Manually check access for create (groupId in body, not params)
      try {
        await groupAccessService.assertOwnerOrAdmin(dto.groupId, req.user!.id);
      } catch (error) {
        res.status(403).json({ error: "Not authorized to invite for this group" });
        return;
      }
      
      const invite = await groupInviteService.createInvite(
        dto.groupId,
        req.user!.id,
        dto.invitedUserId,
        dto.message,
        dto.expiresAt ? new Date(dto.expiresAt) : undefined
      );
      res.status(201).json(invite);
    } catch (error) {
      throw error;
    }
  }

  private async getById(req: GroupAccessRequest, res: Response): Promise<void> {
    try {
      const invite = await groupInviteService.findById(req.params.id);
      if (!invite) throw new Error("Invite not found");
      
      if (!req.groupAccess?.isOwnerOrAdmin) {
        res.status(403).json({ error: "Not authorized to view this invite" });
        return;
      }
      
      res.json(invite);
    } catch (error) {
      throw error;
    }
  }
}

export const groupInviteController = new GroupInviteController();
