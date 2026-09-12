export type CliMode = "agent" | "ask" | "plan";

export function parseCliMode(value: string): CliMode | null {
  if (value === "agent" || value === "ask" || value === "plan") {
    return value;
  }
  return null;
}