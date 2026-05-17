import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { notificationService } from "../service/notification.service";
import { createNotificationSchema } from "../schema/notification.schema";
import { authenticate } from "../../../middleware/auth.middleware";

/**
 * @openapi
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */
class NotificationController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/notifications:
     *   post:
     *     summary: Create a notification
     *     tags: [Notifications]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateNotificationDTO'
     *     responses:
     *       201:
     *         description: Notification created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/notifications/{id}:
     *   get:
     *     summary: Get notification by ID
     *     tags: [Notifications]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Notification ID
     *     responses:
     *       200:
     *         description: Notification found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Notification not found
     */
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
