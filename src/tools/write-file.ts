
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import {
  isProtectedPath,
  allowsRestrictedFileChange,
} from "../agent/guardrails.js";

export async function writeFileTool(
  path: string,
  content: string,
  userPrompt: string
): Promise<string> {
  const guardrail = isProtectedPath(path);

  if (!guardrail.allowed && !allowsRestrictedFileChange(userPrompt)) {
    return `Blocked: ${guardrail.reason}`;
  }

  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");

    return `File written successfully: ${path}`;
  } catch (error) {
    return `Error writing file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}

