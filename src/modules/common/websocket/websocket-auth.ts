import { verifyToken } from "../auth/jwt";
import { ConnectedUser } from "./websocket.types";

export function resolveSocketUser(token: string | undefined): ConnectedUser {
  if (!token) {
    throw new Error("Missing auth token");
  }

  const payload = verifyToken(token);
  return { id: payload.sub, role: payload.role };
}
