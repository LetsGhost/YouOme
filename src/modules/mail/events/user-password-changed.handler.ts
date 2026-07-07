import { EventHandler } from "../../common/messaging/event-handler";
import { UserPasswordChangedEvent } from "../../user/events/user-password-changed.event";
import { mailService } from "../service/mail.service";

export class UserPasswordChangedHandler extends EventHandler<UserPasswordChangedEvent> {
  getEventType(): string {
    return "user.password_changed";
  }

  async handle(event: UserPasswordChangedEvent): Promise<void> {
    await mailService.sendPasswordChangedNotice(
      { email: event.payload.email, name: event.payload.name },
      event.payload.sessionsRevoked
    );
  }
}

export const userPasswordChangedHandler = new UserPasswordChangedHandler();
