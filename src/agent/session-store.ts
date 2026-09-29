import type { Session } from "./session.js";
import { createSession } from "./session.js";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private activeSessionId: string | null = null;

  create(): Session {
    const session = createSession();

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    return session;
  }

  save(session: Session): void {
    this.sessions.set(session.id, session);
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  getActive(): Session | undefined {
    if (!this.activeSessionId) return undefined;

    return this.sessions.get(this.activeSessionId);
  }

  setActive(id: string): boolean {
    if (!this.sessions.has(id)) return false;

    this.activeSessionId = id;
    return true;
  }

  delete(id: string): boolean {
    const deleted = this.sessions.delete(id);

    if (id === this.activeSessionId) {
      this.activeSessionId = null;
    }

    return deleted;
  }
}
