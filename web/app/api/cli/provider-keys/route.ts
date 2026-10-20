import { currentCliUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptProviderKey } from "@/lib/provider-key-crypto";

export const runtime = "nodejs";

const PROVIDERS = ["claude", "openai", "gemini", "openrouter", "groq"] as const;

type Provider = (typeof PROVIDERS)[number];

function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && PROVIDERS.includes(value as Provider);
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

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// Check which providers have saved API keys.
// Never expose actual API keys.
export async function GET(request: Request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return response({ error: "Unauthorized" }, 401);
    }

    const provider = new URL(request.url).searchParams.get("provider");

    if (provider && !isProvider(provider)) {
      return response({ error: "Invalid provider" }, 400);
    }

    const userId = user._id.toString();

    if (provider) {
      const saved = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: {
            userId,
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
        userId,
      },
      select: {
        provider: true,
        updatedAt: true,
      },
    });

    return response({
      providers: savedKeys,
    });
  } catch {
    console.error("[Provider Keys GET] Request failed");

    return response({ error: "Failed to load provider keys" }, 500);
  }
}

// Save or replace a provider API key.
export async function PUT(request: Request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return response({ error: "Unauthorized" }, 401);
    }

    const body: unknown = await request.json().catch(() => null);

    if (
      typeof body !== "object" ||
      body === null ||
      !("provider" in body) ||
      !("apiKey" in body) ||
      !isProvider(body.provider) ||
      typeof body.apiKey !== "string"
    ) {
      return response({ error: "Provider and API key are required" }, 400);
    }

    const apiKey = body.apiKey.trim();

    if (!apiKey || apiKey.length > 4096) {
      return response({ error: "Invalid API key length" }, 400);
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
  } catch {
    console.error("[Provider Keys PUT] Request failed");

    return response({ error: "Failed to save provider key" }, 500);
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
  } catch {
    console.error("[Provider Keys DELETE] Request failed");

    return response({ error: "Failed to delete provider key" }, 500);
  }
}
