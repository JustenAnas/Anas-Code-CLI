import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "../config/user-config.js";

const DEFAULT_API_URL = "http://localhost:3000";

export async function cloudLogin() {
const terminal = createInterface({ input: stdin, output: stdout });

try {
const email = (await terminal.question("Website email: ")).trim();
const password = await terminal.question("Website password: ");


const response = await fetch(`${DEFAULT_API_URL}/api/cli/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const result = (await response.json()) as {
  token?: string;
  user?: { email?: string };
  error?: string;
};

if (!response.ok || !result.token) {
  console.log(`Login failed: ${result.error ?? "Check your credentials."}`);
  return;
}

config.set("cloudToken", result.token);
config.set("cloudEmail", result.user?.email ?? email);

console.log(`Logged in to ANAS Cloud as ${config.get("cloudEmail")}.`);


} catch {
console.log(
"Couldn't connect to ANAS Cloud. Make sure the website server is running.",
);
} finally {
terminal.close();
}
}

export async function cloudLogout() {
config.delete("cloudToken");
config.delete("cloudEmail");
console.log("Logged out of ANAS Cloud.");
}
