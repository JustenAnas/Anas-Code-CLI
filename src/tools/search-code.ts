import { readFile } from "fs/promises";
import { glob } from "glob";

const IGNORE_PATTERNS = [
  "node_modules/**",
  ".git/**",
  ".next/**",
  "dist/**",
  "build/**",
  "target/**",
  "bin/**",
  "obj/**",
  "vendor/**",
  "coverage/**",
];

const MAX_FILE_SIZE = 1_000_000;
const MAX_RESULTS = 100;

export async function searchCodeTool(query: string): Promise<string> {
  if (!query.trim()) {
    return "Error: Search query cannot be empty.";
  }

  try {
    const files = await glob("**/*", {
      ignore: IGNORE_PATTERNS,
      nodir: true,
      dot: false,
    });

    const results: string[] = [];
    const searchQuery = query.toLowerCase();

    for (const file of files) {
      try {
        const content = await readFile(file, "utf-8");

        if (Buffer.byteLength(content, "utf-8") > MAX_FILE_SIZE) {
          continue;
        }

        const lines = content.split(/\r?\n/);

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchQuery)) {
            results.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });

        if (results.length >= MAX_RESULTS) {
          return results.slice(0, MAX_RESULTS).join("\n");
        }
      } catch {
        // Skip binary, unreadable, or invalid text files.
      }
    }

    if (results.length === 0) {
      return `No matches found for "${query}".`;
    }

    return results.join("\n");
  } catch (error) {
    return `Error searching code: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

