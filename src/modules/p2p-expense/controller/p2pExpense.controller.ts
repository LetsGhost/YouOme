import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { p2pExpenseService } from "../service/p2pExpense.service";
import { createP2PExpenseSchema } from "../schema/p2pExpense.schema";
import { authenticate } from "../../../middleware/auth.middleware";

class P2PExpenseController extends BaseController {
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
