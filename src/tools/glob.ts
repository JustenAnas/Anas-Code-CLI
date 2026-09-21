import { glob } from "glob";

export async function globTool(pattern: string): Promise<string> {
  try {
    const files = await glob(pattern, { ignore: "node_modules/**" });
    if (files.length === 0) return "No files found";
    return files.join("\n");
  } catch (error) {
    return `Error finding files: ${error instanceof Error ? error.message : error}`;
  }
}
