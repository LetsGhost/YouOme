import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupPolicyService } from "../service/groupPolicy.service";
import { createGroupPolicySchema } from "../schema/groupPolicy.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class GroupPolicyController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    this.router.post("/", authenticate, this.create);
    this.router.get("/:id", authenticate, this.getById);
  }

  private async create(req: Request, res: Response) {
    const dto = createGroupPolicySchema.parse(req.body);
    const policy = await groupPolicyService.createPolicy(dto.groupId, dto as any);
    res.status(201).json(policy);
  }

  private async getById(req: Request, res: Response) {
    const policy = await groupPolicyService.findById(req.params.id);
    if (!policy) throw new Error("Policy not found");
    res.json(policy);
  }
}

export const groupPolicyController = new GroupPolicyController();
