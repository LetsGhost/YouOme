import jwt from "jsonwebtoken";

import { userService } from "../../user/service/user.service";
import {
  signAccessToken,
  signRefreshToken,
  JwtPayload,
} from "../../common/auth/jwt";
import { env } from "../../../config/env";
import {
  LoginInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "../schema/auth.schema";
import { logger } from "../../common/logger/logger";

export class AuthService {
  async login(data: LoginInput) {
    const { email, password } = data;

    const user = await userService.validateUser(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.emailVerifiedAt) {
      throw new Error("Email not verified");
    }

    const payload: JwtPayload = { sub: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    if (env.NODE_ENV === "development") {
      logger.info("Dev login token issued", {
        userId: user._id.toString(),
        accessToken,
        refreshToken,
      });
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
      },
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(data: VerifyEmailInput) {
    const user = await userService.verifyEmail(data.email, data.code);

    return {
      message: "Email verified successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
      },
    };
  }

  async resendVerificationCode(data: ResendVerificationInput) {
    await userService.resendEmailVerification(data.email);

    return {
      message: "Verification code resent successfully",
      email: data.email,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as JwtPayload;

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

  async logout() {
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
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
    };
  }
}

export const authService = new AuthService();
