import { execa } from "execa";

export async function bashTool(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execa("cmd", ["/c", command], {
      cwd: process.cwd(),
    });
    return stdout || stderr;
  } catch (error) {
    return `Error running command: ${error instanceof Error ? error.message : error}`;
  }
}