import type { Session } from "./session.js";

export class SessionStore {
  private sessions = new Map<string, Session>();

  save(session: Session): void {
    this.sessions.set(session.id, session);
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }
}
