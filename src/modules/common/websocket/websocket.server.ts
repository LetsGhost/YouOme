import { Server as HttpServer } from "http";
import { Server as SocketIoServer, Socket } from "socket.io";

import { logger } from "../logger/logger";
import { corsConfig } from "../../../config/cors";
import { resolveSocketUser } from "./websocket-auth";
import { connectionRegistry } from "./connection-registry";
import { websocketService } from "./websocket.service";
import { InboundWsMessage } from "./websocket.types";

const WS_PATH = "/api/ws";

const log = logger.child({ label: "websocket" });

let io: SocketIoServer | null = null;

export function initWebsocketServer(httpServer: HttpServer): SocketIoServer {
  io = new SocketIoServer(httpServer, {
    path: WS_PATH,
    cors: corsConfig,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      const user = resolveSocketUser(token);
      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch (error) {
      log.warn("Rejected websocket handshake", {
        error: error instanceof Error ? error.message : String(error),
      });
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    connectionRegistry.add(userId, socket.id);
    socket.join(`user:${userId}`);
    log.info("Client connected", { userId, socketId: socket.id });

    socket.on("message", (msg: InboundWsMessage) => {
      if (!msg || typeof msg.type !== "string") {
        log.warn("Dropped malformed inbound websocket message", { userId, socketId: socket.id });
        return;
      }

      websocketService
        .emit(msg.type, msg.payload ?? {}, { userId, socketId: socket.id, direction: "inbound" })
        .catch((error) => {
          log.error("Error handling inbound websocket message", {
            userId,
            socketId: socket.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    });

    socket.on("disconnect", (reason) => {
      connectionRegistry.remove(userId, socket.id);
      log.info("Client disconnected", { userId, socketId: socket.id, reason });
    });
  });

  log.info(`Websocket server initialized at path ${WS_PATH}`);

  return io;
}

export async function shutdownWebsocketServer(): Promise<void> {
  if (!io) return;

  await new Promise<void>((resolve, reject) => {
    io!.close((err) => (err ? reject(err) : resolve()));
  });

  log.info("Websocket server closed");
  io = null;
}
