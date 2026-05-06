import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { notificationService } from "../service/notification.service";
import { createNotificationSchema } from "../schema/notification.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class NotificationController extends BaseController {
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
    const dto = createNotificationSchema.parse(req.body);
    const note = await notificationService.createNotification(dto.userId, dto.type, dto.payload);
    res.status(201).json(note);
  }

  private async getById(req: Request, res: Response) {
    const note = await notificationService.findById(req.params.id);
    if (!note) throw new Error("Notification not found");
    res.json(note);
  }
}

export const notificationController = new NotificationController();
