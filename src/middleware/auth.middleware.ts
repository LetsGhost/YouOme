import { Request, Response, NextFunction } from "express";

import { verifyToken } from "../modules/common/auth/jwt";
import { isAuthBypassEnabled, getDevUser } from "../utils/auth/auth-bypass.utils";
import { logger } from "../modules/common/logger/logger";
import { userService } from "../modules/user/service/user.service";
import { isSystemAdminEmail } from "../utils/auth/system-admin.utils";
import { redisService } from "../modules/redis/service/redis.service";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL = 3600; // 1 hour

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (isAuthBypassEnabled()) {
      const auth = req.headers.authorization;
      const token = auth?.split(" ")[1];
      const devUserIdHeader = req.headers["x-dev-user-id"];
      const devUserId = Array.isArray(devUserIdHeader) ? devUserIdHeader[0] : devUserIdHeader;
      req.user = getDevUser(token, devUserId);
      logger.warn("⚠️  Auth bypass enabled - using dev user");
      return next();
    }

    const auth = req.headers.authorization;
    if (!auth) throw new Error("Unauthorized");

    const token = auth.split(" ")[1];
    const payload = verifyToken(token);

    // Try to get user from Redis cache first
    redisService
      .get<{ id: string; email: string; role: string }>(USER_CACHE_PREFIX + payload.sub)
      .then(async (cachedUser) => {
        if (cachedUser) {
          // User found in cache
          const role = isSystemAdminEmail(cachedUser.email) ? "admin" : payload.role;
          req.user = { id: payload.sub, role };
          return next();
        }

        // Cache miss - fetch from database
        const user = await userService.findById(payload.sub);
        if (!user) {
          throw new Error("User not found");
        }

        // Cache the user for future requests
        await redisService
          .set(
            USER_CACHE_PREFIX + payload.sub,
            {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
            },
            USER_CACHE_TTL
          )
          .catch((cacheError) => {
            logger.debug("Failed to cache user in Redis", { error: cacheError });
          });

        const role = isSystemAdminEmail(user.email) ? "admin" : payload.role;
        req.user = { id: payload.sub, role };
        next();
      })
      .catch((error) => next(error));
  } catch (error) {
    next(error);
  }
}

/**
 * Invalidate user cache when user is updated or logged out
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await redisService.del(USER_CACHE_PREFIX + userId);
  } catch (error) {
    logger.debug("Failed to invalidate user cache", { error });
  }
}