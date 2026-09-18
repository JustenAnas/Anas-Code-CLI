import { execa } from "execa";

type GitAction = "status" | "diff" | "log" | "branch";

export async function gitTool(action: GitAction): Promise<string> {
  const commands: Record<GitAction, string[]> = {
    status: ["status"],
    diff: ["diff"],
    log: ["log", "--oneline", "-10"],
    branch: ["branch"],
  };

  try {
    const { stdout, stderr } = await execa("git", commands[action], {
      cwd: process.cwd(),
    });

    return stdout || stderr || "No output.";
  } catch (error) {
    return `Error running git ${action}: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}

