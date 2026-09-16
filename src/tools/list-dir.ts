import { readdir } from "fs/promises";

export async function listDirTool(path: string): Promise<string> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    if (entries.length === 0) return "Directory is empty";
    const result = entries.map((entry) => {
      const fullPath = `${path}/${entry.name}`;
      return entry.isDirectory() ? `📁 ${fullPath}/` : `📄 ${fullPath}`;
    });
    return result.join("\n");
  } catch (error) {
    return `Error listing directory: ${error instanceof Error ? error.message : error}`;
  }
}