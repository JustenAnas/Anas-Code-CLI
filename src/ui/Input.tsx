import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

type InputProps = {
  onSubmit: (value: string) => void;
};

export function Input({ onSubmit }: InputProps) {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.return) {
      if (!value.trim()) return;

      onSubmit(value);
      setValue("");
      return;
    }

    if (key.backspace || key.delete) {
      setValue((current) => current.slice(0, -1));
      return;
    }

    setValue((current) => current + input);
  });

  return (
    <Box marginTop={1}>
      <Text>You: &gt; {value}</Text>
    </Box>
  );
}