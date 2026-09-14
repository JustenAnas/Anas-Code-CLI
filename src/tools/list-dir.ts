import { readdir } from "fs/promises";

export async function listDirTool(path: string): Promise<string> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const result = entries.map((entry) => {
      return entry.isDirectory() ? `📁 ${entry.name}/` : `📄 ${entry.name}`;
    });
    return result.join("\n");
  } catch (error) {
    return `Error listing directory: ${error instanceof Error ? error.message : error}`;
  }
}