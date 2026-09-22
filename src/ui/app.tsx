import "dotenv/config";
import React, { useState } from "react";
import { render, Box } from "ink";
import { Header } from "./Header.js";
import { Chat } from "./Chat.js";
import { Input } from "./Input.js";
import { runAgentLoop } from "../agent/loop.js";
import { createProvider } from "../providers/factory.js";
import type { Message } from "../providers/base.js";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const provider = createProvider("openai");

  async function handleSubmit(value: string) {
    setMessages((current) => [
      ...current,
      { role: "user", content: value },
    ]);

    let assistantContent = "";

    await runAgentLoop(
      value,
      provider,
      messages,
      (chunk) => {
        assistantContent += chunk;

        setMessages((current) => {
          const withoutLastAssistant = current.filter(
            (message) => message.role !== "assistant",
          );

          return [
            ...withoutLastAssistant,
            { role: "assistant", content: assistantContent },
          ];
        });
      },
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Header />

      <Chat messages={messages} />

      <Input onSubmit={handleSubmit} />
    </Box>
  );
}

render(<App />);

