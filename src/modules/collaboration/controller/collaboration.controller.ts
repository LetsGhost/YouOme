import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { collaborationService } from "../service/collaboration.service";
import { createCollaborationSchema } from "../schema/collaboration.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class CollaborationController extends BaseController {
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
    const dto = createCollaborationSchema.parse(req.body);
    const collab = await collaborationService.createCollaboration(dto.ownerUserId, dto.collaboratorUserId, dto.role);
    res.status(201).json(collab);
  }

  private async getById(req: Request, res: Response) {
    const collab = await collaborationService.findById(req.params.id);
    if (!collab) throw new Error("Collaboration not found");
    res.json(collab);
  }
}

export const collaborationController = new CollaborationController();
