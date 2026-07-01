import { NextFunction, Request, Response, Router } from "express";

export abstract class BaseController {
  public readonly router = Router();

  protected abstract routes(): void;

  constructor() {
    // Defer calling routes so subclasses can finish construction
    // (e.g., bind their methods) before routes are registered.
    setImmediate(() => this.routes());
  }

  // Express 4 does not forward rejected promises from async handlers to
  // errorHandler on its own; without this, a thrown/rejected error inside an
  // async route handler becomes an unhandled promise rejection instead of a
  // proper error response.
  protected wrap<Req extends Request>(handler: (req: Req, res: Response) => Promise<unknown>) {
    return (req: Req, res: Response, next: NextFunction) => {
      handler(req, res).catch(next);
    };
  }
}
