import { EventHandler } from "../../common/messaging/event-handler";
import { UserCreatedEvent } from "../../user/events/user-created.event";
import { mailservice } from "../service/mail.service";

export class UserCreatedMailHandler extends EventHandler<UserCreatedEvent> {
    getEventType(): string {
        return "user.created";
    }

    async handle(event: UserCreatedEvent): Promise<void> {
        await mailservice.sendMailVerification({
            to: event.payload.email,
        });
    }

}

export const userCreatedMailHandler = new UserCreatedMailHandler();