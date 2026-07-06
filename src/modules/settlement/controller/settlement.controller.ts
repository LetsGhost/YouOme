import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { settlementService } from "../service/settlement.service";
import { settlementRunService } from "../service/settlementRun.service";
import { settlementGenerationService } from "../service/settlementGeneration.service";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { groupAccessService } from "../../group/service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Settlements
 *   description: Scheduled/manual settlement endpoints
 */
class SettlementController extends BaseController {
  constructor() {
    super();
    this.getForGroup = this.getForGroup.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getRunDetail = this.getRunDetail.bind(this);
    this.markPaid = this.markPaid.bind(this);
    this.approve = this.approve.bind(this);
    this.markAllPaid = this.markAllPaid.bind(this);
    this.approveAll = this.approveAll.bind(this);
    this.triggerManual = this.triggerManual.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/settlements/group/{groupId}:
     *   get:
     *     summary: Get the current user's outgoing/incoming settlements for a group
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Outgoing/incoming settlements
     */
    this.router.get("/group/:groupId", authenticate, this.wrap(this.getForGroup));

    /**
     * @openapi
     * /api/settlements/group/{groupId}/history:
     *   get:
     *     summary: List settlement runs for a group
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Settlement run history
     */
    this.router.get("/group/:groupId/history", authenticate, this.wrap(this.getHistory));

    /**
     * @openapi
     * /api/settlements/group/{groupId}/history/{runId}:
     *   get:
     *     summary: Get a settlement run and its settlements
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: runId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Settlement run detail
     */
    this.router.get("/group/:groupId/history/:runId", authenticate, this.wrap(this.getRunDetail));

    /**
     * @openapi
     * /api/settlements/group/{groupId}/trigger:
     *   post:
     *     summary: Manually trigger a settlement run for a group (owner/admin/moderator only)
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Settlement run created (or null if nothing to settle)
     *       403:
     *         description: Forbidden
     */
    this.router.post("/group/:groupId/trigger", authenticate, this.wrap(this.triggerManual));

    /**
     * @openapi
     * /api/settlements/group/{groupId}/mark-all-paid:
     *   post:
     *     summary: Bulk "I paid" for all of the current user's outgoing settlements in a group
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Updated outgoing/incoming settlements
     */
    this.router.post("/group/:groupId/mark-all-paid", authenticate, this.wrap(this.markAllPaid));

    /**
     * @openapi
     * /api/settlements/group/{groupId}/approve-all:
     *   post:
     *     summary: Bulk approve all of the current user's incoming settlements in a group
     *     tags: [Settlements]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Updated outgoing/incoming settlements
     */
    this.router.post("/group/:groupId/approve-all", authenticate, this.wrap(this.approveAll));

    /**
     * @openapi
     * /api/settlements/{id}/mark-paid:
     *   post:
     *     summary: Mark a single settlement as paid ("I paid")
     *     tags: [Settlements]
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
     *         description: Updated settlement
     */
    this.router.post("/:id/mark-paid", authenticate, this.wrap(this.markPaid));

    /**
     * @openapi
     * /api/settlements/{id}/approve:
     *   post:
     *     summary: Approve a single incoming settlement
     *     tags: [Settlements]
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
     *         description: Updated settlement
     */
    this.router.post("/:id/approve", authenticate, this.wrap(this.approve));
  }

  private async getForGroup(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const result = await settlementService.getForUser(groupId, req.user!.id);
    res.json(result);
  }

  private async getHistory(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const runs = await settlementRunService.listForGroup(groupId);
    const summaries = await settlementService.getRunSummaries(runs.map((run) => run._id.toString()));

    const result = runs.map((run) => ({
      ...run.toObject(),
      summary: summaries.get(run._id.toString()) ?? {
        totalAmount: 0,
        participantCount: 0,
        confirmedCount: 0,
        totalCount: 0,
      },
    }));

    res.json(result);
  }

  private async getRunDetail(req: AuthRequest, res: Response) {
    const { groupId, runId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const run = await settlementRunService.findById(runId);
    if (!run) throw new Error("Settlement run not found");
    const settlements = await settlementService.getByRun(runId);
    res.json({ run, settlements });
  }

  private async triggerManual(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertOwnerAdminOrModerator(groupId, req.user!.id);
    const run = await settlementGenerationService.generateForGroup(groupId, {
      triggeredBy: "manual",
      triggeredByUserId: req.user!.id,
    });
    res.json(run);
  }

  private async markAllPaid(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const result = await settlementService.markAllPaidForGroup(groupId, req.user!.id);
    res.json(result);
  }

  private async approveAll(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const result = await settlementService.approveAllForGroup(groupId, req.user!.id);
    res.json(result);
  }

  private async markPaid(req: AuthRequest, res: Response) {
    const settlement = await settlementService.markPaid(req.params.id, req.user!.id);
    res.json(settlement);
  }

  private async approve(req: AuthRequest, res: Response) {
    const settlement = await settlementService.approve(req.params.id, req.user!.id);
    res.json(settlement);
  }
}

export const settlementController = new SettlementController();
