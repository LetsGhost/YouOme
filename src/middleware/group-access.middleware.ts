import { Request, Response, NextFunction } from "express";
import { groupAccessService } from "../modules/group/service/group-access.service";
import { logger } from "../modules/common/logger/logger";
import { AuthRequest } from "./auth.middleware";

/**
 * Extended request with group access info
 */
export interface GroupAccessRequest extends AuthRequest {
  groupAccess?: {
    groupId: string;
    isOwnerOrAdmin: boolean;
    isMember: boolean;
  };
}

/**
 * Middleware to pre-populate group access checks
 * Extracts groupId from route params or query, checks access, and attaches to request
 */
export async function groupAccessMiddleware(
  req: GroupAccessRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new Error("User not authenticated"));
    }

    // Extract groupId from params (most common case)
    const groupId = req.params.groupId || req.params.id;

    if (!groupId) {
      // No group context - continue
      return next();
    }

    // Validate groupId format (basic check)
    if (typeof groupId !== "string" || groupId.length < 1) {
      return next(new Error("Invalid group ID format"));
    }

    // Check access - these methods throw errors if not authorized
    let isOwnerOrAdmin = false;
    let isMember = false;

    try {
      await groupAccessService.assertOwnerOrAdmin(groupId, userId);
      isOwnerOrAdmin = true;
    } catch (_err) {
      // Not owner/admin - continue
    }

    try {
      await groupAccessService.assertMember(groupId, userId);
      isMember = true;
    } catch (_err) {
      // Not member - continue
    }

    req.groupAccess = {
      groupId,
      isOwnerOrAdmin,
      isMember,
    };

    next();
  } catch (error) {
    logger.error("Group access middleware error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}
