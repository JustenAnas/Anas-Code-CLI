import { readFile, writeFile } from "fs/promises";

export async function editFileTool(
  path: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    
    if (!content.includes(oldStr)) {
      return `Error: Could not find the text to replace in ${path}`;
    }
    
    const updated = content.replace(oldStr, newStr);
    await writeFile(path, updated, "utf-8");
    
    return `File edited successfully: ${path}`;
  } catch (error) {
    return `Error editing file: ${error instanceof Error ? error.message : error}`;
  }
}