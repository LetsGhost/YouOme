import { EventHandler } from "../../common/messaging/event-handler";
import { UserRegistrationRequestedEvent } from "../events/user-registration-requested.event";
import { userService } from "../service/user.service";
import { logger } from "../../common/logger/logger";

export class UserRegistrationRequestedHandler extends EventHandler<UserRegistrationRequestedEvent> {
  getEventType(): string {
    return "user.registration_requested";
  }

  async handle(event: UserRegistrationRequestedEvent): Promise<void> {
    logger.info("User registration requested event received", {
      email: event.payload.email,
    });

    try {
      const user = await userService.createUser(
        event.payload.email,
        event.payload.password,
        event.payload.name
      );

      logger.info("User created from registration event", {
        userId: user._id.toString(),
        email: user.email,
      });
    } catch (error) {
      logger.error("Failed to create user from registration event", {
        email: event.payload.email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

export const userRegistrationRequestedHandler = new UserRegistrationRequestedHandler();
