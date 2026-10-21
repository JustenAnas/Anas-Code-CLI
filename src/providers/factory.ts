import { ClaudeProvider } from "./claude.js";
import { OpenAIProvider } from "./openai.js";
import { CloudOpenAIProvider } from "./cloud-openai.js";
import type { BaseProvider } from "./base.js";
import { getApiKey } from "../config/env.js";
import { config } from "../config/user-config.js";

export type ProviderName =
  "claude" | "openai" | "openrouter" | "gemini" | "groq";

export function createProvider(
  name: ProviderName,
  model?: string,
): BaseProvider {
  switch (name) {
    case "claude": {
      const key = getApiKey("claude");

      if (!key) {
        throw new Error(
          'Anthropic API key not set. Run "anas wakeup" to configure it.',
        );
      }

      return new ClaudeProvider(key);
    }

    case "openai": {
      const key = getApiKey("openai");
      return key
        ? new OpenAIProvider(key)
        : new CloudOpenAIProvider("openai", true);
    }

    case "gemini":
    case "openrouter":
    case "groq":
      return new CloudOpenAIProvider(
        name,
        config.get("accessMethod") === "own-key",
         model,
      );
  }
}
