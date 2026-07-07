import { BaseDomainEvent } from "../../common/messaging/event";

type UserPasswordChangedPayload = {
  email: string;
  name: string;
  sessionsRevoked: boolean;
};

export class UserPasswordChangedEvent extends BaseDomainEvent<UserPasswordChangedPayload> {
  constructor(aggregateId: string, payload: UserPasswordChangedPayload) {
    super("user.password_changed", aggregateId, payload);
  }
}
