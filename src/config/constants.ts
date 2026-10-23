import type { CliMode } from "../agent/modes.js";

export const CLI_MODES: CliMode[] = ["agent", "ask", "plan"];

export const MODE_DESCRIPTIONS: Record<CliMode, string> = {
  agent: "Read, edit, and run commands — full agent loop with tools",
  ask: "Read-only exploration — answers without changing files",
  plan: "Explore and propose a plan — no file edits applied",
};

export const SLASH_COMMANDS = [
  {
    command: "/mode agent|ask|plan",
    description: "Switch permission mode mid-session",
  },
  { command: "/help", description: "Show slash commands" },
  { command: "/context", description: "Show context window usage" },
  { command: "/exit", description: "End the chat session" },
   { command: "/new", description: "Start a new session" },
  { command: "/history", description: "List saved sessions" },
  { command: "/resume", description: "Resume a previous session" },
  { command: "/paste", description: "Write a prompt in Notepad" },
] as const;
