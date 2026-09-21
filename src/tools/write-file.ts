
import { writeFile, mkdir, readFile } from "fs/promises";
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

    const verifiedContent = await readFile(path, "utf-8");

    if (verifiedContent !== content) {
      return `Error: File verification failed after writing ${path}`;
    }

    return `File written and verified successfully: ${path}`;
  } catch (error) {
    return `Error writing file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}

