import { BaseService } from "../../common/base/base.service";
import { GroupModel } from "../model/group.model";
import { GroupEntity } from "../entity/group.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupCreatedEvent } from "../events/group-created.event";

export class GroupService extends BaseService<GroupEntity> {
  constructor() {
    super(GroupModel);
  }

  async createGroup(name: string, createdByUserId: string, baseCurrency?: string) {
    const group = await this.create({ name, createdByUserId, baseCurrency });

    const event = new GroupCreatedEvent(group._id.toString(), {
      name: group.name,
      createdByUserId: group.createdByUserId,
    });
    await eventBus.publish(event);

    return group;
  }
}

export const groupService = new GroupService();
