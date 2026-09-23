
import "dotenv/config";
import React, { useRef, useState } from "react";
import { render, Box, Text, useInput } from "ink";
import { Header } from "./Header.js";
import { Chat } from "./Chat.js";
import { Input } from "./Input.js";
import { runAgentLoop } from "../agent/loop.js";
import { createProvider } from "../providers/factory.js";
import type { Message } from "../providers/base.js";
import type { PermissionResult } from "../agent/permission.js";

type PermissionRequest = {
  toolName: string;
  input: Record<string, string>;
  resolve: (result: PermissionResult) => void;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [permission, setPermission] = useState<PermissionRequest | null>(null);

  const historyRef = useRef<Message[]>([]);
  const permissionRef = useRef<PermissionRequest | null>(null);

  const provider = createProvider("openai");

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

  
  useInput((input, key) => {
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
  });



  async function handleSubmit(value: string) {
    const userMessage: Message = {
      role: "user",
      content: value,
    };

    setMessages((current) => [...current, userMessage]);
    historyRef.current.push(userMessage);

    let assistantContent = "";

    await runAgentLoop(
      value,
      provider,
      historyRef.current,
      (chunk) => {
        assistantContent += chunk;

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
      "agent",
      requestPermission,
    );

    if (assistantContent) {
      historyRef.current.push({
        role: "assistant",
        content: assistantContent,
      });
    }
  }

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Header />

      <Chat messages={messages} />

      {status && !permission && (
        <Box marginTop={1}>
          <Text dimColor>{status}</Text>
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

      {!permission && <Input onSubmit={handleSubmit} />}
    </Box>
  );
}

render(<App />);

