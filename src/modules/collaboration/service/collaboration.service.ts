import { BaseService } from "../../common/base/base.service";
import { CollaborationModel } from "../model/collaboration.model";
import { CollaborationEntity } from "../entity/collaboration.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { CollaborationCreatedEvent } from "../events/collaboration-created.event";
import { userService } from "../../user/service/user.service";

export class CollaborationService extends BaseService<CollaborationEntity> {
  constructor() {
    super(CollaborationModel);
  }

  async createCollaboration(ownerUserId: string, collaboratorUserId: string, role = "viewer") {
    const collab = await this.create({ ownerUserId, collaboratorUserId, role });
    const event = new CollaborationCreatedEvent(collab._id.toString(), { ownerUserId: collab.ownerUserId, collaboratorUserId: collab.collaboratorUserId });
    await eventBus.publish(event);
    return collab;
  }

  async createCollaborationByEmail(ownerUserId: string, collaboratorEmail: string, role = "viewer") {
    const collaborator = await userService.findByEmail(collaboratorEmail.trim());

    if (!collaborator) {
      throw new Error("No user found with that email");
    }

    return this.createCollaboration(ownerUserId, collaborator._id.toString(), role);
  }
}

export const collaborationService = new CollaborationService();
