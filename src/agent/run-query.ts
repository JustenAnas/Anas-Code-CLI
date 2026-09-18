import chalk from "chalk";
import { createProvider } from "../providers/factory.js";
import type { ProviderName } from "../providers/factory.js";

export type RunQueryOptions = {
  verbose?: boolean;
  provider?: ProviderName;
};

export async function runQuery(prompt: string, options: RunQueryOptions = {}) {
  try {
    const provider = createProvider(options.provider ?? "openrouter");

    await provider.streamMessage(
      [{ role: "user", content: prompt }],
      (chunk) => process.stdout.write(chunk)
    );
    console.log();
  } catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`Error: ${message}`));
}
}