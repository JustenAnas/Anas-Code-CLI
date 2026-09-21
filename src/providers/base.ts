export type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCall?: ToolCall;
};

export type ToolCall = {
  id?: string;
  name: string;
  input: Record<string, string>;
};

export type ProviderResponse = {
  content: string;
  toolCall?: ToolCall;
  inputTokens?: number;
  outputTokens?: number;
};

export interface BaseProvider {
  name: string;

  sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse>;

  streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
