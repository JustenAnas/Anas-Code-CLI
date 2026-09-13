import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BaseProvider, Message, ProviderResponse } from "./base.js";

export class GeminiProvider implements BaseProvider {
  name = "gemini";
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string) {
  this.client = new GoogleGenerativeAI(apiKey);
  this.model = "gemini-3.6-flash";
}

async sendMessage(messages: Message[]): Promise<ProviderResponse> {
  const geminiModel = this.client.getGenerativeModel({ model: this.model });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);

  return {
    content: result.response.text(),
  };
}
async streamMessage(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<ProviderResponse> {
  const geminiModel = this.client.getGenerativeModel({ model: this.model });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  let fullContent = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullContent += text;
      onChunk(text);
    }
  }

  return { content: fullContent };
}
}