import { input, confirm } from "@inquirer/prompts";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import { createProvider, type ProviderName } from "../providers/factory.js";
import { startSpinner, stopSpinner } from "../ui/spinner.js";
import { SLASH_COMMANDS } from "../config/constants.js";
import type { Message } from "../providers/base.js";
import { runAgentLoop } from "../agent/loop.js";
import { buildProjectContext } from "../agent/context.js";
import type { Plan } from "../agent/plan.js";

export type ChatOptions = {
  mode?: CliMode;
  verbose?: boolean;
  provider?: ProviderName;
};

function printPlan(plan: Plan): void {
  console.log(fmt.mode("\nPlan"));
  console.log(fmt.dim("────────────────────────"));

  plan.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });

  console.log(fmt.dim("────────────────────────\n"));
}

export async function startChat(options: ChatOptions = {}): Promise<void> {
  let {
    mode = "agent",
    verbose = false,
    provider: providerName = "openrouter",
  } = options;

  const provider = createProvider(providerName);
  const context = await buildProjectContext();

  const history: Message[] = [];

  if (context) {
    history.push({
      role: "assistant",
      content: `I have scanned your project structure:${context}`,
    });
  }

  console.log(
    fmt.mode(`Chat started · provider: ${provider.name} · mode: ${mode}`),
  );
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

    if (trimmed.startsWith("/mode ")) {
      const requestedMode = trimmed.slice(6).trim();

      if (
        requestedMode !== "agent" &&
        requestedMode !== "ask" &&
        requestedMode !== "plan"
      ) {
        console.log(fmt.error("Invalid mode. Use: agent, ask, or plan."));
        continue;
      }

      mode = requestedMode;
      console.log(fmt.mode(`Mode switched to: ${mode}`));
      continue;
    }

    startSpinner("Thinking…");

    try {
      let firstChunk = true;

      const plan = await runAgentLoop(
        trimmed,
        provider,
        history,
        (chunk) => {
          if (mode === "plan") return;

          if (firstChunk) {
            stopSpinner();
            process.stdout.write(fmt.assistant("Assistant: "));
            firstChunk = false;
          }

          process.stdout.write(chunk);
        },
        undefined,
        "",
        verbose,
        mode,
      );

      stopSpinner();

      if (mode === "plan" && plan) {
        printPlan(plan);

        const approved = await confirm({
          message: "Execute this plan?",
          default: true,
        });

        if (approved) {
          mode = "agent";
          console.log(fmt.mode("Executing plan...\n"));

          const executionPrompt = `Execute this plan step by step:

${plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`;

          startSpinner("Executing…");

          let executionFirstChunk = true;

          await runAgentLoop(
            executionPrompt,
            provider,
            history,
            (chunk) => {
              if (executionFirstChunk) {
                stopSpinner();
                process.stdout.write(fmt.assistant("Assistant: "));
                executionFirstChunk = false;
              }

              process.stdout.write(chunk);
            },
            undefined,
            "",
            verbose,
            mode,
          );

          stopSpinner();
          console.log();
        }
      }

      console.log();
    } catch (error) {
      stopSpinner();

      console.error(
        fmt.error(`Error: ${error instanceof Error ? error.message : error}`),
      );
    }
  }

  console.log(fmt.dim("Session ended."));
}
