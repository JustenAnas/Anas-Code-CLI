import { input } from "@inquirer/prompts";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import { createProvider, type ProviderName } from "../providers/factory.js";
import { startSpinner, stopSpinner } from "../ui/spinner.js";
import { SLASH_COMMANDS } from "../config/constants.js";
import type { Message } from "../providers/base.js";

export type ChatOptions = {
  mode?: CliMode;
  verbose?: boolean;
  provider?: ProviderName;
};

export async function startChat(options: ChatOptions = {}): Promise<void> {
  const { mode = "agent", verbose = false, provider: providerName = "openrouter" } = options;
  const provider = createProvider(providerName);
  const history: Message[] = [];

  console.log(fmt.mode(`Chat started · provider: ${provider.name} · mode: ${mode}`));
  console.log(fmt.dim("Type /help for commands, /exit to quit.\n"));

  let running = true;

  while (running) {
    const line = await input({ message: fmt.label("You:") });
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed === "/exit") {
      running = false;
      break;
    }

    if (trimmed === "/help") {
      console.log(fmt.label("\nSlash commands:"));
      for (const { command, description } of SLASH_COMMANDS) {
        console.log(fmt.dim(`  ${command.padEnd(22)} ${description}`));
      }
      console.log();
      continue;
    }

    history.push({ role: "user", content: trimmed });
    startSpinner("Thinking…");

    try {
      let fullResponse = "";

      await provider.streamMessage(history, (chunk) => {
        if (fullResponse === "") {
          stopSpinner();
          process.stdout.write(fmt.assistant("Assistant: "));
        }
        process.stdout.write(chunk);
        fullResponse += chunk;
      });

      console.log();
      history.push({ role: "assistant", content: fullResponse });
    } catch (error) {
      stopSpinner();
      console.error(fmt.error(`Error: ${error instanceof Error ? error.message : error}`));
    }
  }

  console.log(fmt.dim("Session ended."));
}