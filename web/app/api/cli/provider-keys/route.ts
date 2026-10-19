
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { currentCliUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptProviderKey } from "@/lib/provider-key-crypto";

export const runtime = "nodejs";

const PROVIDERS = [
  "claude",
  "openai",
  "gemini",
  "openrouter",
  "groq",
] as const;

type Provider = (typeof PROVIDERS)[number];

function isProvider(value: unknown): value is Provider {
  return typeof value === "string" &&
    PROVIDERS.includes(value as Provider);
}

function getEncryptionKey(): Buffer {
  const value = process.env.PROVIDER_KEYS_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "PROVIDER_KEYS_ENCRYPTION_KEY must be a 64-character hex string.",
    );
  }

  return Buffer.from(value, "hex");
}

function encryptKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptKey(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");

  if (
    version !== "v1" ||
    !iv ||
    !tag ||
    !ciphertext
  ) {
    throw new Error("Invalid encrypted API key format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  return currentCliUser(token);
}

function response(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// Check which providers have saved API keys.
// Does not expose the actual keys.
export async function GET(request: Request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return response({ error: "Unauthorized" }, 401);
    }

    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    if (provider && !isProvider(provider)) {
      return response({ error: "Invalid provider" }, 400);
    }

    if (provider) {
      const saved = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: {
            userId: user._id.toString(),
            provider,
          },
        },
        select: {
          provider: true,
          updatedAt: true,
        },
      });

      return response({
        provider,
        exists: Boolean(saved),
        updatedAt: saved?.updatedAt ?? null,
      });
    }

    const savedKeys = await prisma.userProviderKey.findMany({
      where: {
        userId: user._id.toString(),
      },
      select: {
        provider: true,
        updatedAt: true,
      },
    });

    return response({
      providers: savedKeys,
    });
  } catch (error) {
    console.error("[Provider Keys GET]", error);

    return response(
      { error: "Failed to load provider keys" },
      500,
    );
  }
}

// Save or replace a provider API key.
export async function PUT(request: Request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return response({ error: "Unauthorized" }, 401);
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      !isProvider(body.provider) ||
      typeof body.apiKey !== "string"
    ) {
      return response(
        { error: "Provider and API key are required" },
        400,
      );
    }

    const apiKey = body.apiKey.trim();

    if (!apiKey || apiKey.length > 4096) {
      return response(
        { error: "Invalid API key length" },
        400,
      );
    }

   const encryptedKey = encryptProviderKey(apiKey);
    const userId = user._id.toString();

    await prisma.userProviderKey.upsert({
      where: {
        userId_provider: {
          userId,
          provider: body.provider,
        },
      },
      create: {
        userId,
        provider: body.provider,
        encryptedKey,
      },
      update: {
        encryptedKey,
      },
    });

    return response({
      success: true,
      provider: body.provider,
      message: "API key saved securely",
    });
  } catch (error) {
    console.error("[Provider Keys PUT]", error);

    return response(
      { error: "Failed to save provider key" },
      500,
    );
  }
}

// Remove a previously saved API key.
export async function DELETE(request: Request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return response({ error: "Unauthorized" }, 401);
    }

    const provider = new URL(request.url).searchParams.get("provider");

    if (!isProvider(provider)) {
      return response({ error: "Invalid provider" }, 400);
    }

    await prisma.userProviderKey.deleteMany({
      where: {
        userId: user._id.toString(),
        provider,
      },
    });

    return response({
      success: true,
      provider,
    });
  } catch (error) {
    console.error("[Provider Keys DELETE]", error);

    return response(
      { error: "Failed to delete provider key" },
      500,
    );
  }
}
