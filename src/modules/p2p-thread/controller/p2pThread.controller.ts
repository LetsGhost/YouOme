import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { p2pThreadService } from "../service/p2pThread.service";
import { createP2PThreadSchema } from "../schema/p2pThread.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class P2PThreadController extends BaseController {
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
    const dto = createP2PThreadSchema.parse(req.body);
    const thread = await p2pThreadService.createThread(dto.userAId, dto.userBId, dto.baseCurrency);
    res.status(201).json(thread);
  }

  private async getById(req: Request, res: Response) {
    const thread = await p2pThreadService.findById(req.params.id);
    if (!thread) throw new Error("Thread not found");
    res.json(thread);
  }
}

export const p2pThreadController = new P2PThreadController();
