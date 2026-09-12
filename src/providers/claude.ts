import Anthropic from "@anthropic-ai/sdk";
import type { BaseProvider, Message, ProviderResponse } from "./base.js";

export class ClaudeProvider implements BaseProvider {
  name = "claude";
  private client: Anthropic;
  private model: string;

   constructor(apiKey: string, model = "claude-sonnet-4-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

 async sendMessage(messages: Message[]): Promise<ProviderResponse> {
  const response = await this.client.messages.create({
    model: this.model,
    max_tokens: 8096,
    messages,
  });

  return {
    content: response.content[0].type === "text" ? response.content[0].text : "",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

 async streamMessage(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<ProviderResponse> {
  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = await this.client.messages.stream({
    model: this.model,
    max_tokens: 8096,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullContent += chunk.delta.text;
      onChunk(chunk.delta.text);
    }

    if (chunk.type === "message_delta") {
      outputTokens = chunk.usage.output_tokens;
    }

    if (chunk.type === "message_start") {
      inputTokens = chunk.message.usage.input_tokens;
    }
  }

  return { content: fullContent, inputTokens, outputTokens };
}
}