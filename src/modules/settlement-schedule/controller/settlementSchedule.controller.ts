import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { settlementScheduleService } from "../service/settlementSchedule.service";
import { upsertSettlementScheduleSchema } from "../schema/settlementSchedule.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { groupAccessService } from "../../group/service/group-access.service";

/**
 * @openapi
 * tags:
 *   name: Settlement Schedules
 *   description: Per-group recurring settlement schedule configuration
 */
class SettlementScheduleController extends BaseController {
  constructor() {
    super();
    this.getByGroup = this.getByGroup.bind(this);
    this.upsert = this.upsert.bind(this);
    this.deactivate = this.deactivate.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/settlement-schedules/group/{groupId}:
     *   get:
     *     summary: Get the settlement schedule for a group
     *     tags: [Settlement Schedules]
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
     *         description: Settlement schedule (or null if none configured yet)
     */
    this.router.get("/group/:groupId", authenticate, this.wrap(this.getByGroup));

    /**
     * @openapi
     * /api/settlement-schedules/group/{groupId}:
     *   patch:
     *     summary: Create or update the settlement schedule for a group (owner/admin/moderator only)
     *     tags: [Settlement Schedules]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpsertSettlementScheduleDTO'
     *     responses:
     *       200:
     *         description: Schedule saved
     *       403:
     *         description: Forbidden
     */
    this.router.patch("/group/:groupId", authenticate, this.wrap(this.upsert));

    /**
     * @openapi
     * /api/settlement-schedules/group/{groupId}/deactivate:
     *   post:
     *     summary: Turn off scheduled settlements for a group (owner/admin/moderator only)
     *     tags: [Settlement Schedules]
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
     *         description: Schedule deactivated
     *       403:
     *         description: Forbidden
     */
    this.router.post("/group/:groupId/deactivate", authenticate, this.wrap(this.deactivate));
  }

  private async getByGroup(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertMember(groupId, req.user!.id);
    const schedule = await settlementScheduleService.getByGroupId(groupId);
    res.json(schedule);
  }

  private async upsert(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertOwnerAdminOrModerator(groupId, req.user!.id);
    const dto = upsertSettlementScheduleSchema.parse(req.body);
    const schedule = await settlementScheduleService.upsertSchedule(groupId, dto);
    res.json(schedule);
  }

  private async deactivate(req: AuthRequest, res: Response) {
    const { groupId } = req.params;
    await groupAccessService.assertOwnerAdminOrModerator(groupId, req.user!.id);
    const schedule = await settlementScheduleService.deactivate(groupId);
    res.json(schedule);
  }
}

export const settlementScheduleController = new SettlementScheduleController();
