import { BaseDomainEvent } from "../../common/messaging/event";

export class ExpenseCreatedWithParticipantsEvent extends BaseDomainEvent<{
  groupId: string;
  title: string;
  totalAmount: number;
  participants: Array<{ userId: string; shareAmount?: number }>;
}> {
  constructor(
    aggregateId: string,
    payload: {
      groupId: string;
      title: string;
      totalAmount: number;
      participants: Array<{ userId: string; shareAmount?: number }>;
    }
  ) {
    super("expense.created_with_participants", aggregateId, payload);
  }
}
