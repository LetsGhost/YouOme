import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { groupService } from "../service/group.service";
import { createGroupSchema } from "../schema/group.schema";
import mongoose from "mongoose";
import { groupAccessService } from "../service/group-access.service";
import { expenseService } from "../../expense/service/expense.service";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";

/**
 * @openapi
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */
class GroupController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.getDebtBoard = this.getDebtBoard.bind(this);
    this.list = this.list.bind(this);
  }

  private serializeGroup(group: any) {
    const plainGroup = typeof group?.toObject === "function" ? group.toObject() : { ...group };
    return {
      ...plainGroup,
      id: plainGroup._id?.toString?.() ?? plainGroup.id,
    };
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/groups:
     *   post:
     *     summary: Create a group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateGroupDTO'
     *     responses:
     *       201:
     *         description: Group created
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/", authenticate, this.create);

    /**
     * @openapi
     * /api/groups:
     *   get:
     *     summary: List accessible groups
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of groups
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/", authenticate, this.list);

    /**
     * @openapi
     * /api/groups/{id}:
     *   get:
     *     summary: Get group by ID
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group ID
     *     responses:
     *       200:
     *         description: Group found
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Group not found
     */
    this.router.get("/:id", authenticate, this.getById);

    /**
     * @openapi
     * /api/groups/{id}/debts:
     *   get:
     *     summary: Get unsettled expense debts for a group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Group ID
     *     responses:
     *       200:
     *         description: Group debt board
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    this.router.get("/:id/debts", authenticate, this.getDebtBoard);
  }

  private async create(req: AuthRequest, res: Response) {
    const dto = createGroupSchema.parse(req.body);
    const group = await groupService.createGroup(dto.name, req.user!.id, dto.baseCurrency);
    res.status(201).json(this.serializeGroup(group));
  }

  private async list(req: AuthRequest, res: Response) {
    const groups = await groupService.findAccessibleGroups(req.user!.id);
    res.json(groups.map((group) => this.serializeGroup(group)));
  }

  private async getById(req: AuthRequest, res: Response) {
    const groupId = req.params.id;

    if (!groupId || groupId === "undefined" || !mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID format");
    }

    await groupAccessService.assertMember(groupId, req.user!.id);
    const [group, expenses] = await Promise.all([
      groupService.findById(req.params.id),
      expenseService.findAll({ groupId }),
    ]);

    if (!group) {
      throw new Error("Group not found");
    }

    const expenseSnapshots = await Promise.all(
      expenses.map(async (expense) => {
        const participants = await expenseParticipantService.getByExpense(expense._id.toString());

        return {
          id: expense._id.toString(),
          groupId: expense.groupId,
          title: expense.title,
          description: expense.note || expense.title,
          amount: expense.totalAmount,
          totalAmount: expense.totalAmount,
          paidBy: expense.paidByUserId || expense.createdByUserId,
          status: expense.status,
          splitType: expense.splitType,
          participants: participants.map((participant) => participant.userId),
          createdAt: expense.createdAt?.toISOString?.() ?? expense.createdAt,
          date: expense.expenseDate?.toISOString?.() ?? expense.createdAt?.toISOString?.() ?? new Date().toISOString(),
        };
      })
    );

    res.json(
      this.serializeGroup({
        ...group.toObject(),
        expenses: expenseSnapshots,
      })
    );
  }

  private async getDebtBoard(req: AuthRequest, res: Response) {
    const groupId = req.params.id;

    if (!groupId || groupId === "undefined" || !mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID format");
    }

    await groupAccessService.assertMember(groupId, req.user!.id);
    const board = await groupService.findDebtBoard(groupId, req.user!.id);
    res.json(board);
  }
}

export const groupController = new GroupController();