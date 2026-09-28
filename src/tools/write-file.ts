import { writeFile, mkdir, readFile } from "fs/promises";
import { dirname } from "path";
import {
  isProtectedPath,
  allowsRestrictedFileChange,
} from "../agent/guardrails.js";
import {
  resolveWorkspacePath,
  isInsideWorkspace,
} from "../utils/workspace-path.js";

export async function writeFileTool(
  inputPath: string,
  content: string,
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
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf-8");

    const verifiedContent = await readFile(filePath, "utf-8");

    if (verifiedContent !== content) {
      return `Error: File verification failed after writing ${filePath}`;
    }

    return `File written and verified successfully: ${filePath}`;
  } catch (error) {
    return `Error writing file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
