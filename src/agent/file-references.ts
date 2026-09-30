import { readFileTool } from "../tools/read-file.js";

const FILE_REFERENCE_REGEX = /@([^\s"'`]+)/g;

export async function resolveFileReferences(prompt: string): Promise<string> {
  const references = [...prompt.matchAll(FILE_REFERENCE_REGEX)];

  if (references.length === 0) {
    return prompt;
  }

  const files = new Map<string, string>();

  for (const match of references) {
    const filePath = match[1];

    if (!filePath) continue;

    const content = await readFileTool(filePath);

    if (content.startsWith("Error")) {
      continue;
    }

    files.set(filePath, content);
  }

  if (files.size === 0) {
    return prompt;
  }

  const attachments = [...files.entries()]
    .map(
      ([filePath, content]) =>
        `\n[Attached file: ${filePath}]\n${content}\n[End attached file]`,
    )
    .join("\n");

  return `${prompt}\n${attachments}`;
}
