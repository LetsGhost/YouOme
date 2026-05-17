import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { collaborationService } from "../service/collaboration.service";
import { createCollaborationByEmailSchema, createCollaborationSchema } from "../schema/collaboration.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";

/**
 * @openapi
 * tags:
 *   name: Collaborations
 *   description: Collaboration management endpoints
 */
class CollaborationController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.createByEmail = this.createByEmail.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/collaborations:
     *   post:
     *     summary: Create a collaboration
     *     tags: [Collaborations]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCollaborationDTO'
     *     responses:
     *       201:
     *         description: Collaboration created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Collaboration'
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/collaborations/by-email:
     *   post:
     *     summary: Create a collaboration by collaborator email
     *     tags: [Collaborations]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCollaborationByEmailDTO'
     *     responses:
     *       201:
     *         description: Collaboration created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/by-email", authenticate, this.createByEmail);

    /**
     * @openapi
     * /api/collaborations/{id}:
     *   get:
     *     summary: Get collaboration by ID
     *     tags: [Collaborations]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration ID
     *     responses:
     *       200:
     *         description: Collaboration found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Collaboration'
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Collaboration not found
     */
    this.router.get("/:id", authenticate, this.getById);
  }

  private async create(req: Request, res: Response) {
    const dto = createCollaborationSchema.parse(req.body);
    const collab = await collaborationService.createCollaboration(dto.ownerUserId, dto.collaboratorUserId, dto.role);
    res.status(201).json(collab);
  }

  private async createByEmail(req: AuthRequest, res: Response) {
    const dto = createCollaborationByEmailSchema.parse(req.body);
    const collab = await collaborationService.createCollaborationByEmail(req.user!.id, dto.collaboratorEmail, dto.role);
    res.status(201).json(collab);
  }

  private async getById(req: Request, res: Response) {
    const collab = await collaborationService.findById(req.params.id);
    if (!collab) throw new Error("Collaboration not found");
    res.json(collab);
  }
}

export const collaborationController = new CollaborationController();
