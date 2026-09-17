import type { BaseProvider, Message } from "../providers/base.js";
import { readFileTool } from "../tools/read-file.js";
import { writeFileTool } from "../tools/write-file.js";
import { bashTool } from "../tools/bash.js";
import { globTool } from "../tools/glob.js";
import { parseToolCall } from "./tool-parser.js";
import { listDirTool } from "../tools/list-dir.js";
import { editFileTool } from "../tools/edit-file.js";
import { fmt } from "../ui/format.js";

export const SYSTEM_PROMPT = `You are an AI coding assistant with access to the following tools:

- read_file(path): Read a file's contents
- write_file(path, content): Create or overwrite a file
- edit_file(path, oldStr, newStr): Edit a specific part of a file by replacing exact text — use this instead of write_file when modifying existing files
- bash(command): Run a terminal command
- glob(pattern): Find files matching a pattern
- list_dir(path): List files in a directory

IMPORTANT: The bash tool runs on Windows CMD, not Linux or Unix.
- Use Windows CMD-compatible commands only.
- Do not use Unix/Linux flags such as "mkdir -p".
- For creating directories, use "mkdir folder\\subfolder".
- For paths in bash commands, use Windows-compatible paths such as "agent-test\\test-folder".
- Do not use "./" paths inside bash commands.
- The ./ path format is still required for read_file, write_file, edit_file, glob, and list_dir.

When you need to use a tool, use the provided tool directly.
Do not write tool calls as text, XML, JSON, or <tool_call> tags.
Use only one tool call at a time.
After the tool result is returned, continue with the task.

Always use relative paths starting with ./ (e.g. ./folder/file.ts), never absolute paths starting with /.
For bash commands, follow the Windows CMD rules above.

When working on a folder structure:
- First explore with list_dir and glob
- Create new files with write_file
- Modify existing files with edit_file, never rewrite the whole file unless necessary
- Read files after writing to verify correctness
- Use bash only when needed (installing packages, creating directories)
- After everything is done, read all files and fix anything incorrect

When you are done with all tool calls, give your final response normally. Be concise and clear.

If a tool returns an error, do not invent a result.
Do not create, modify, or delete anything unless the user explicitly asked for it or it is necessary to complete the user's request.
If read_file says a file does not exist and the user only asked to read it, report that the file does not exist. Do not create it.
`;

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
        oldStr: { type: "string", description: "The exact text to find and replace" },
        newStr: { type: "string", description: "The new text to replace it with" },
      },
      required: ["path", "oldStr", "newStr"],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, string>,
): Promise<string> {
  switch (name) {
    case "read_file":
      return readFileTool(input.path);
    case "write_file":
      return writeFileTool(input.path, input.content);
    case "bash":
      return bashTool(input.command);
    case "glob":
      return globTool(input.pattern);
    case "list_dir":
      return listDirTool(input.path);
    case "edit_file":
      return editFileTool(input.path, input.oldStr, input.newStr);
    default:
      return `Unknown tool: ${name}`;
  }
}

export async function runAgentLoop(
  prompt: string,
  provider: BaseProvider,
  history: Message[],
  onChunk: (chunk: string) => void,
  context: string = "",
  verbose: boolean = false,
): Promise<void> {
  history.push({ role: "user", content: prompt });

  const MAX_ITERATIONS = 20;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response;

    try {
      const fullSystemPrompt = context
        ? `${SYSTEM_PROMPT}${context}`
        : SYSTEM_PROMPT;

      response = await provider.sendMessage(history, fullSystemPrompt);

      if (response.content) onChunk(response.content);

      if (verbose && response.inputTokens) {
        onChunk(fmt.dim(`\n[Tokens: ${response.inputTokens} in, ${response.outputTokens} out]\n`));
      }
    } catch (error) {
      throw error;
    }

    // Native tool calling
    if (response.toolCall) {
      const toolCall = response.toolCall;

      onChunk(`\n[Using tool: ${toolCall.name}]\n`);

      history.push({
        role: "assistant",
        content: response.content,
        toolCall,
      });

      try {
        const toolResult = await executeTool(toolCall.name, toolCall.input);

        onChunk(`\n[Tool: ${toolCall.name}] → ${toolResult}\n`);

        history.push({
          role: "tool",
          content: toolResult,
          toolCallId: toolCall.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        onChunk(`\n[Tool Error] → ${errorMessage}\n`);

        history.push({
          role: "tool",
          content: `Tool error: ${errorMessage}`,
          toolCallId: toolCall.id,
        });
      }

      continue;
    }

    // Text-based fallback for providers without native tools
    const toolCall = parseToolCall(response.content);

    if (toolCall?.invalid) {
      history.push({
        role: "user",
        content:
          "Your response contained multiple tool calls. Please use ONLY ONE tool call in your response. Do not provide tool results yourself. Wait for the actual tool result before continuing.",
      });

      continue;
    }

    if (!toolCall) {
      history.push({
        role: "assistant",
        content: response.content,
      });

      break;
    }

    onChunk(`\n[Using tool: ${toolCall.name}]\n`);

    history.push({
      role: "assistant",
      content: `<tool_call>${JSON.stringify(toolCall)}</tool_call>`,
    });

    try {
      const toolResult = await executeTool(toolCall.name, toolCall.input);

      if (toolResult.startsWith("Error ")) {
        history.push({
          role: "user",
          content: `Tool error: ${toolResult}. Fix the tool call and try again.`,
        });

        continue;
      }

      onChunk(`\n[Tool: ${toolCall.name}] → ${toolResult}\n`);

      history.push({
        role: "user",
        content: `Tool result: ${toolResult}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      onChunk(`\n[Tool Error] → ${errorMessage}\n`);

      history.push({
        role: "user",
        content: `Tool error: ${errorMessage}. Please try again.`,
      });
    }
  }
}