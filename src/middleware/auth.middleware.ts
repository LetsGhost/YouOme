import { Request, Response, NextFunction } from "express";

import { verifyToken } from "../modules/common/auth/jwt";
import { isAuthBypassEnabled, getDevUser } from "../utils/auth/auth-bypass.utils";
import { logger } from "../modules/common/logger/logger";
import { userService } from "../modules/user/service/user.service";
import { isSystemAdminEmail } from "../utils/auth/system-admin.utils";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (isAuthBypassEnabled()) {
      const auth = req.headers.authorization;
      const token = auth?.split(" ")[1];
      req.user = getDevUser(token);
      logger.warn("⚠️  Auth bypass enabled - using dev user");
      return next();
    }

    const auth = req.headers.authorization;
    if (!auth) throw new Error("Unauthorized");

    const token = auth.split(" ")[1];
    const payload = verifyToken(token);

    userService
      .findById(payload.sub)
      .then((user) => {
        if (!user) {
          throw new Error("User not found");
        }

        const role = isSystemAdminEmail(user.email) ? "admin" : payload.role;
        req.user = { id: payload.sub, role };
        next();
      })
      .catch((error) => next(error));
  } catch (error) {
    next(error);
  }
}