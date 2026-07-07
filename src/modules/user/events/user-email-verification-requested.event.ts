import { BaseDomainEvent } from "../../common/messaging/event";

type UserEmailVerificationRequestedPayload = {
  email: string;
  name: string;
  token: string;
};

export class UserEmailVerificationRequestedEvent extends BaseDomainEvent<UserEmailVerificationRequestedPayload> {
  constructor(aggregateId: string, payload: UserEmailVerificationRequestedPayload) {
    super("user.email_verification_requested", aggregateId, payload);
  }
}
