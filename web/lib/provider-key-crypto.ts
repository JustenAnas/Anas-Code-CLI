import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getEncryptionKey(): Buffer {
  const value = process.env.PROVIDER_KEYS_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "PROVIDER_KEYS_ENCRYPTION_KEY must be a 64-character hexadecimal string.",
    );
  }

  return Buffer.from(value, "hex");
}

// Encrypt an API key before saving it in Neon.
export function encryptProviderKey(apiKey: string): string {
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

// Decrypt an API key on the ANAS backend when needed.
export function decryptProviderKey(payload: string): string {
  const parts = payload.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted API key format.");
  }

  const [, ivEncoded, tagEncoded, encryptedEncoded] = parts;

  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted API key data.");
  }

  const iv = Buffer.from(ivEncoded, "base64url");
  const authTag = Buffer.from(tagEncoded, "base64url");
  const encrypted = Buffer.from(encryptedEncoded, "base64url");

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error("Invalid encrypted API key metadata.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
