
import OpenAI from "openai";
import { currentCliUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptProviderKey } from "@/lib/provider-key-crypto";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1_000_000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function respond(
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

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const token = authorization.slice(7).trim();
    const user = await currentCliUser(token);

    if (!user) {
      return respond({ error: "Unauthorized" }, 401);
    }

    const contentLength = Number(
      request.headers.get("content-length") ?? 0,
    );

    if (contentLength > MAX_BODY_BYTES) {
      return respond({ error: "Request too large" }, 413);
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      body.provider !== "openai" ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      body.messages.length > 100 ||
      !body.messages.every(
        (message: unknown): message is ChatMessage =>
          typeof message === "object" &&
          message !== null &&
          "role" in message &&
          "content" in message &&
          (message.role === "system" ||
            message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.length <= 50_000,
      )
    ) {
      return respond({ error: "Invalid chat request" }, 400);
    }

    const saved = await prisma.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId: user._id.toString(),
          provider: "openai",
        },
      },
      select: {
        encryptedKey: true,
      },
    });

    if (!saved) {
      return respond(
        { error: "No saved OpenAI API key found" },
        404,
      );
    }

    const apiKey = decryptProviderKey(saved.encryptedKey);

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: body.messages as ChatMessage[],
      max_completion_tokens: 1024,
    });

    return respond({
      content: completion.choices[0]?.message?.content ?? "",
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return respond(
          { error: "Invalid saved OpenAI API key" },
          401,
        );
      }

      if (error.status === 429) {
        return respond(
          { error: "OpenAI rate limit or quota exceeded" },
          429,
        );
      }

      return respond(
        { error: "OpenAI provider request failed" },
        502,
      );
    }

    console.error(
      "[Provider Chat]",
      error instanceof Error ? error.message : error,
    );

    return respond(
      { error: "Provider chat request failed" },
      500,
    );
  }
}
