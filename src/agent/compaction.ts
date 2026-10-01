import type { BaseProvider, Message } from "../providers/base.js";

export function shouldCompact(history: Message[]): boolean {
  return history.length > 20;
}

export async function compactHistory(
  history: Message[],
  provider: BaseProvider,
): Promise<Message[]> {
  if (!shouldCompact(history)) {
    return history;
  }

  let splitIndex = history.length - 10;

  // Never split an assistant tool call from its tool result.
  while (splitIndex > 0) {
    const current = history[splitIndex];
    const previous = history[splitIndex - 1];

    // Boundary starts at a tool result.
    if (
      current?.role === "tool" &&
      previous?.role === "assistant" &&
      previous.toolCall?.id === current.toolCallId
    ) {
      splitIndex--;
      continue;
    }

    // Boundary starts at an assistant tool call.
    const next = history[splitIndex + 1];

    if (
      current?.role === "assistant" &&
      current.toolCall &&
      next?.role === "tool" &&
      current.toolCall.id === next.toolCallId
    ) {
      splitIndex--;
      continue;
    }

    break;
  }

  const olderMessages = history.slice(0, splitIndex);
  const newestMessages = history.slice(splitIndex);

  try {
    const response = await provider.sendMessage(
      olderMessages,
      `Summarize this older conversation context for a coding agent.

Preserve:
- important user requests and preferences
- decisions and constraints
- project context
- completed work
- pending work
- important tool results
- relevant technical details needed to continue the conversation

Be concise but do not omit information that may be needed later.`,
    );

    if (!response.content.trim()) {
      return history;
    }

    return [
      {
        role: "assistant",
        content: `[Context Summary]\n${response.content}`,
      },
      ...newestMessages,
    ];
  } catch {
    return history;
  }
}
