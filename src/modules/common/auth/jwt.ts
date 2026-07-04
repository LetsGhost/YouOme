import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

import { env } from "../../../config/env";

export interface JwtPayload {
  sub: string;
  role: string;
  rememberMe?: boolean;
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (payload: JwtPayload, rememberMe = false) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: (rememberMe
      ? env.REFRESH_TOKEN_TTL_REMEMBER_ME
      : env.REFRESH_TOKEN_TTL) as StringValue,
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;
