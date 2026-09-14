import { readFile } from "fs/promises";

export async function readFileTool(path: string): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    return content;
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : error}`;
  }
}