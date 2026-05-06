import { BaseService } from "../../common/base/base.service";
import { CollaborationModel } from "../model/collaboration.model";
import { CollaborationEntity } from "../entity/collaboration.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { CollaborationCreatedEvent } from "../events/collaboration-created.event";

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
}

export const collaborationService = new CollaborationService();
