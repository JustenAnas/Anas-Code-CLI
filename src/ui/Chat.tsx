
import React from "react";
import { Box, Text } from "ink";

type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
};

type ChatProps = {
  messages: Message[];
};

export function Chat({ messages }: ChatProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {messages.map((message, index) => (
        <Text key={index}>
          {message.role === "user"
  ? "You"
  : message.role === "assistant"
    ? "Assistant"
    : "Tool"}: {message.content}
        </Text>
      ))}
    </Box>
  );
}

