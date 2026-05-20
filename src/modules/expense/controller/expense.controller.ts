import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { expenseService } from "../service/expense.service";
import { createExpenseSchema } from "../schema/expense.schema";
import { authenticate } from "../../../middleware/auth.middleware";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";
import { eventBus } from "../../common/messaging/event-bus";
import { PaymentSubmittedEvent } from "../../expense-participant/events/payment-submitted.event";
import { PaymentRejectedEvent } from "../../expense-participant/events/payment-rejected.event";
import { PaymentConfirmedEvent } from "../../expense-participant/events/payment-confirmed.event";

/**
 * @openapi
 * tags:
 *   name: Expenses
 *   description: Group expense management endpoints
 */
class ExpenseController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.submitPayment = this.submitPayment.bind(this);
    this.rejectPayment = this.rejectPayment.bind(this);
    this.confirmPayment = this.confirmPayment.bind(this);
    this.confirmReceipt = this.confirmReceipt.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/expenses:
     *   post:
     *     summary: Create an expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateExpenseDTO'
     *     responses:
     *       201:
     *         description: Expense created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/expenses/{id}:
     *   get:
     *     summary: Get expense with participants
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Expense ID
     *     responses:
     *       200:
     *         description: Expense found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Expense not found
     */
    this.router.get("/:id", authenticate, this.getById);

    /**
     * @openapi
     * /api/expenses/{id}/participant/{userId}/submit-payment:
     *   post:
     *     summary: Submit payment for an expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Expense ID
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: Participant user ID
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Payment submitted
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Participant not found
     */
    this.router.post("/:id/participant/:userId/submit-payment", authenticate, this.submitPayment);

    /**
     * @openapi
     * /api/expenses/{id}/participant/{userId}/reject-payment:
     *   post:
     *     summary: Reject participant payment submission
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Expense ID
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: Participant user ID
     *     responses:
     *       200:
     *         description: Payment rejected
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Participant not found
     */
    this.router.post("/:id/participant/:userId/reject-payment", authenticate, this.rejectPayment);

    /**
     * @openapi
     * /api/expenses/{id}/participant/{userId}/confirm-payment:
     *   post:
     *     summary: Confirm participant payment for expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Expense ID
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: Participant user ID
     *     responses:
     *       200:
     *         description: Participant payment confirmed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Participant not found
     */
    this.router.post("/:id/participant/:userId/confirm-payment", authenticate, this.confirmPayment);

    /**
     * @openapi
     * /api/expenses/{id}/confirm-receipt:
     *   post:
     *     summary: Confirm expense receipt and settle expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Expense ID
     *     responses:
     *       200:
     *         description: Expense receipt confirmed
     *       400:
     *         description: Not all participants have confirmed payment
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/:id/confirm-receipt", authenticate, this.confirmReceipt);
  }

  private async create(req: Request, res: Response) {
    const dto = createExpenseSchema.parse(req.body);
    const expense = await expenseService.createExpense(
      dto.groupId,
      dto.createdByUserId,
      dto.totalAmount,
      dto.title,
      {
        paidByUserId: dto.paidByUserId,
        splitType: dto.splitType,
        note: dto.note,
        participants: dto.participants,
      }
    );

    res.status(201).json(expense);
  }

  private async getById(req: Request, res: Response) {
    const expense = await expenseService.findById(req.params.id);
    if (!expense) throw new Error("Expense not found");
    const participants = await expenseParticipantService.getByExpense(req.params.id);
    res.json({ expense, participants });
  }

  private async submitPayment(req: Request, res: Response) {
    const { id, userId } = req.params;
    const { comment } = req.body;
    const participant = await expenseParticipantService.submitPayment(id, userId, comment);
    if (!participant) throw new Error("Participant not found");

    const submissionCount = await expenseParticipantService.getSubmissionCount(id, userId);
    const event = new PaymentSubmittedEvent(id, {
      expenseId: id,
      userId,
      comment,
      submissionCount,
    });
    await eventBus.publish(event);

    res.json(participant);
  }

  private async rejectPayment(req: Request, res: Response) {
    const { id, userId } = req.params;
    const participant = await expenseParticipantService.rejectPayment(id, userId);
    if (!participant) throw new Error("Participant not found");

    const submissionCount = await expenseParticipantService.getSubmissionCount(id, userId);
    const event = new PaymentRejectedEvent(id, {
      expenseId: id,
      userId,
      submissionCount,
    });
    await eventBus.publish(event);

    res.json(participant);
  }

  private async confirmPayment(req: Request, res: Response) {
    const { id, userId } = req.params;
    const participant = await expenseParticipantService.confirmPayment(id, userId);
    if (!participant) throw new Error("Participant not found");

    const event = new PaymentConfirmedEvent(id, {
      expenseId: id,
      userId,
      shareAmount: participant.shareAmount,
    });
    await eventBus.publish(event);

    res.json(participant);
  }

  private async confirmReceipt(req: Request, res: Response) {
    const { id } = req.params;
    // check all participants confirmed
    const allConfirmed = await expenseParticipantService.allConfirmed(id);
    if (!allConfirmed) throw new Error("Not all participants have confirmed payment");

    const updated = await expenseService.updateById(id, { status: "settled", settledAt: new Date() });
    res.json(updated);
  }
}

export const expenseController = new ExpenseController();
