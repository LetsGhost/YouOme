import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { p2pExpenseService } from "../service/p2pExpense.service";
import { createP2PExpenseSchema } from "../schema/p2pExpense.schema";
import { authenticate } from "../../../middleware/auth.middleware";

/**
 * @openapi
 * tags:
 *   name: P2P Expenses
 *   description: Peer-to-peer expense endpoints
 */
class P2PExpenseController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/p2p-expenses:
     *   post:
     *     summary: Create a P2P expense
     *     tags: [P2P Expenses]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateP2PExpenseDTO'
     *     responses:
     *       201:
     *         description: P2P expense created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/p2p-expenses/{id}:
     *   get:
     *     summary: Get P2P expense by ID
     *     tags: [P2P Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: P2P expense ID
     *     responses:
     *       200:
     *         description: P2P expense found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Expense not found
     */
    this.router.get("/:id", authenticate, this.getById);
  }

  private async create(req: Request, res: Response) {
    const dto = createP2PExpenseSchema.parse(req.body);
    const expense = await p2pExpenseService.createExpense(dto.threadId, dto.createdByUserId, dto.totalAmount, dto.title, { paidByUserId: dto.paidByUserId, splitType: dto.splitType });
    res.status(201).json(expense);
  }

  private async getById(req: Request, res: Response) {
    const expense = await p2pExpenseService.findById(req.params.id);
    if (!expense) throw new Error("Expense not found");
    res.json(expense);
  }
}

export const p2pExpenseController = new P2PExpenseController();
