import { readdir } from "fs/promises";
import path from "path";
import {
  resolveWorkspacePath,
  isInsideWorkspace,
} from "../utils/workspace-path.js";

export async function listDirTool(inputPath: string): Promise<string> {
  const dirPath = resolveWorkspacePath(inputPath);

  if (!isInsideWorkspace(dirPath)) {
    return `Error: Path is outside the ANAS workspace and is not allowed: ${inputPath}`;
  }

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    if (entries.length === 0) return "Directory is empty";

    const result = entries.map((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      return entry.isDirectory() ? `📁 ${fullPath}\\` : `📄 ${fullPath}`;
    });

    return result.join("\n");
  } catch (error) {
    return `Error listing directory: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
