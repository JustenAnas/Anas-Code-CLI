import { readFile } from "fs/promises";
import { redactSecrets } from "../agent/guardrails.js";

export async function readFileTool(path: string): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");

    // Allow configuration inspection without exposing secrets.
    return redactSecrets(content);
  } catch (error) {
    return `Error reading file: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
