import { ClaudeProvider } from "./claude.js";
import { OpenAIProvider } from "./openai.js";
import { OpenRouterProvider } from "./openrouter.js";
import { GeminiProvider } from "./gemini.js";
import { GroqProvider } from "./groq.js";
import type { BaseProvider } from "./base.js";

export type ProviderName =
  "claude" | "openai" | "openrouter" | "gemini" | "groq";

export function createProvider(
  name: ProviderName,
  model?: string,
): BaseProvider {
  switch (name) {
    case "claude":
      return new ClaudeProvider(process.env.ANTHROPIC_API_KEY ?? "");

    case "openai":
      return new OpenAIProvider(process.env.OPENAI_API_KEY ?? "");

    case "openrouter":
      return new OpenRouterProvider(
        process.env.OPENROUTER_API_KEY ?? "",
        model,
      );

    case "gemini":
      return new GeminiProvider(process.env.GEMINI_API_KEY ?? "");

    case "groq":
      return new GroqProvider(process.env.GROQ_API_KEY ?? "");
  }
}
