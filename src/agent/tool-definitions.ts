import type { CliMode } from "./modes.js";

export const TOOLS = [
  {
    name: "read_file",
    description: "Read the contents of a file",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write or create a file with the given content",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file path to write" },
        content: { type: "string", description: "The content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "bash",
    description: "Run a terminal command",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run" },
      },
      required: ["command"],
    },
  },
  {
    name: "glob",
    description: "Find files matching a glob pattern",
    input_schema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "The file pattern to match" },
      },
      required: ["pattern"],
    },
  },
  {
    name: "list_dir",
    description: "List files and folders in a directory",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The directory path to list" },
      },
      required: ["path"],
    },
  },
  {
    name: "edit_file",
    description: "Edit a specific part of a file by replacing exact text",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file path to edit" },
        oldStr: {
          type: "string",
          description: "The exact text to find and replace",
        },
        newStr: {
          type: "string",
          description: "The new text to replace it with",
        },
      },
      required: ["path", "oldStr", "newStr"],
    },
  },
  {
    name: "git",
    description: "Inspect Git repository state",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["status", "diff", "log", "branch"],
          description: "The Git action to perform",
        },
      },
      required: ["action"],
    },
  },
];

const AGENT_TOOLS = [
  "read_file",
  "write_file",
  "edit_file",
  "bash",
  "glob",
  "list_dir",
  "git",
];

const ASK_TOOLS = ["read_file", "glob", "list_dir"];

const PLAN_TOOLS: string[] = [];

export function getAllowedTools(mode: CliMode): string[] {
  switch (mode) {
    case "agent":
      return AGENT_TOOLS;

    case "ask":
      return ASK_TOOLS;

    case "plan":
      return PLAN_TOOLS;
  }
}

