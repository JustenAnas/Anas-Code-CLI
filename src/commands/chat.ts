import { input, confirm, select } from "@inquirer/prompts";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import { createProvider, type ProviderName } from "../providers/factory.js";
// import type { Message } from "../providers/base.js";
import { runAgentLoop } from "../agent/loop.js";
import { buildProjectContext } from "../agent/context.js";
import type { Plan } from "../agent/plan.js";
import { handleCommand } from "./handler.js";
import { createSession, addMessage } from "../agent/session.js";
import { SessionStore } from "../agent/session-store.js";

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

  const sessionStore = new SessionStore();
  let session = createSession();
  sessionStore.save(session);
  // const history = session.messages;

  if (context) {
    addMessage(session, {
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

    const command = handleCommand(trimmed, mode);

    if (command.type === "exit") {
      running = false;
      break;
    }

    if (command.type === "new") {
      session = createSession();
      sessionStore.save(session);
      console.log(fmt.mode("New session started.\n"));
      continue;
    }

    if (command.type === "history") {
      const sessions = sessionStore.getAll();

      if (sessions.length === 0) {
        console.log(fmt.dim("\nNo sessions found.\n"));
        continue;
      }

      console.log(fmt.mode("\nSession History"));

      sessions.forEach((storedSession, index) => {
        console.log(
          `${index + 1}. ${storedSession.id} · ${storedSession.updatedAt.toLocaleString()} · ${storedSession.messages.length} messages`,
        );
      });

      console.log();
      continue;
    }

    if (command.type === "resume") {
      const sessions = sessionStore
        .getAll()
        .filter((storedSession) => storedSession.id !== session.id);

      if (sessions.length === 0) {
        console.log(fmt.dim("\nNo previous sessions found.\n"));
        continue;
      }

      const selectedId = await select({
        message: "Resume session:",
        choices: sessions.map((storedSession) => ({
          name: `${storedSession.id} · ${storedSession.updatedAt.toLocaleString()} · ${storedSession.messages.length} messages`,
          value: storedSession.id,
        })),
      });

      const selectedSession = sessionStore.get(selectedId);

      if (!selectedSession) {
        console.log(fmt.error("Session not found."));
        continue;
      }

      session = selectedSession;
      console.log(fmt.mode("\nSession resumed.\n"));
      continue;
    }

    if (command.type === "help") {
      console.log(fmt.label(`\n${command.output}\n`));
      continue;
    }

    if (command.type === "mode") {
      mode = command.mode;
      console.log(fmt.mode(`Mode switched to: ${mode}`));
      continue;
    }

    // startSpinner("Thinking…");

    try {
      let firstChunk = true;

      const plan = await runAgentLoop(
        trimmed,
        provider,
        session,
        (chunk) => {
          if (mode === "plan") return;

          if (firstChunk) {
            // stopSpinner();
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

      // stopSpinner();

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

          // startSpinner("Executing…");

          let executionFirstChunk = true;

          await runAgentLoop(
            executionPrompt,
            provider,
            session,
            (chunk) => {
              if (executionFirstChunk) {
                // stopSpinner();
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

          // stopSpinner();
          console.log();
        }
      }

      console.log();
    } catch (error) {
      // stopSpinner();

      console.error(
        fmt.error(`Error: ${error instanceof Error ? error.message : error}`),
      );
    }
  }

  console.log(fmt.dim("Session ended."));
}
