
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

export function requireApiKey(provider: ProviderName): string {
  const envName = PROVIDER_API_KEYS[provider];
  const key = process.env[envName];

  if (!key) {
    throw new Error(
      `Missing ${envName}. Add your key to your .env file to use ${provider}.`,
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