import { readFile, writeFile } from "fs/promises";
import {
  isProtectedPath,
  allowsRestrictedFileChange,
} from "../agent/guardrails.js";
import {
  resolveWorkspacePath,
  isInsideWorkspace,
} from "../utils/workspace-path.js";

export async function editFileTool(
  inputPath: string,
  oldStr: string,
  newStr: string,
  userPrompt: string,
): Promise<string> {
  const filePath = resolveWorkspacePath(inputPath);

  if (!isInsideWorkspace(filePath)) {
    return `Error: Path is outside the ANAS workspace and is not allowed: ${inputPath}`;
  }

  const guardrail = isProtectedPath(filePath);

  if (!guardrail.allowed && !allowsRestrictedFileChange(userPrompt)) {
    return `Blocked: ${guardrail.reason}`;
  }

  try {
    const content = await readFile(filePath, "utf-8");

    if (!content.includes(oldStr)) {
      return `Error: Could not find the text to replace in ${filePath}`;
    }

    const updated = content.replace(oldStr, newStr);
    await writeFile(filePath, updated, "utf-8");

    const verifiedContent = await readFile(filePath, "utf-8");

    if (verifiedContent !== updated) {
      return `Error: File verification failed after editing ${filePath}`;
    }

    return `File edited and verified successfully: ${filePath}`;
  } catch (error) {
    return `Error editing file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
