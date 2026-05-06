import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { groupMemberService } from "../service/groupMember.service";
import { createGroupMemberSchema } from "../schema/groupMember.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class GroupMemberController extends BaseController {
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
    const dto = createGroupMemberSchema.parse(req.body);
    const member = await groupMemberService.addMember(dto.groupId, dto.userId, dto.role, dto.addedByUserId);
    res.status(201).json(member);
  }

  private async getById(req: Request, res: Response) {
    const member = await groupMemberService.findById(req.params.id);
    if (!member) throw new Error("Member not found");
    res.json(member);
  }
}

export const groupMemberController = new GroupMemberController();
