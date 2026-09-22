export type Plan = {
  steps: string[];
};

export function parsePlan(content: string): Plan | null {
  try {
    const parsed = JSON.parse(content);

    if (
      !parsed ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.some((step: unknown) => typeof step !== "string")
    ) {
      return null;
    }

    return {
      steps: parsed.steps,
    };
  } catch {
    return null;
  }
}
