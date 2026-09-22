import { readFileTool } from "../tools/read-file.js";
import { writeFileTool } from "../tools/write-file.js";
import { bashTool } from "../tools/bash.js";
import { globTool } from "../tools/glob.js";
import { listDirTool } from "../tools/list-dir.js";
import { editFileTool } from "../tools/edit-file.js";
import { gitTool } from "../tools/git.js";
import { promptBeforeToolUse } from "./permission.js";
import {
  isProtectedPath,
  allowsRestrictedFileChange,
  isDestructiveCommand,
} from "./guardrails.js";
import { searchCodeTool } from "../tools/search-code.js";

export async function executeTool(
  name: string,
  input: Record<string, string>,
  userPrompt: string,
  deniedToolCalls: Set<string>,
  failedToolCalls: Map<string, number>,
): Promise<string> {
  const toolSignature = `${name}:${JSON.stringify(input)}`;

  const failureCount = failedToolCalls.get(toolSignature) ?? 0;

  if (failureCount >= 3) {
    return "Blocked: This exact tool operation has failed 3 times. Do not retry it.";
  }

  if (deniedToolCalls.has(toolSignature)) {
    return "Blocked: User already denied this exact tool operation. Do not retry it.";
  }

  // Guard restricted file changes before asking for permission.
  if (name === "write_file" || name === "edit_file") {
    const guardrail = isProtectedPath(input.path);

    if (!guardrail.allowed && !allowsRestrictedFileChange(userPrompt)) {
      return `Blocked: ${guardrail.reason}`;
    }
  }

  if (name === "bash") {
    const guardrail = isDestructiveCommand(input.command);

    if (!guardrail.allowed) {
      return `Blocked: ${guardrail.reason}`;
    }
  }

  const permission = await promptBeforeToolUse(name, input);

  if (permission.behavior === "deny") {
    deniedToolCalls.add(toolSignature);
    return permission.message;
  }

  let result: string;

  switch (name) {
    case "read_file":
      result = await readFileTool(input.path);
      break;

    case "write_file":
      result = await writeFileTool(input.path, input.content, userPrompt);
      break;

    case "bash":
      result = await bashTool(input.command);
      break;

    case "glob":
      result = await globTool(input.pattern);
      break;

    case "list_dir":
      result = await listDirTool(input.path);
      break;

    case "edit_file":
      result = await editFileTool(
        input.path,
        input.oldStr,
        input.newStr,
        userPrompt,
      );
      break;

    case "git":
      result = await gitTool(
        input.action as "status" | "diff" | "log" | "branch",
      );
      break;
    case "search_code":
      result = await searchCodeTool(input.query);
      break;

    default:
      return `Unknown tool: ${name}`;
  }

  if (result.startsWith("Error")) {
    const failureCount = failedToolCalls.get(toolSignature) ?? 0;

    failedToolCalls.set(toolSignature, failureCount + 1);

    if (failureCount + 1 >= 3) {
      return "Blocked: This exact tool operation has failed 3 times. Do not retry it.";
    }
  }

  return result;
}
