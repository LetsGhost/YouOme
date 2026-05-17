import { Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { AuthRequest, authenticate } from "../../../middleware/auth.middleware";
import { friendInviteService } from "../service/friend-invite.service";
import { createFriendInviteSchema } from "../schema/friend-invite.schema";

class FriendInviteController extends BaseController {
    constructor() {
        super();
        this.sendInvite = this.sendInvite.bind(this);
        this.respondToInvite = this.respondToInvite.bind(this);
    }

    protected routes(): void {
        this.router.post("/", authenticate, this.sendInvite);
        this.router.patch("/:id/respond", authenticate, this.respondToInvite);
    }

    private async sendInvite(req: AuthRequest, res: Response): Promise<void> {
        const dto = createFriendInviteSchema
            .pick({ toUserId: true })
            .parse(req.body);

        const fromUserId = req.user?.id;
        if (!fromUserId) {
            throw new Error("Unauthorized");
        }

        const invite = await friendInviteService.sendInvite(fromUserId, dto.toUserId);
        res.status(201).json(invite);
    }

    private async respondToInvite(req: AuthRequest, res: Response): Promise<void> {
        const { accept } = req.body as { accept: boolean };
        const userId = req.user?.id;

        if (typeof accept !== "boolean") {
            throw new Error("accept must be a boolean");
        }

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const invite = await friendInviteService.respondToInvite(req.params.id, userId, accept);
        res.json(invite);
    }
}

export const friendInviteController = new FriendInviteController();