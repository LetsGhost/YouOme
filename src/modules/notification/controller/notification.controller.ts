import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { notificationService } from "../service/notification.service";
import { createNotificationSchema, broadcastNotificationSchema } from "../schema/notification.schema";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";

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
    this.listForCurrentUser = this.listForCurrentUser.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.clearNotifications = this.clearNotifications.bind(this);
    this.broadcast = this.broadcast.bind(this);
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
     * /api/notifications/broadcast:
     *   post:
     *     summary: Send a notification to every user (sysadmin only)
     *     tags: [Notifications]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/BroadcastNotificationDTO'
     *     responses:
     *       201:
     *         description: Notification fanned out to all users
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Admin access required
     */
    this.router.post("/broadcast", authenticate, authorize("admin"), this.broadcast);

    this.router.get("/", authenticate, this.listForCurrentUser);
    this.router.patch("/read-all", authenticate, this.markAllAsRead);
    this.router.patch("/:id/read", authenticate, this.markAsRead);
    this.router.delete("/", authenticate, this.clearNotifications);
    this.router.delete("/:id", authenticate, this.deleteNotification);

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

  private async broadcast(req: Request, res: Response) {
    const dto = broadcastNotificationSchema.parse(req.body);
    const notes = await notificationService.broadcastToAllUsers(dto.title, dto.message);
    res.status(201).json({ count: notes.length });
  }

  private async getById(req: Request, res: Response) {
    const note = await notificationService.findById(req.params.id);
    if (!note) throw new Error("Notification not found");
    res.json(note);
  }

  private async listForCurrentUser(req: Request, res: Response) {
    const userId = (req as typeof req & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const notes = await notificationService.listForUser(userId);
    res.json(notes);
  }

  private async markAsRead(req: Request, res: Response) {
    const userId = (req as typeof req & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const note = await notificationService.markRead(req.params.id, userId);
    res.json(note);
  }

  private async markAllAsRead(req: Request, res: Response) {
    const userId = (req as typeof req & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const notes = await notificationService.markAllRead(userId);
    res.json(notes);
  }

  private async deleteNotification(req: Request, res: Response) {
    const userId = (req as typeof req & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await notificationService.deleteNotification(req.params.id, userId);
    res.status(204).send();
  }

  private async clearNotifications(req: Request, res: Response) {
    const userId = (req as typeof req & { user?: { id?: string } }).user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await notificationService.clearForUser(userId);
    res.status(204).send();
  }
}

export const notificationController = new NotificationController();
