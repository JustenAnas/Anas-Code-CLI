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

Your job is to maintain the existing memory, not replace it unnecessarily.

Current memory:
${memory.items.length > 0 ? memory.items.join("\n") : "(empty)"}

Conversation:
${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

Rules:
- Preserve existing memories unless the conversation clearly shows they are no longer true.
- Add new information only if it is useful and durable.
- Update an existing memory when the user explicitly changes that preference, decision, or constraint.
- Remove an existing memory only when it is clearly outdated or contradicted.
- Do not turn temporary questions, explanations, or general advice into memories.
- Do not store information about programming languages unless it represents the user's actual preference or decision.
- Do not replace specific user preferences with generic advice.
- Keep memory concise.
- Return the COMPLETE updated memory, including existing memories that should remain.
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

    memory.items = parsed.items.filter(
      (item): item is string => typeof item === "string",
    );

    return memory;
  } catch {
    return memory;
  }
}
