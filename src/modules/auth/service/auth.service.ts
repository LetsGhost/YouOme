import jwt from "jsonwebtoken";

import { userService } from "../../user/service/user.service";
import {
  signAccessToken,
  signRefreshToken,
  JwtPayload,
} from "../../common/auth/jwt";
import { env } from "../../../config/env";
import { LoginInput } from "../schema/auth.schema";
import { logger } from "../../common/logger/logger";
import { invalidateUserCache } from "../../../middleware/auth.middleware";
import { redisService } from "../../redis/service/redis.service";
import { isSystemAdminEmail } from "../../../utils/auth/system-admin.utils";

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days, matches refresh token lifetime
const REVOKED_REFRESH_PREFIX = "refresh:revoked:";

export class AuthService {
  async login(data: LoginInput) {
    const { email, password } = data;

    const user = await userService.validateUser(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const payload: JwtPayload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    if (env.NODE_ENV === "development") {
      logger.info("Dev login token issued", {
        userId: user._id.toString(),
      });
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: isSystemAdminEmail(user.email) ? "admin" : user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as JwtPayload & { iat?: number };

    const revokedAt = await redisService.get<number>(REVOKED_REFRESH_PREFIX + payload.sub);
    if (revokedAt && payload.iat && payload.iat <= revokedAt) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findById(payload.sub);
    if (!user) {
      throw new Error("User not found");
    }

    const newPayload: JwtPayload = { sub: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await redisService.set(
      REVOKED_REFRESH_PREFIX + userId,
      Math.floor(Date.now() / 1000),
      REFRESH_TOKEN_TTL_SECONDS
    );

    return { message: "Logged out successfully" };
  }

  async getCurrentUser(userId: string) {
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: isSystemAdminEmail(user.email) ? "admin" : user.role,
    };
  }

  async deleteCurrentUser(userId: string) {
    const deletedUser = await userService.deleteById(userId);
    if (!deletedUser) {
      throw new Error("User not found");
    }

    await invalidateUserCache(userId);

    logger.info("User deleted", { userId });

    return {
      message: "Account deleted successfully",
    };
  }
}

export const authService = new AuthService();
