import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupMemberService } from "../service/groupMember.service";
import { createGroupMemberSchema } from "../schema/groupMember.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { GroupAccessRequest, groupAccessMiddleware } from "../../../middleware/group-access.middleware";
import { groupAccessService } from "../../group/service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Group Members
 *   description: Group member management endpoints
 */
class GroupMemberController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/group-members:
     *   post:
     *     summary: Add a member to a group
     *     tags: [Group Members]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateGroupMemberDTO'
     *     responses:
     *       201:
     *         description: Member added
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/group-members/{id}:
     *   get:
     *     summary: Get group member by ID
     *     tags: [Group Members]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group member ID
     *     responses:
     *       200:
     *         description: Group member found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Group member not found
     */
    this.router.get("/:id", authenticate, groupAccessMiddleware as any, this.getById);
  }

  private async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const dto = createGroupMemberSchema.parse(req.body);
      
      // Check access for create (groupId in body, not params)
      try {
        await groupAccessService.assertOwnerOrAdmin(dto.groupId, req.user!.id);
      } catch (error) {
        res.status(403).json({ error: "Not authorized to add members to this group" });
        return;
      }
      
      const member = await groupMemberService.addMember(
        dto.groupId,
        dto.userId,
        dto.role,
        req.user!.id
      );
      res.status(201).json(member);
    } catch (error) {
      throw error;
    }
  }

  private async getById(req: GroupAccessRequest, res: Response): Promise<void> {
    try {
      const member = await groupMemberService.findById(req.params.id);
      if (!member) throw new Error("Member not found");
      
      if (!req.groupAccess?.isOwnerOrAdmin) {
        res.status(403).json({ error: "Not authorized to view this member" });
        return;
      }
      
      res.json(member);
    } catch (error) {
      throw error;
    }
  }
}

export const groupMemberController = new GroupMemberController();
