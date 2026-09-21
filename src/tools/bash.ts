 
import { execa } from "execa";

export async function bashTool(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execa("cmd", ["/c", command], {
      cwd: process.cwd(),
    });

    return [
      "Command succeeded.",
      stdout ? `stdout:\n${stdout}` : "",
      stderr ? `stderr:\n${stderr}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } catch (error) {
    if (error && typeof error === "object" && "exitCode" in error) {
      const commandError = error as {
        exitCode?: number;
        stdout?: string;
        stderr?: string;
      };

      return [
        `Command failed with exit code ${commandError.exitCode ?? "unknown"}.`,
        commandError.stdout ? `stdout:\n${commandError.stdout}` : "",
        commandError.stderr ? `stderr:\n${commandError.stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return `Error running command: ${
      error instanceof Error ? error.message : error
    }`;
  }
}
 
