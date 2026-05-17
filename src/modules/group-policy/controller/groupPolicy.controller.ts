import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupPolicyService } from "../service/groupPolicy.service";
import { createGroupPolicySchema } from "../schema/groupPolicy.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { groupAccessService } from "../../group/service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Group Policies
 *   description: Group policy management endpoints
 */
class GroupPolicyController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/group-policys:
     *   post:
     *     summary: Create or update group policy
     *     tags: [Group Policies]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateGroupPolicyDTO'
     *     responses:
     *       201:
     *         description: Group policy created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/group-policys/{id}:
     *   get:
     *     summary: Get group policy by ID
     *     tags: [Group Policies]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group policy ID
     *     responses:
     *       200:
     *         description: Group policy found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Group policy not found
     */
    this.router.get("/:id", authenticate, this.getById);
  }

  private async create(req: AuthRequest, res: Response) {
    const dto = createGroupPolicySchema.parse(req.body);
    await groupAccessService.assertOwnerOrAdmin(dto.groupId, req.user!.id);
    const policy = await groupPolicyService.createPolicy(dto.groupId, dto as any);
    res.status(201).json(policy);
  }

  private async getById(req: AuthRequest, res: Response) {
    const policy = await groupPolicyService.findById(req.params.id);
    if (!policy) throw new Error("Policy not found");
    await groupAccessService.assertOwnerOrAdmin(policy.groupId, req.user!.id);
    res.json(policy);
  }
}

export const groupPolicyController = new GroupPolicyController();
