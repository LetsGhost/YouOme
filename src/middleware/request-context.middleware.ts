import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

import { requestContext } from "../modules/common/logger/request-context";

export function requestContextMiddleware(_req: Request, _res: Response, next: NextFunction) {
  requestContext.run({ requestId: randomUUID() }, next);
}
