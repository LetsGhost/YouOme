import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupInviteService } from "../service/groupInvite.service";
import { createGroupInviteSchema } from "../schema/groupInvite.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class GroupInviteController extends BaseController {
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
    const dto = createGroupInviteSchema.parse(req.body);
    const invite = await groupInviteService.createInvite(dto.groupId, dto.invitedByUserId, dto.invitedUserId, dto.message, dto.expiresAt ? new Date(dto.expiresAt) : undefined);
    res.status(201).json(invite);
  }

  private async getById(req: Request, res: Response) {
    const invite = await groupInviteService.findById(req.params.id);
    if (!invite) throw new Error("Invite not found");
    res.json(invite);
  }
}

export const groupInviteController = new GroupInviteController();
