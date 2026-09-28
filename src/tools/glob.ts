import { glob } from "glob";
import path from "path";
import {
  getWorkspaceRoot,
  isInsideWorkspace,
} from "../utils/workspace-path.js";

export async function globTool(pattern: string): Promise<string> {
  const workspaceRoot = getWorkspaceRoot();

  const isAbsolute = path.isAbsolute(pattern);

  if (isAbsolute) {
    const normalizedPattern = pattern.replace(/\\/g, "/");

    const wildcardIndex = normalizedPattern.search(/[*?[\]{}()!]/);

    const basePath =
      wildcardIndex === -1
        ? normalizedPattern
        : normalizedPattern.slice(0, wildcardIndex);

    const baseDirectory = path.resolve(
      basePath.endsWith("/") ? basePath : path.dirname(basePath),
    );

    if (!isInsideWorkspace(baseDirectory)) {
      return `Error: Path is outside the ANAS workspace and is not allowed: ${pattern}`;
    }

    const relativePattern = path
      .relative(workspaceRoot, normalizedPattern)
      .replace(/\\/g, "/");

    try {
      const files = await glob(relativePattern, {
        cwd: workspaceRoot,
        ignore: "node_modules/**",
        absolute: true,
      });

      if (files.length === 0) return "No files found";

      return files.join("\n");
    } catch (error) {
      return `Error finding files: ${
        error instanceof Error ? error.message : error
      }`;
    }
  }

  try {
    const files = await glob(pattern, {
      cwd: workspaceRoot,
      ignore: "node_modules/**",
      absolute: true,
    });

    if (files.length === 0) return "No files found";

    return files.join("\n");
  } catch (error) {
    return `Error finding files: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
