import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { groupService } from "../service/group.service";
import { createGroupSchema } from "../schema/group.schema";
import { groupAccessService } from "../service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */
class GroupController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/groups:
     *   post:
     *     summary: Create a group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateGroupDTO'
     *     responses:
     *       201:
     *         description: Group created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/groups:
     *   get:
     *     summary: List accessible groups
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of groups
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/", authenticate, this.list);

    /**
     * @openapi
     * /api/groups/{id}:
     *   get:
     *     summary: Get group by ID
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group ID
     *     responses:
     *       200:
     *         description: Group found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Group not found
     */
    this.router.get("/:id", authenticate, this.getById);
  }

  private async create(req: AuthRequest, res: Response) {
    const dto = createGroupSchema.parse(req.body);
    const group = await groupService.createGroup(dto.name, req.user!.id, dto.baseCurrency);
    res.status(201).json(group);
  }

  private async list(req: AuthRequest, res: Response) {
    const groups = await groupService.findAccessibleGroups(req.user!.id);
    res.json(groups);
  }

  private async getById(req: AuthRequest, res: Response) {
    await groupAccessService.assertMember(req.params.id, req.user!.id);
    const group = await groupService.findById(req.params.id);
    if (!group) {
      throw new Error("Group not found");
    }

    res.json(group);
  }
}

export const groupController = new GroupController();