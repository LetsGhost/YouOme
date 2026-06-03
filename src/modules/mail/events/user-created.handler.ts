import { EventHandler } from "../../common/messaging/event-handler";
import { UserEmailVerificationRequestedEvent } from "../../user/events/user-email-verification-requested.event";
import { mailservice } from "../service/mail.service";

export class UserCreatedMailHandler extends EventHandler<UserEmailVerificationRequestedEvent> {
    getEventType(): string {
        return "user.email_verification_requested";
    }

    async handle(event: UserEmailVerificationRequestedEvent): Promise<void> {
        await mailservice.sendMailVerification({
            to: event.payload.email,
            name: event.payload.name,
            code: event.payload.code,
        });
    }

}

export const userCreatedMailHandler = new UserCreatedMailHandler();