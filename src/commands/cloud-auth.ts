import { input, password } from "@inquirer/prompts";
import { config } from "../config/user-config.js";

const DEFAULT_API_URL = "https://anas-cli.vercel.app";

export function getCloudApiUrl(): string {
  return (process.env.ANAS_CLOUD_API_URL?.trim() || DEFAULT_API_URL).replace(
    /\/+$/,
    "",
  );
}

export function isCloudLoggedIn(): boolean {
  return Boolean(config.get("cloudToken"));
}

export async function cloudLogin(): Promise<boolean> {
  try {
    const email = (
      await input({
        message: "ANAS account email:",
        validate: (value) => value.trim().length > 0 || "Email is required.",
      })
    ).trim();

    const userPassword = await password({
      message: "ANAS account password:",
      mask: "*",
      validate: (value) => value.length > 0 || "Password is required.",
    });

    const response = await fetch(`${getCloudApiUrl()}/api/cli/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: userPassword,
      }),
    });

    const result = (await response.json()) as {
      token?: string;
      user?: { email?: string };
      error?: string;
    };

    if (!response.ok || !result.token) {
      console.error(
        `Login failed: ${result.error ?? "Check your credentials."}`,
      );
      return false;
    }

    config.set("cloudToken", result.token);
    config.set("cloudEmail", result.user?.email ?? email);

    console.log(`✓ Logged in to ANAS Cloud as ${config.get("cloudEmail")}.`);

    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      throw error;
    }

    console.error(
      `ANAS Cloud login failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return false;
  }
}

export async function cloudLogout(): Promise<void> {
  config.delete("cloudToken");
  config.delete("cloudEmail");

  console.log("Logged out of ANAS Cloud.");
}
