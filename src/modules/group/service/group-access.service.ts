import { groupService } from "./group.service";
import { groupMemberService } from "../../group-member/service/groupMember.service";

export class GroupAccessService {
  async getGroupOrThrow(groupId: string) {
    const group = await groupService.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    return group;
  }

  async getMembership(groupId: string, userId: string) {
    const memberships = await groupMemberService.findAll({ groupId, userId });
    return memberships.find((membership) => !membership.removedAt) ?? null;
  }

  async assertNotMember(groupId: string, userId: string) {
    const group = await this.getGroupOrThrow(groupId);

    if (group.createdByUserId === userId) {
      throw new Error("Already a member of this group");
    }

    const membership = await this.getMembership(groupId, userId);
    if (membership) {
      throw new Error("Already a member of this group");
    }
  }

  async isOwnerOrAdmin(groupId: string, userId: string) {
    const group = await this.getGroupOrThrow(groupId);

    if (group.createdByUserId === userId) {
      return true;
    }

    const membership = await this.getMembership(groupId, userId);
    return membership ? ["owner", "admin"].includes(membership.role) : false;
  }

  async assertOwnerOrAdmin(groupId: string, userId: string) {
    const allowed = await this.isOwnerOrAdmin(groupId, userId);
    if (!allowed) {
      throw new Error("Forbidden");
    }
  }

  async assertMember(groupId: string, userId: string) {
    const group = await this.getGroupOrThrow(groupId);
    if (group.createdByUserId === userId) {
      return;
    }

    const membership = await this.getMembership(groupId, userId);
    if (!membership) {
      throw new Error("Forbidden");
    }
  }
}

export const groupAccessService = new GroupAccessService();