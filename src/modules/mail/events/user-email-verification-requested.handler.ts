import { EventHandler } from "../../common/messaging/event-handler";
import { UserEmailVerificationRequestedEvent } from "../../user/events/user-email-verification-requested.event";
import { mailService } from "../service/mail.service";

export class UserEmailVerificationRequestedHandler extends EventHandler<UserEmailVerificationRequestedEvent> {
  getEventType(): string {
    return "user.email_verification_requested";
  }

  async handle(event: UserEmailVerificationRequestedEvent): Promise<void> {
    await mailService.sendVerificationEmail(
      { email: event.payload.email, name: event.payload.name },
      event.payload.token
    );
  }
}

export const userEmailVerificationRequestedHandler = new UserEmailVerificationRequestedHandler();
