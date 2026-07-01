import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { logger } from "../modules/common/logger/logger";

const AUTH_TOKEN_ERROR_NAMES = ["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"];

function resolveStatusCode(err: Error): number {
  if (err instanceof ZodError) {
    return 400;
  }

  if (AUTH_TOKEN_ERROR_NAMES.includes(err.name)) {
    return 401;
  }

  const message = err.message;
  if (message === "Unauthorized") {
    return 401;
  }
  if (message === "Forbidden") {
    return 403;
  }
  if (/not found/i.test(message)) {
    return 404;
  }

  // Default: preserve prior behavior for everything else (mostly business-rule
  // validation errors thrown as plain `new Error(...)` across services/controllers).
  return 400;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  void _next;
  logger.error(err.message, {
    method: req.method,
    path: req.path,
    stack: err.stack,
  });

  res.status(resolveStatusCode(err)).json({ message: err.message });
};
