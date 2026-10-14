import { select } from "@inquirer/prompts";
import boxen from "boxen";
import chalk from "chalk";
import { startChat } from "./chat.js";
import { checkEnvironment, requireApiKey } from "../config/env.js";
import { CLI_MODES, MODE_DESCRIPTIONS } from "../config/constants.js";
import { printBanner } from "../ui/banner.js";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import type { ProviderName } from "../providers/factory.js";
import { config } from "../config/user-config.js";
import {
  fetchOpenRouterModels,
  type OpenRouterModel,
} from "../providers/openrouter.js";

const PROVIDERS: ProviderName[] = [
  "claude",
  "openai",
  "openrouter",
  "gemini",
  "groq",
];

type WakeUpOptions = {
  verbose?: boolean;
};

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${(price * 1_000_000).toFixed(2)}/1M tokens`;
}

async function runDoctor(): Promise<void> {
  await checkEnvironment();
}

function printModePanels(): void {
  for (const mode of CLI_MODES) {
    const panel = boxen(
      chalk.bold(mode.toUpperCase()) +
        "\n\n" +
        chalk.dim(MODE_DESCRIPTIONS[mode]),
      {
        padding: 1,
        borderColor:
          mode === "agent" ? "green" : mode === "ask" ? "blue" : "yellow",
      },
    );

    console.log(panel);
  }
}

async function selectProvider(): Promise<ProviderName> {
  const saved = config.get("provider");

  const provider = await select<ProviderName>({
    message: "Choose a provider:",
    choices: PROVIDERS.map((value) => ({ name: value, value })),
    default: saved,
  });

  config.set("provider", provider);
  return provider;
}

async function selectOpenRouterModel(): Promise<string> {
  console.log(fmt.dim("Fetching available OpenRouter models..."));

  const models: OpenRouterModel[] = await fetchOpenRouterModels();

  if (models.length === 0) {
    throw new Error(
      "No text-only OpenRouter models supporting tool calling were found.",
    );
  }

  return select<string>({
    message: "Choose an OpenRouter model:",
    pageSize: 15,
    choices: models.map((model) => ({
      name:
        `${model.name} ${model.isFree ? "(Free)" : ""}` +
        ` — Input: ${formatPrice(model.promptPrice)}` +
        ` · Output: ${formatPrice(model.completionPrice)}` +
        ` [${model.id}]`,
      value: model.id,
    })),
  });
}

export async function wakeUp(options: WakeUpOptions = {}): Promise<void> {
  const { verbose = false } = options;

  printBanner();
  console.log();

  try {
    await runDoctor();
  } catch (error) {
    console.error(
      fmt.error(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }

  console.log();

  let provider: ProviderName;

  try {
    provider = await selectProvider();
    requireApiKey(provider);
  } catch (error) {
    console.error(
      fmt.error(error instanceof Error ? error.message : String(error)),
    );
    return;
  }

  let model: string | undefined;

  if (provider === "openrouter") {
    try {
      model = await selectOpenRouterModel();
    } catch (error) {
      console.error(
        fmt.error(
          `Could not load OpenRouter models: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
      return;
    }
  }

  console.log();
  printModePanels();

  const mode = await select<CliMode>({
    message: "Choose a mode to start:",
    choices: CLI_MODES.map((value) => ({
      name: `${value} — ${MODE_DESCRIPTIONS[value]}`,
      value,
    })),
    default: config.get("mode"),
  });

  config.set("mode", mode);

  console.log();

  await startChat({ mode, provider, model, verbose });
}
