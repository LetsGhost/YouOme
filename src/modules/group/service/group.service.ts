import { BaseService } from "../../common/base/base.service";
import { GroupModel } from "../model/group.model";
import { GroupEntity } from "../entity/group.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { GroupCreatedEvent } from "../events/group-created.event";
import { groupMemberService } from "../../group-member/service/groupMember.service";
import { groupInviteService } from "../../group-invite/service/groupInvite.service";
import { groupPolicyService } from "../../group-policy/service/groupPolicy.service";
import { expenseService } from "../../expense/service/expense.service";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";
import { userService } from "../../user/service/user.service";
import { storageService } from "../../common/storage/storage.service";
import { processAvatarImage } from "../../common/storage/image.util";

type DebtBoardParticipant = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  shareAmount: number;
  status: string;
  submissionCount: number;
  submittedAt?: string;
  confirmedAt?: string;
  paidAt?: string;
  comment?: string;
  isCurrentUser: boolean;
};

type DebtBoardExpense = {
  id: string;
  groupId: string;
  createdByUserId: string;
  title: string;
  description: string;
  totalAmount: number;
  paidByUserId: string;
  paidByName: string;
  status: string;
  splitType?: string;
  createdAt?: string;
  date: string;
  participants: DebtBoardParticipant[];
};

export type GroupDebtBoard = {
  groupId: string;
  groupName: string;
  creatorId: string;
  currentUserId: string;
  expenses: DebtBoardExpense[];
};

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

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.findById(groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    if (group.createdByUserId !== userId) {
      throw new Error("Only the group owner can delete this group");
    }

    await Promise.all([
      groupMemberService.deleteMany({ groupId }),
      groupInviteService.deleteMany({ groupId }),
      groupPolicyService.deleteMany({ groupId }),
    ]);

    await this.deleteById(groupId);

    return { message: "Group deleted successfully" };
  }

  async setAvatar(groupId: string, fileBuffer: Buffer) {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const { buffer, contentType, extension } = await processAvatarImage(fileBuffer);
    const key = `groups/${groupId}.${extension}`;

    await storageService.uploadObject(key, buffer, contentType);
    return this.updateById(groupId, { avatarKey: key });
  }

  async removeAvatar(groupId: string) {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.avatarKey) {
      await storageService.deleteObject(group.avatarKey);
    }

    return this.updateById(groupId, { $unset: { avatarKey: "" } });
  }

  async findAccessibleGroups(userId: string) {
    const ownedGroups = await this.findAll({ createdByUserId: userId });
    const memberships = await groupMemberService.findAll({ userId });
    const membershipGroupIds = memberships
      .filter((membership: { removedAt?: Date }) => !membership.removedAt)
      .map((membership: { groupId: string }) => membership.groupId);

    const ownedGroupIds = ownedGroups.map((group) => group._id.toString());
    const uniqueGroupIds = [...new Set([...membershipGroupIds, ...ownedGroupIds])];

    if (uniqueGroupIds.length === 0) {
      return [];
    }

    return this.model.find({ _id: { $in: uniqueGroupIds } });
  }

  async findDebtBoard(groupId: string, currentUserId: string): Promise<GroupDebtBoard> {
    const [group, expenses] = await Promise.all([this.findById(groupId), expenseService.findAll({ groupId })]);

    if (!group) {
      throw new Error("Group not found");
    }

    const openExpenses = expenses.filter((expense) => !["settled", "paid", "completed"].includes(expense.status));
    const expenseSnapshots = await Promise.all(
      openExpenses.map(async (expense) => {
        const participants = await expenseParticipantService.getByExpense(expense._id.toString());
        return { expense, participants };
      })
    );

    const userIds = new Set<string>([group.createdByUserId]);

    for (const { expense, participants } of expenseSnapshots) {
      userIds.add(expense.createdByUserId);

      if (expense.paidByUserId) {
        userIds.add(expense.paidByUserId);
      }

      for (const participant of participants) {
        userIds.add(participant.userId);
      }
    }

    const userEntries = await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const user = await userService.findById(userId);
        return [userId, user] as const;
      })
    );

    const userMap = new Map(userEntries);

    const resolveName = (userId: string) => {
      const user = userMap.get(userId);
      return user?.name || user?.email || "Someone";
    };

    const resolveAvatarUrl = (userId: string) => {
      const user = userMap.get(userId);
      return user?.avatarKey ? `/api/users/${userId}/avatar` : null;
    };

    return {
      groupId: group._id.toString(),
      groupName: group.name,
      creatorId: group.createdByUserId,
      currentUserId,
      expenses: expenseSnapshots.map(({ expense, participants }) => {
        const paidByUserId = expense.paidByUserId || expense.createdByUserId;

        return {
          id: expense._id.toString(),
          groupId: expense.groupId,
          createdByUserId: expense.createdByUserId,
          title: expense.title,
          description: expense.note || expense.title,
          totalAmount: expense.totalAmount,
          paidByUserId,
          paidByName: resolveName(paidByUserId),
          status: expense.status,
          splitType: expense.splitType,
          createdAt: expense.createdAt?.toISOString?.() ?? expense.createdAt?.toString?.(),
          date:
            expense.expenseDate?.toISOString?.() ?? expense.createdAt?.toISOString?.() ?? new Date().toISOString(),
          participants: participants.map((participant) => ({
            id: participant._id.toString(),
            userId: participant.userId,
            name: resolveName(participant.userId),
            email: userMap.get(participant.userId)?.email,
            avatarUrl: resolveAvatarUrl(participant.userId),
            shareAmount: participant.shareAmount,
            status: participant.status,
            submissionCount: participant.submissionCount,
            submittedAt: participant.submittedAt?.toISOString?.(),
            confirmedAt: participant.confirmedAt?.toISOString?.(),
            paidAt: participant.paidAt?.toISOString?.(),
            comment: participant.comment,
            isCurrentUser: participant.userId === currentUserId,
          })),
        } satisfies DebtBoardExpense;
      }),
    } satisfies GroupDebtBoard;
  }
}

export const groupService = new GroupService();
