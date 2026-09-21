import { readdir } from "fs/promises";
import { join } from "path";

const IGNORE = ["node_modules", ".git", "dist", ".next", "build", ".anas-cli"];

async function scanDir(dir: string, depth: number = 0): Promise<string[]> {
  if (depth > 2) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const lines: string[] = [];

  for (const entry of entries) {
    if (IGNORE.includes(entry.name)) continue;
    const indent = "  ".repeat(depth);
    if (entry.isDirectory()) {
      lines.push(`${indent}📁 ${entry.name}/`);
      const children = await scanDir(join(dir, entry.name), depth + 1);
      lines.push(...children);
    } else {
      lines.push(`${indent}📄 ${entry.name}`);
    }
  }

  return lines;
}

export async function buildProjectContext(): Promise<string> {
  try {
    const lines = await scanDir(process.cwd());

    if (lines.length === 0) return "";

    return `\n\nCurrent project structure:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}
