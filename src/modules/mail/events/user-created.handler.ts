import { EventHandler } from "../../common/messaging";
import { UserCreatedEvent } from "../../user/events";
import { mailservice, MailService } from "../service/mail.service";

export class UserCreatedMailHandler extends EventHandler<UserCreatedEvent> {
    getEventType(): string {
        return "user.created"
    }

    async handle(event: UserCreatedEvent): Promise<void> {
        await mailservice.sendMailVerification
    }

}