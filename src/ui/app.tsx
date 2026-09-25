
import "dotenv/config";
import React, { useRef, useState } from "react";
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

type PermissionRequest = {
  toolName: string;
  input: Record<string, string>;
  resolve: (result: PermissionResult) => void;
};

const PROVIDERS: ProviderName[] = [
  "openrouter",
  "openai",
  "gemini",
  "claude",
];

const MODES: CliMode[] = ["agent", "ask", "plan"];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [permission, setPermission] =
    useState<PermissionRequest | null>(null);

  const [providerName, setProviderName] =
    useState<ProviderName | null>(null);

  const [mode, setMode] = useState<CliMode | null>(null);
  const [busy, setBusy] = useState(false);

  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    cost: number;
  } | null>(null);

  const historyRef = useRef<Message[]>([]);
  const permissionRef = useRef<PermissionRequest | null>(null);

  const [selectionIndex, setSelectionIndex] = useState(0);

  const setupStep = providerName === null ? "provider" : mode === null ? "mode" : "chat";

  const provider = providerName ? createProvider(providerName) : null;

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
        request.resolve({
          behavior: "deny",
        });

        permissionRef.current = null;
        setPermission(null);
      }

      return;
    }

    const options = setupStep === "provider" ? PROVIDERS : MODES;

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
      const request = {
        toolName,
        input,
        resolve,
      };

      permissionRef.current = request;
      setPermission(request);
    });
  };

  async function handleSubmit(value: string) {
    if (busy || !provider || !mode) return;

    const command = handleCommand(value, mode);

    if (command.type === "exit") {
      process.exit(0);
    }

    if (command.type === "help") {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: command.output,
        },
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

    const userMessage: Message = {
      role: "user",
      content: value,
    };

    setMessages((current) => [...current, userMessage]);
    historyRef.current.push(userMessage);

    let assistantContent = "";

    try {
      await runAgentLoop(
        value,
        provider,
        historyRef.current,
        (chunk) => {
          assistantContent += chunk;

          setStatus("");

          setMessages((current) => {
            const lastMessage = current[current.length - 1];

            if (lastMessage?.role === "assistant") {
              return [
                ...current.slice(0, -1),
                {
                  role: "assistant",
                  content: assistantContent,
                },
              ];
            }

            return [
              ...current,
              {
                role: "assistant",
                content: assistantContent,
              },
            ];
          });
        },
        (status) => {
          setStatus(status);
        },
        "",
        false,
        mode,
        requestPermission,
        (inputTokens, outputTokens, cost) => {
          setUsage({
            inputTokens,
            outputTokens,
            cost,
          });
        },
      );

      if (assistantContent) {
        historyRef.current.push({
          role: "assistant",
          content: assistantContent,
        });
      }
    } finally {
      setBusy(false);
      setStatus("");
      setPermission(null);
      permissionRef.current = null;
    }
  }

  if (setupStep !== "chat") {
    const options = setupStep === "provider" ? PROVIDERS : MODES;

    return (
      <Box flexDirection="column" borderStyle="round" padding={1}>
        <Header />

        <Box marginTop={1} flexDirection="column">
          <Text bold>
            {setupStep === "provider"
              ? "Choose a provider:"
              : "Choose a mode:"}
          </Text>

          <Box marginTop={1} flexDirection="column">
            {options.map((option, index) => (
              <Text key={option}>
                {index === selectionIndex ? "❯ " : "  "}
                {option}
              </Text>
            ))}
          </Box>

          <Box marginTop={1}>
            <Text dimColor>↑ ↓ select · Enter confirm</Text>
          </Box>
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

