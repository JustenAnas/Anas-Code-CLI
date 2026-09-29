import type { BaseProvider, Message } from "../providers/base.js";

export type Memory = {
  items: string[];
};

export function createMemory(): Memory {
  return {
    items: [],
  };
}

export function addMemory(memory: Memory, item: string): void {
  if (!memory.items.includes(item)) {
    memory.items.push(item);
  }
}

export function removeMemory(memory: Memory, item: string): void {
  memory.items = memory.items.filter((existing) => existing !== item);
}

export async function updateMemory(
  memory: Memory,
  messages: Message[],
  provider: BaseProvider,
): Promise<Memory> {
  const memoryPrompt = `
You manage the long-term memory for an AI coding agent.

Current memory:
${memory.items.length > 0 ? memory.items.join("\n") : "(empty)"}

Conversation:
${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

Decide what information is important enough to remember.

Rules:
- Keep only useful, durable information.
- Remember user preferences, project decisions, important constraints, and recurring facts.
- Do not remember temporary conversation details.
- Update existing memories when they change.
- Remove memories that are no longer true.
- Keep the memory concise.
- Return ONLY valid JSON in this exact format:
{"items":["memory 1","memory 2"]}
`;

  const response = await provider.sendMessage(
    [{ role: "user", content: memoryPrompt }],
    "You are a memory manager. Return only valid JSON.",
  );

  try {
    const parsed = JSON.parse(response.content) as { items?: unknown };

    if (!Array.isArray(parsed.items)) {
      return memory;
    }

    return {
      items: parsed.items.filter(
        (item): item is string => typeof item === "string",
      ),
    };
  } catch {
    return memory;
  }
}
