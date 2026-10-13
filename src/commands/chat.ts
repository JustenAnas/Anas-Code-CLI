
import { input, confirm, select } from "@inquirer/prompts";
import { fmt } from "../ui/format.js";
import type { CliMode } from "../agent/modes.js";
import { createProvider, type ProviderName } from "../providers/factory.js";
import { runAgentLoop } from "../agent/loop.js";
import { buildProjectContext } from "../agent/context.js";
import type { Plan } from "../agent/plan.js";
import { handleCommand } from "./handler.js";
import { addMessage } from "../agent/session.js";
import { SessionStore } from "../agent/session-store.js";
import { resolveFileReferences } from "../agent/file-references.js";
import { cloudClient } from "../cloud/client.js";

export type ChatOptions = {
  mode?: CliMode;
  verbose?: boolean;
  provider?: ProviderName;
  model?: string;
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
    model,
  } = options;

  const provider = createProvider(providerName, model);
  const context = await buildProjectContext();

  const sessionStore = new SessionStore();
  let session = sessionStore.create();

  async function syncConversation(): Promise<void> {
    if (!cloudClient.isLoggedIn) {
      console.error(
        "[Cloud Sync] Not logged in; skipping conversation sync.",
      );
      return;
    }

    try {
      const firstUserMessage = session.messages.find(
        (message) => message.role === "user",
      );

      await cloudClient.saveSession({
        localSessionId: session.id,
        title:
          firstUserMessage?.content.slice(0, 80) || "ANAS CLI session",
        workingDirectory: process.cwd(),
      });

      for (const message of session.messages) {
        message.localMessageId ??= crypto.randomUUID();

        await cloudClient.saveMessage(session.id, {
          localMessageId: message.localMessageId,
          role: message.role,
          content: message.content,
          toolCallId: message.toolCallId,
          toolCall: message.toolCall,
          toolCalls: message.toolCalls,
        });
      }

      console.log(
        `[Cloud Sync] Synced ${session.messages.length} messages successfully.`,
      );
    } catch (error) {
      console.error(
        "[Cloud Sync] Failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    fmt.mode(
      `Chat started · provider: ${provider.name} · mode: ${mode}` +
        (model ? ` · model: ${model}` : ""),
    ),
  );
  console.log(fmt.dim("Type /help for commands, /exit to quit.\n"));

  let running = true;

  while (running) {
    const line = await input({ message: fmt.label("You:") });
    const trimmed = line.trim();

    if (!trimmed) continue;

    const enrichedPrompt = await resolveFileReferences(trimmed);
    const command = handleCommand(trimmed, mode);

    if (command.type === "exit") {
      running = false;
      break;
    }

    if (command.type === "new") {
      session = sessionStore.create();
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
      const localSessions = sessionStore
        .getAll()
        .filter((storedSession) => storedSession.id !== session.id);

      let cloudSessions: Awaited<
        ReturnType<typeof cloudClient.listSessions>
      > = [];

      if (cloudClient.isLoggedIn) {
        try {
          cloudSessions = await cloudClient.listSessions();
        } catch (error) {
          console.error(
            fmt.error(
              `Could not load cloud sessions: ${
                error instanceof Error ? error.message : error
              }`,
            ),
          );
        }
      }

      const availableCloudSessions = cloudSessions.filter(
        (cloudSession) =>
          cloudSession.localSessionId !== session.id &&
          !sessionStore.get(cloudSession.localSessionId),
      );

      const choices = [
        ...localSessions.map((storedSession) => ({
          name: `[Local] ${storedSession.id} · ${storedSession.updatedAt.toLocaleString()} · ${storedSession.messages.length} messages`,
          value: `local:${storedSession.id}`,
        })),
        ...availableCloudSessions.map((cloudSession) => ({
          name: `[Cloud] ${cloudSession.title} · ${new Date(
            cloudSession.updatedAt,
          ).toLocaleString()}`,
          value: `cloud:${cloudSession.localSessionId}`,
        })),
      ];

      if (choices.length === 0) {
        console.log(fmt.dim("\nNo previous sessions found.\n"));
        continue;
      }

      const selected = await select({
        message: "Resume session:",
        choices,
      });

      if (selected.startsWith("local:")) {
        const selectedId = selected.slice("local:".length);
        const selectedSession = sessionStore.get(selectedId);

        if (!selectedSession) {
          console.log(fmt.error("Session not found."));
          continue;
        }

        sessionStore.setActive(selectedSession.id);
        session = selectedSession;
      } else {
        const localSessionId = selected.slice("cloud:".length);

        try {
          const cloudSession = availableCloudSessions.find(
            (item) => item.localSessionId === localSessionId,
          );

          if (!cloudSession) {
            console.log(fmt.error("Cloud session not found."));
            continue;
          }

          const cloudMessages =
            await cloudClient.listMessages(localSessionId);

          const restoredMessages = cloudMessages
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role as "assistant" | "user" | "tool",
              content: message.content,
              localMessageId: message.localMessageId,
              ...(message.toolCallId
                ? { toolCallId: message.toolCallId }
                : {}),
              ...(message.toolCall ? { toolCall: message.toolCall } : {}),
              ...(message.toolCalls ? { toolCalls: message.toolCalls } : {}),
            }));

          session = sessionStore.restore(
            localSessionId,
            restoredMessages,
            new Date(cloudSession.createdAt),
            new Date(cloudSession.updatedAt),
          );
        } catch (error) {
          console.error(
            fmt.error(
              `Could not resume cloud session: ${
                error instanceof Error ? error.message : error
              }`,
            ),
          );
          continue;
        }
      }

      console.log(
        fmt.mode(`\nSession resumed · ${session.messages.length} messages.\n`),
      );
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

    try {
      addMessage(session, {
        role: "user",
        content: enrichedPrompt,
      });

      let firstChunk = true;

      const plan = await runAgentLoop(
        enrichedPrompt,
        provider,
        session,
        (chunk) => {
          if (mode === "plan") return;

          if (firstChunk) {
            process.stdout.write(fmt.assistant("Assistant: "));
            firstChunk = false;
          }

          process.stdout.write(chunk);
        },
        (status) => console.log(`\n[DEBUG] ${status}`),
        context,
        verbose,
        mode,
      );

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

          let executionFirstChunk = true;

          addMessage(session, {
            role: "user",
            content: executionPrompt,
          });

          await runAgentLoop(
            executionPrompt,
            provider,
            session,
            (chunk) => {
              if (executionFirstChunk) {
                process.stdout.write(fmt.assistant("Assistant: "));
                executionFirstChunk = false;
              }

              process.stdout.write(chunk);
            },
            (status) => console.log(`\n[DEBUG] ${status}`),
            context,
            verbose,
            mode,
          );

          console.log();
        }
      }

      console.log();
    } catch (error) {
      console.error(
        fmt.error(`Error: ${error instanceof Error ? error.message : error}`),
      );
    } finally {
      await syncConversation();
    }
  }

  console.log(fmt.dim("Session ended."));
}

