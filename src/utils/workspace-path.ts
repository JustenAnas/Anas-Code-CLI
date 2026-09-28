import path from "path";

const WORKSPACE_ROOT = path.resolve(process.cwd());

export function resolveWorkspacePath(inputPath: string): string {
  return path.resolve(WORKSPACE_ROOT, inputPath);
}

export function isInsideWorkspace(targetPath: string): boolean {
  const resolvedPath = path.resolve(targetPath);

  return (
    resolvedPath === WORKSPACE_ROOT ||
    resolvedPath.startsWith(WORKSPACE_ROOT + path.sep)
  );
}

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}
