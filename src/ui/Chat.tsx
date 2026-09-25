
import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";

type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
};

type ChatProps = {
  messages: Message[];
  status: string;
};

const infinityFrames = [
  "·    ·",
  " ·  · ",
  "  ··  ",
  " ·  · ",
  "·    ·",
  " ·  · ",
  "  ··  ",
  " ·  · ",
];

function InfinityLoader() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((current) => (current + 1) % infinityFrames.length);
    }, 120);

    return () => clearInterval(timer);
  }, []);

  return <Text dimColor>{infinityFrames[frame]}</Text>;
}

export function Chat({ messages, status }: ChatProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <Box key={index} marginTop={1}>
              <Text bold>You: {message.content}</Text>
            </Box>
          );
        }

        if (message.role === "assistant") {
          return (
            <Box key={index} marginTop={1} flexDirection="column">
              <Text bold color="green">
                Assistant
              </Text>

              <Text>{message.content}</Text>
            </Box>
          );
        }

        return (
          <Box key={index} marginTop={1}>
            <InfinityLoader />
            <Text dimColor> {message.content}</Text>
          </Box>
        );
      })}

      {status && (
        <Box marginTop={1}>
          <InfinityLoader />
          <Text dimColor> {status}</Text>
        </Box>
      )}
    </Box>
  );
}

