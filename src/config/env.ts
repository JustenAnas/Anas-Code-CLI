import chalk from "chalk";
import "dotenv/config";
import { execa } from "execa";
import type { ProviderName } from "../providers/factory.js";

const PROVIDER_API_KEYS: Record<ProviderName, string> = {
  claude: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
};

export function getApiKey(provider: ProviderName): string | undefined {
  const envName = PROVIDER_API_KEYS[provider];
  return process.env[envName]?.trim() || undefined;
}

export function setApiKey(provider: ProviderName, key: string): void {
  const envName = PROVIDER_API_KEYS[provider];
  const trimmed = key.trim();

  if (!trimmed) {
    throw new Error("API key cannot be empty.");
  }

  // Available to provider SDKs for the current CLI process.
  process.env[envName] = trimmed;
}

export function requireApiKey(provider: ProviderName): string {
  const key = getApiKey(provider);

  if (!key) {
    throw new Error(
      `Missing ${PROVIDER_API_KEYS[provider]}. Run wakeup to configure ${provider}.`,
    );
  }

  return key;
}

export async function checkEnvironment(): Promise<void> {
  const { stdout } = await execa("node", ["-v"]);

  const major = parseInt(
    stdout.trim().replace(/^v/, "").split(".")[0] ?? "0",
    10,
  );

  if (major < 18) {
    throw new Error(`Node.js 18+ required (found ${stdout.trim()})`);
  }

  console.log(chalk.green("✓ Node.js is >= 18"));
}
