import { EventHandler } from "../../common/messaging/event-handler";
import { UserPasswordResetRequestedEvent } from "../../user/events/user-password-reset-requested.event";
import { mailService } from "../service/mail.service";

export class UserPasswordResetRequestedHandler extends EventHandler<UserPasswordResetRequestedEvent> {
  getEventType(): string {
    return "user.password_reset_requested";
  }

  async handle(event: UserPasswordResetRequestedEvent): Promise<void> {
    await mailService.sendPasswordResetEmail(
      { email: event.payload.email, name: event.payload.name },
      event.payload.token
    );
  }
}

export const userPasswordResetRequestedHandler = new UserPasswordResetRequestedHandler();
