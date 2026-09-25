import { SLASH_COMMANDS } from "../config/constants.js";
import type { CliMode } from "../agent/modes.js";

export type CommandResult =
  | { type: "exit" }
  | { type: "help"; output: string }
  | { type: "mode"; mode: CliMode }
  | { type: "not-command" };

export function handleCommand(
  input: string,
  currentMode: CliMode,
): CommandResult {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return { type: "not-command" };
  }

  if (trimmed === "/exit") {
    return { type: "exit" };
  }

  if (trimmed === "/help") {
    const output = [
      "Slash commands:",
      ...SLASH_COMMANDS.map(
        ({ command, description }) =>
          `  ${command.padEnd(22)} ${description}`,
      ),
    ].join("\n");

    return {
      type: "help",
      output,
    };
  }

  if (trimmed.startsWith("/mode ")) {
    const requestedMode = trimmed.slice(6).trim();

    if (
      requestedMode !== "agent" &&
      requestedMode !== "ask" &&
      requestedMode !== "plan"
    ) {
      return {
        type: "help",
        output: "Invalid mode. Use: agent, ask, or plan.",
      };
    }

    return {
      type: "mode",
      mode: requestedMode,
    };
  }

  return {
    type: "help",
    output: `Unknown command: ${trimmed}\n\nType /help to see available commands.`,
  };
}