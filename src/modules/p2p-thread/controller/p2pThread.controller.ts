import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { p2pThreadService } from "../service/p2pThread.service";
import { createP2PThreadSchema } from "../schema/p2pThread.schema";
import { authenticate } from "../../../middleware/auth.middleware";

/**
 * @openapi
 * tags:
 *   name: P2P Threads
 *   description: Peer-to-peer thread endpoints
 */
class P2PThreadController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/p2p-threads:
     *   post:
     *     summary: Create a P2P thread
     *     tags: [P2P Threads]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateP2PThreadDTO'
     *     responses:
     *       201:
     *         description: P2P thread created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/p2p-threads/{id}:
     *   get:
     *     summary: Get P2P thread by ID
     *     tags: [P2P Threads]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: P2P thread ID
     *     responses:
     *       200:
     *         description: P2P thread found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Thread not found
     */
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
