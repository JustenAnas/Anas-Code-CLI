import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

export async function writeFileTool(path: string, content: string): Promise<string> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
    return `File written successfully: ${path}`;
  } catch (error) {
    return `Error writing file: ${error instanceof Error ? error.message : error}`;
  }
}