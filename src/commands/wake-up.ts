import { select } from "@inquirer/prompts";
import boxen from "boxen";
import chalk from "chalk";
import { startChat } from "./chat.js";
import { checkEnvironment } from "../config/env.js";
import { CLI_MODES, MODE_DESCRIPTIONS } from "../config/constants.js";
import { printBanner } from "../ui/banner.js";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import type { ProviderName } from "../providers/factory.js";
import { config } from "../config/user-config.js";

const PROVIDERS: ProviderName[] = ["claude", "openai", "openrouter", "gemini"];

async function runDoctor(): Promise<void> {
  await checkEnvironment();
}

function printModePanels(): void {
  for (const mode of CLI_MODES) {
    const panel = boxen(
      chalk.bold(mode.toUpperCase()) + "\n\n" + chalk.dim(MODE_DESCRIPTIONS[mode]),
      { padding: 1, borderColor: mode === "agent" ? "green" : mode === "ask" ? "blue" : "yellow" }
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

export async function wakeUp(): Promise<void> {
  printBanner();
  console.log();

  try {
    await runDoctor();
  } catch (error) {
    console.error(fmt.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  console.log();
  const provider = await selectProvider();
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
  await startChat({ mode, provider });
}