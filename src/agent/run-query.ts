import chalk from "chalk";
import { GeminiProvider } from "../providers/gemini.js";

const provider = new GeminiProvider(process.env.GEMINI_API_KEY ?? "");

export async function runQuery(prompt: string, options: { verbose?: boolean } = {}) {
  try {
    await provider.streamMessage(
      [{ role: "user", content: prompt }],
      (chunk) => process.stdout.write(chunk)
    );
    console.log();
  } catch (error) {
    console.error(chalk.red("Error: "), error);
  }
}