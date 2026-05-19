import { Router } from "express";

export abstract class BaseController {
  public readonly router = Router();

  protected abstract routes(): void;

  constructor() {
    // Defer calling routes so subclasses can finish construction
    // (e.g., bind their methods) before routes are registered.
    setImmediate(() => this.routes());
  }
}
