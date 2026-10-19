
import { select, password } from "@inquirer/prompts";
import boxen from "boxen";
import chalk from "chalk";

import { startChat } from "./chat.js";
import { cloudLogin, isCloudLoggedIn } from "./cloud-auth.js";
import { checkEnvironment, getApiKey, setApiKey } from "../config/env.js";
import { CLI_MODES, MODE_DESCRIPTIONS } from "../config/constants.js";
import { printBanner } from "../ui/banner.js";
import { fmt } from "../ui/format.js";

import type { CliMode } from "../agent/modes.js";
import type { ProviderName } from "../providers/factory.js";

import { config } from "../config/user-config.js";
import { ClaudeProvider } from "../providers/claude.js";

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

const ANAS_FREE_PROVIDERS: ProviderName[] = [
  "gemini",
  "openrouter",
  "groq",
];

type WakeUpOptions = {
  verbose?: boolean;
};

type AccessMethod = "free" | "own-key";

function supportsAnasFree(provider: ProviderName): boolean {
  return ANAS_FREE_PROVIDERS.includes(provider);
}

function formatPrice(price: number): string {
  return price === 0
    ? "Free"
    : `$${(price * 1_000_000).toFixed(2)}/1M tokens`;
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
          mode === "agent"
            ? "green"
            : mode === "ask"
              ? "blue"
              : "yellow",
      },
    );

    console.log(panel);
  }
}

async function selectProvider(): Promise<ProviderName> {
  const saved = config.get("provider");

  const provider = await select<ProviderName>({
    message: "Choose a provider:",
    choices: PROVIDERS.map((value) => ({
      name: value,
      value,
    })),
    default: saved,
  });

  config.set("provider", provider);

  return provider;
}

async function selectAccessMethod(
  provider: ProviderName,
): Promise<AccessMethod> {
  if (!supportsAnasFree(provider)) {
    return "own-key";
  }

  return select<AccessMethod>({
    message: `How would you like to use ${provider}?`,
    choices: [
      {
        name: "ANAS Free (limited usage, no API key required)",
        value: "free",
      },
      {
        name: "Use my own API key",
        value: "own-key",
      },
    ],
    default: "free",
  });
}

async function ensureApiKey(provider: ProviderName): Promise<void> {
  const existingKey = getApiKey(provider);

  // Automatically use an existing key without prompting.
  if (existingKey) {
    console.log(
      chalk.green(`✓ ${provider} API key detected`),
    );
    return;
  }

  while (true) {
    const key = await password({
      message: `Enter your ${provider} API key:`,
      mask: "*",
      validate: (value) =>
        value.trim().length > 0 || "API key cannot be empty.",
    });

    if (provider === "claude") {
      console.log(chalk.dim("Verifying Claude API key..."));

      try {
        const claude = new ClaudeProvider(key);
        await claude.verifyApiKey();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        console.error(fmt.error(message));

        if (message.includes("Invalid Claude API key")) {
          continue;
        }

        throw error;
      }
    }

    setApiKey(provider, key);

    console.log(
      chalk.green(`✓ ${provider} API key configured`),
    );

    return;
  }
}


async function requireCloudLogin(): Promise<void> {
  if (isCloudLoggedIn()) {
    console.log(chalk.green("✓ ANAS account login detected"));
    return;
  }

  console.log();
  console.log(
    chalk.yellow("ANAS account login is required to continue."),
  );

  const loggedIn = await cloudLogin();

  if (!loggedIn) {
    throw new Error(
      "ANAS login failed. Please log in before starting chat.",
    );
  }
}

async function configureProviderAccess(
  provider: ProviderName,
): Promise<AccessMethod> {
  const method = await selectAccessMethod(provider);

  if (method === "own-key") {
    await ensureApiKey(provider);
  }

  return method;
}


async function selectOpenRouterModel(): Promise<string> {
  console.log(
    fmt.dim("Fetching available OpenRouter models..."),
  );

  const models: OpenRouterModel[] =
    await fetchOpenRouterModels();

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

export async function wakeUp(
  options: WakeUpOptions = {},
): Promise<void> {
  const { verbose = false } = options;

  printBanner();
  console.log();

  try {
    await runDoctor();
  } catch (error) {
    console.error(
      fmt.error(
        error instanceof Error ? error.message : String(error),
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log();

  let provider: ProviderName;

  try {
    provider = await selectProvider();

    await configureProviderAccess(provider);

    // Mandatory for every provider.
    // No chat starts without an ANAS Cloud login.
    await requireCloudLogin();
  } catch (error) {
    console.error(
      fmt.error(
        error instanceof Error ? error.message : String(error),
      ),
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

  await startChat({
    mode,
    provider,
    model,
    verbose,
  });
}
