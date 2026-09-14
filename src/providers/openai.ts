import OpenAI from "openai";
import type { BaseProvider, Message, ProviderResponse } from "./base.js";

export class OpenAIProvider implements BaseProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.model = "gpt-4o-mini";
  }

  async sendMessage(messages: Message[],systemPrompt?: string): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: systemPrompt 
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
    });

    return {
      content: response.choices[0].message.content ?? "",
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
  }

  async streamMessage(
  messages: Message[],
  onChunk: (chunk: string) => void, systemPrompt?: string
): Promise<ProviderResponse> {
  let fullContent = "";

  const stream = await this.client.chat.completions.create({
    model: this.model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
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