import { BaseDomainEvent } from "../../common/messaging/event";

type UserPasswordResetRequestedPayload = {
  email: string;
  name: string;
  token: string;
};

export class UserPasswordResetRequestedEvent extends BaseDomainEvent<UserPasswordResetRequestedPayload> {
  constructor(aggregateId: string, payload: UserPasswordResetRequestedPayload) {
    super("user.password_reset_requested", aggregateId, payload);
  }
}
