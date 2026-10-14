import type { Message } from "../providers/base.js";
import type { Memory } from "./memory.js";
import { createMemory } from "./memory.js";

export type SessionMessage = Message & {
  localMessageId?: string;
};

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: SessionMessage[];
  memory: Memory;
};

export function createSession(): Session {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    messages: [],
    memory: createMemory(),
  };
}

export function addMessage(session: Session, message: Message): void {
  session.messages.push({
    ...message,
    localMessageId: crypto.randomUUID(),
  });

  session.updatedAt = new Date();
}

export function clearSession(session: Session): void {
  session.messages = [];
  session.updatedAt = new Date();
}
