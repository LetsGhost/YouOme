import { Response } from "express";
import { HydratedDocument } from "mongoose";

import { BaseController } from "../../common/base/base.controller";
import { userService } from "../service/user.service";
import { createUserSchema } from "../schema/user.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { avatarUpload } from "../../../middleware/upload.middleware";
import { storageService } from "../../common/storage/storage.service";
import { UserEntity } from "../entity/user.entity";

type AvatarUploadRequest = AuthRequest & { file?: Express.Multer.File };

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
class UserController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.uploadAvatar = this.uploadAvatar.bind(this);
    this.deleteAvatar = this.deleteAvatar.bind(this);
    this.getAvatar = this.getAvatar.bind(this);
  }

  private serializeUser(user: HydratedDocument<UserEntity>) {
    const plainUser = user.toObject();
    const id = plainUser._id.toString();
    const { password, avatarKey, ...rest } = plainUser;
    void password;

    return {
      ...rest,
      id,
      avatarUrl: avatarKey ? `/api/users/${id}/avatar` : null,
    };
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDTO'
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Bad request
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Admin access required
     */
    this.router.post(
      "/",
      authenticate,
      authorize("admin"),
      this.create
    );

    /**
     * @openapi
     * /api/users/{id}:
     *   get:
     *     summary: Get user by ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     responses:
     *       200:
     *         description: User found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      "/:id",
      authenticate,
      this.getById
    );

    /**
     * @openapi
     * /api/users/me/avatar:
     *   post:
     *     summary: Upload/replace the current user's avatar
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               avatar:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Avatar uploaded
     *       400:
     *         description: Bad request (missing/invalid file)
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/me/avatar", authenticate, avatarUpload, this.wrap(this.uploadAvatar));

    /**
     * @openapi
     * /api/users/me/avatar:
     *   delete:
     *     summary: Remove the current user's avatar
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Avatar removed
     *       401:
     *         description: Unauthorized
     */
    this.router.delete("/me/avatar", authenticate, this.wrap(this.deleteAvatar));

    /**
     * @openapi
     * /api/users/{id}/avatar:
     *   get:
     *     summary: Stream a user's avatar image
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Avatar image bytes
     *       404:
     *         description: No avatar set
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/:id/avatar", authenticate, this.wrap(this.getAvatar));
  }

  private async create(req: AuthRequest, res: Response) {
    const dto = createUserSchema.parse(req.body);
    const user = await userService.createUser(dto.email, dto.password);

    res.status(201).json(this.serializeUser(user));
  }

  private async getById(req: AuthRequest, res: Response) {
    const user = await userService.findById(req.params.id);
    if (!user) throw new Error("User not found");

    res.json(this.serializeUser(user));
  }

  private async uploadAvatar(req: AvatarUploadRequest, res: Response) {
    if (!req.file) {
      throw new Error("No image file provided");
    }

    const user = await userService.setAvatar(req.user!.id, req.file.buffer);
    if (!user) throw new Error("User not found");

    res.json(this.serializeUser(user));
  }

  private async deleteAvatar(req: AuthRequest, res: Response) {
    const user = await userService.removeAvatar(req.user!.id);
    if (!user) throw new Error("User not found");

    res.json(this.serializeUser(user));
  }

  private async getAvatar(req: AuthRequest, res: Response) {
    const user = await userService.findById(req.params.id);
    if (!user?.avatarKey) {
      throw new Error("Avatar not found");
    }

    const object = await storageService.getObject(user.avatarKey);
    res.setHeader("Content-Type", object.contentType || "image/webp");
    res.setHeader("Cache-Control", "private, max-age=86400");
    object.body.on("error", () => res.destroy()).pipe(res);
  }
}

export const userController = new UserController();
