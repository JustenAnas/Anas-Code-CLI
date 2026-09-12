import OpenAI from "openai";
import type { BaseProvider, Message, ProviderResponse } from "./base.js";

export class OpenRouterProvider implements BaseProvider {
  name = "openrouter";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "meta-llama/llama-3.1-8b-instruct") {
  this.client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  this.model = model;
}

async sendMessage(messages: Message[]): Promise<ProviderResponse> {
  const response = await this.client.chat.completions.create({
    model: this.model,
    messages,
  });

  return {
    content: response.choices[0].message.content ?? "",
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}

async streamMessage(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<ProviderResponse> {
  let fullContent = "";

  const stream = await this.client.chat.completions.create({
    model: this.model,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      fullContent += text;
      onChunk(text);
    }
  }

  return { content: fullContent };
}
}