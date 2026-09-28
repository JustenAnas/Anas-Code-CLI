import { readFile } from "fs/promises";
import { redactSecrets } from "../agent/guardrails.js";
import {
  resolveWorkspacePath,
  isInsideWorkspace,
} from "../utils/workspace-path.js";

export async function readFileTool(inputPath: string): Promise<string> {
  const filePath = resolveWorkspacePath(inputPath);

  if (!isInsideWorkspace(filePath)) {
    return `Error: Path is outside the ANAS workspace and is not allowed: ${inputPath}`;
  }

  try {
    const content = await readFile(filePath, "utf-8");

    // Allow configuration inspection without exposing secrets.
    return redactSecrets(content);
  } catch (error) {
    return `Error reading file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
