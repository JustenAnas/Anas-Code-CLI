import type { Message } from "../providers/base.js";
import type { Memory } from "./memory.js";
import { createMemory } from "./memory.js";

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
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
  session.messages.push(message);
  session.updatedAt = new Date();
}

export function clearSession(session: Session): void {
  session.messages = [];
  session.updatedAt = new Date();
}
