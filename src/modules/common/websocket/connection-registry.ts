export class ConnectionRegistry {
  private byUser: Map<string, Set<string>> = new Map();

  add(userId: string, socketId: string): void {
    if (!this.byUser.has(userId)) {
      this.byUser.set(userId, new Set());
    }
    this.byUser.get(userId)!.add(socketId);
  }

  remove(userId: string, socketId: string): void {
    const sockets = this.byUser.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.byUser.delete(userId);
    }
  }

  getSocketIdsForUser(userId: string): string[] {
    return Array.from(this.byUser.get(userId) ?? []);
  }

  isUserConnected(userId: string): boolean {
    return this.byUser.has(userId);
  }

  getUserCount(): number {
    return this.byUser.size;
  }

  getConnectionCount(): number {
    let total = 0;
    for (const sockets of this.byUser.values()) {
      total += sockets.size;
    }
    return total;
  }
}

export const connectionRegistry = new ConnectionRegistry();
