import "dotenv/config";
import React, { useEffect, useRef, useState } from "react";
import { loadCloudMemory } from "../agent/memory.js";
import { cloudClient } from "../cloud/client.js";
import { render, Box, Text, useInput } from "ink";
import { Header } from "./Header.js";
import { Chat } from "./Chat.js";
import { Input } from "./Input.js";
import { runAgentLoop } from "../agent/loop.js";
import { createProvider, type ProviderName } from "../providers/factory.js";
import type { Message } from "../providers/base.js";
import type { PermissionResult } from "../agent/permission.js";
import { handleCommand } from "../commands/handler.js";
import type { CliMode } from "../agent/modes.js";
import { createSession, addMessage } from "../agent/session.js";
import {
  fetchOpenRouterModels,
  type OpenRouterModel,
} from "../providers/openrouter.js";

type PermissionRequest = {
  toolName: string;
  input: Record<string, string>;
  resolve: (result: PermissionResult) => void;
};

const PROVIDERS: ProviderName[] = ["openrouter", "openai", "gemini", "claude"];

const MODES: CliMode[] = ["agent", "ask", "plan"];

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${(price * 1_000_000).toFixed(2)}/1M tokens`;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [permission, setPermission] = useState<PermissionRequest | null>(null);
  const [providerName, setProviderName] = useState<ProviderName | null>(null);
  const [mode, setMode] = useState<CliMode | null>(null);
  const [busy, setBusy] = useState(false);

  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    cost: number;
  } | null>(null);

  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(
    [],
  );
  const [openRouterModelId, setOpenRouterModelId] = useState<string | null>(
    null,
  );
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectionIndex, setSelectionIndex] = useState(0);

  const session = useRef(createSession()).current;
  const permissionRef = useRef<PermissionRequest | null>(null);

  const setupStep =
    providerName === null
      ? "provider"
      : providerName === "openrouter" && openRouterModelId === null
        ? "model"
        : mode === null
          ? "mode"
          : "chat";

  const provider = providerName
    ? createProvider(providerName, openRouterModelId ?? undefined)
    : null;

  useEffect(() => {
    if (providerName !== "openrouter" || modelsLoaded) return;

    let cancelled = false;

    async function loadModels() {
      setModelsLoading(true);
      setModelsError(null);

      try {
        const models = await fetchOpenRouterModels();

        if (!cancelled) {
          setOpenRouterModels(models);
          setModelsLoaded(true);
          setSelectionIndex(0);

          if (models.length === 0) {
            setModelsError(
              "No text-only models supporting tool calling were found.",
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setModelsError(
            error instanceof Error ? error.message : "Failed to load models",
          );
          setModelsLoaded(true);
        }
      } finally {
        if (!cancelled) {
          setModelsLoading(false);
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [providerName, modelsLoaded]);

  useInput((input, key) => {
    if (setupStep === "chat") {
      const request = permissionRef.current;
      if (!request) return;

      if (key.return || input.toLowerCase() === "y") {
        request.resolve({
          behavior: "allow",
          updatedInput: request.input,
        });
        permissionRef.current = null;
        setPermission(null);
      }

      if (input.toLowerCase() === "n" || key.escape) {
        request.resolve({ behavior: "deny" });
        permissionRef.current = null;
        setPermission(null);
      }

      return;
    }

    if (setupStep === "model") {
      if (modelsLoading || modelsError || openRouterModels.length === 0) {
        return;
      }

      if (key.upArrow) {
        setSelectionIndex((current) =>
          current === 0 ? openRouterModels.length - 1 : current - 1,
        );
      }

      if (key.downArrow) {
        setSelectionIndex((current) =>
          current === openRouterModels.length - 1 ? 0 : current + 1,
        );
      }

      if (key.return) {
        const selected = openRouterModels[selectionIndex];

        if (selected) {
          setOpenRouterModelId(selected.id);
          setSelectionIndex(0);
        }
      }

      return;
    }

    const options: readonly string[] =
      setupStep === "provider" ? PROVIDERS : MODES;

    if (key.upArrow) {
      setSelectionIndex((current) =>
        current === 0 ? options.length - 1 : current - 1,
      );
    }

    if (key.downArrow) {
      setSelectionIndex((current) =>
        current === options.length - 1 ? 0 : current + 1,
      );
    }

    if (key.return) {
      const selected = options[selectionIndex];

      if (setupStep === "provider") {
        setProviderName(selected as ProviderName);
        setSelectionIndex(0);
      } else {
        setMode(selected as CliMode);
        setSelectionIndex(0);
      }
    }
  });

  const requestPermission = (
    toolName: string,
    input: Record<string, string>,
  ): Promise<PermissionResult> => {
    return new Promise((resolve) => {
      const request = { toolName, input, resolve };
      permissionRef.current = request;
      setPermission(request);
    });
  };

  async function syncConversation(): Promise<void> {
    if (!cloudClient.isLoggedIn) {
      console.error("[Cloud Sync] Not logged in; skipping conversation sync.");
      return;
    }

    try {
      const firstUserMessage = session.messages.find(
        (message) => message.role === "user",
      );

      await cloudClient.saveSession({
        localSessionId: session.id,
        title: firstUserMessage?.content.slice(0, 80) || "ANAS CLI session",
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

  async function handleSubmit(value: string) {
    if (busy || !provider || !mode) return;

    const command = handleCommand(value, mode);

    if (command.type === "exit") {
      process.exit(0);
    }

    if (command.type === "help") {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: command.output },
      ]);
      return;
    }

    if (command.type === "mode") {
      setMode(command.mode);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Mode switched to: ${command.mode}`,
        },
      ]);
      return;
    }

    setBusy(true);
    setStatus("Thinking...");
    setUsage(null);

    const userMessage: Message = { role: "user", content: value };

    setMessages((current) => [...current, userMessage]);
    addMessage(session, userMessage);

    let assistantContent = "";

    try {
      await loadCloudMemory(session.memory);

      if (cloudClient.isLoggedIn) {
        try {
          await cloudClient.saveSession({
            localSessionId: session.id,
            title: value.slice(0, 80),
            workingDirectory: process.cwd(),
          });

          const storedUserMessage =
            session.messages[session.messages.length - 1];

          if (storedUserMessage) {
            storedUserMessage.localMessageId ??= crypto.randomUUID();

            await cloudClient.saveMessage(session.id, {
              localMessageId: storedUserMessage.localMessageId,
              role: storedUserMessage.role,
              content: storedUserMessage.content,
              toolCallId: storedUserMessage.toolCallId,
              toolCall: storedUserMessage.toolCall,
              toolCalls: storedUserMessage.toolCalls,
            });
          }
        } catch (error) {
          console.error(
            "[Cloud Sync] Failed to save the user message:",
            error instanceof Error ? error.message : error,
          );
        }
      } else {
        console.error(
          "[Cloud Sync] Not logged in; user message was not synced.",
        );
      }

      await runAgentLoop(
        value,
        provider,
        session,
        (chunk) => {
          setStatus("");
          assistantContent += chunk;

          setMessages((current) => {
            const lastMessage = current[current.length - 1];

            if (lastMessage?.role === "assistant") {
              return [
                ...current.slice(0, -1),
                { role: "assistant", content: assistantContent },
              ];
            }

            return [
              ...current,
              { role: "assistant", content: assistantContent },
            ];
          });
        },
        (nextStatus) => setStatus(nextStatus),
        "",
        false,
        mode,
        requestPermission,
        (inputTokens, outputTokens, cost) =>
          setUsage({ inputTokens, outputTokens, cost }),
      );
    } catch (error) {
      console.error(
        "[ANAS CLI] Request failed:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      await syncConversation();

      setBusy(false);
      setStatus("");
      setPermission(null);
      permissionRef.current = null;
    }
  }

  if (setupStep !== "chat") {
    const options: readonly string[] =
      setupStep === "provider" ? PROVIDERS : MODES;

    return (
      <Box flexDirection="column" borderStyle="round" padding={1}>
        <Header />

        <Box marginTop={1} flexDirection="column">
          <Text bold>
            {setupStep === "provider"
              ? "Choose a provider:"
              : setupStep === "model"
                ? "Choose an OpenRouter model:"
                : "Choose a mode:"}
          </Text>

          {setupStep === "model" && modelsLoading && (
            <Box marginTop={1}>
              <Text dimColor>Loading available models...</Text>
            </Box>
          )}

          {setupStep === "model" && modelsError && (
            <Box marginTop={1} flexDirection="column">
              <Text color="red">Failed to load models: {modelsError}</Text>
              <Text dimColor>
                Check your internet connection and restart ANAS CLI.
              </Text>
            </Box>
          )}

          {setupStep === "model" &&
            !modelsLoading &&
            !modelsError &&
            openRouterModels.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                {openRouterModels.map((model, index) => (
                  <Box key={model.id} flexDirection="column" marginBottom={1}>
                    <Text>
                      {index === selectionIndex ? "❯ " : "  "}
                      {model.name} {model.isFree ? "(Free)" : ""}
                    </Text>

                    <Text dimColor>
                      {"    "}Input: {formatPrice(model.promptPrice)} · Output:{" "}
                      {formatPrice(model.completionPrice)}
                    </Text>

                    <Text dimColor>
                      {"    "}
                      {model.id}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}

          {setupStep !== "model" && (
            <Box marginTop={1} flexDirection="column">
              {options.map((option, index) => (
                <Text key={option}>
                  {index === selectionIndex ? "❯ " : "  "}
                  {option}
                </Text>
              ))}
            </Box>
          )}

          {setupStep === "model" &&
          (modelsLoading ||
            modelsError ||
            openRouterModels.length === 0) ? null : (
            <Box marginTop={1}>
              <Text dimColor>↑ ↓ select · Enter confirm</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Header />

      <Chat messages={messages} status={status} />

      {usage && (
        <Box marginTop={1}>
          <Text dimColor>
            Tokens: {usage.inputTokens} in · {usage.outputTokens} out · $
            {usage.cost.toFixed(6)}
          </Text>
        </Box>
      )}

      {permission && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Permission Required</Text>
          <Text>{permission.toolName}:</Text>
          <Text>{JSON.stringify(permission.input, null, 2)}</Text>
          <Text>Allow? (y/n)</Text>
        </Box>
      )}

      {!busy && !permission && <Input onSubmit={handleSubmit} />}
    </Box>
  );
}

render(<App />);
