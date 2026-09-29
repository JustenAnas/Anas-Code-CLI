import type { Message } from "../providers/base.js";

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
};

export function createSession(): Session {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function addMessage(session: Session, message: Message): void {
  session.messages.push(message);
  session.updatedAt = new Date();
}

export function clearSession(session: Session): void {
  session.messages = [];
  session.updatedAt = new Date();
}
