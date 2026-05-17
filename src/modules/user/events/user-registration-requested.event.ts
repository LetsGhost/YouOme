import { BaseDomainEvent } from "../../common/messaging/event";

export class UserRegistrationRequestedEvent extends BaseDomainEvent<{
  email: string;
  password: string;
  name?: string;
}> {
  constructor(
    aggregateId: string,
    payload: {
      email: string;
      password: string;
      name?: string;
    }
  ) {
    super("user.registration_requested", aggregateId, payload);
  }
}
