export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderResponse = {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
};

export interface BaseProvider {
  name: string;
  sendMessage(messages: Message[]): Promise<ProviderResponse>;
  streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<ProviderResponse>;
}