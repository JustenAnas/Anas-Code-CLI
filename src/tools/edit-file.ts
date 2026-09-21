import { readFile, writeFile } from "fs/promises";
import {
  isProtectedPath,
  allowsRestrictedFileChange,
} from "../agent/guardrails.js";

export async function editFileTool(
  path: string,
  oldStr: string,
  newStr: string,
  userPrompt: string,
): Promise<string> {
  const guardrail = isProtectedPath(path);

  if (!guardrail.allowed && !allowsRestrictedFileChange(userPrompt)) {
    return `Blocked: ${guardrail.reason}`;
  }

  try {
    const content = await readFile(path, "utf-8");

    if (!content.includes(oldStr)) {
      return `Error: Could not find the text to replace in ${path}`;
    }

    const updated = content.replace(oldStr, newStr);
    await writeFile(path, updated, "utf-8");

    const verifiedContent = await readFile(path, "utf-8");

    if (verifiedContent !== updated) {
      return `Error: File verification failed after editing ${path}`;
    }

    return `File edited and verified successfully: ${path}`;
  } catch (error) {
    return `Error editing file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
