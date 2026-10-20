import OpenAI from "openai";
import { currentCliUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptProviderKey } from "@/lib/provider-key-crypto";
import { checkCliRateLimit } from "@/lib/cli-rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1_000_000;

const PROVIDERS = {
  openai: {
    model: "gpt-4o",
    label: "OpenAI",
    baseURL: undefined as string | undefined,
    envKey: undefined as string | undefined,
  },
  gemini: {
    model: process.env.GEMINI_FREE_MODEL ?? "gemini-2.5-flash",
    label: "Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    envKey: "GEMINI_API_KEY",
  },
  openrouter: {
    model:
      process.env.OPENROUTER_FREE_MODEL ??
      "meta-llama/llama-3.3-70b-instruct:free",
    label: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
  },
  groq: {
    model: process.env.GROQ_FREE_MODEL ?? "llama-3.3-70b-versatile",
    label: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
  },
};

type CloudProvider = keyof typeof PROVIDERS;
type ToolDefinition = OpenAI.Chat.Completions.ChatCompletionTool;
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function respond(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidMessage(value: unknown): boolean {
  if (!isRecord(value) || typeof value.role !== "string") return false;

  if (value.role === "system" || value.role === "user") {
    return typeof value.content === "string" && value.content.length <= 50_000;
  }

  if (value.role === "assistant") {
    if (
      value.content !== null &&
      value.content !== undefined &&
      (typeof value.content !== "string" || value.content.length > 50_000)
    ) {
      return false;
    }

    if (value.tool_calls === undefined) {
      return typeof value.content === "string";
    }

    return (
      Array.isArray(value.tool_calls) &&
      value.tool_calls.length > 0 &&
      value.tool_calls.length <= 20 &&
      value.tool_calls.every(
        (call: unknown) =>
          isRecord(call) &&
          typeof call.id === "string" &&
          call.id.length > 0 &&
          call.id.length <= 200 &&
          call.type === "function" &&
          isRecord(call.function) &&
          typeof call.function.name === "string" &&
          call.function.name.length > 0 &&
          typeof call.function.arguments === "string" &&
          call.function.arguments.length <= 50_000,
      )
    );
  }

  if (value.role === "tool") {
    return (
      typeof value.tool_call_id === "string" &&
      value.tool_call_id.length > 0 &&
      value.tool_call_id.length <= 200 &&
      typeof value.content === "string" &&
      value.content.length <= 50_000
    );
  }

  return false;
}

function isValidTool(value: unknown): boolean {
  if (!isRecord(value) || value.type !== "function") return false;
  const fn = value.function;
  return (
    isRecord(fn) &&
    typeof fn.name === "string" &&
    /^[a-zA-Z0-9_-]{1,64}$/.test(fn.name) &&
    typeof fn.description === "string" &&
    fn.description.length <= 2_000 &&
    isRecord(fn.parameters) &&
    fn.parameters.type === "object"
  );
}

function tokenLimit(provider: CloudProvider) {
  return provider === "openai"
    ? { max_completion_tokens: 1024 }
    : { max_tokens: 4096 };
}

function safeParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

async function streamResponse(
  client: OpenAI,
  provider: CloudProvider,
  messages: ChatMessage[],
  tools?: ToolDefinition[],
): Promise<Response> {
  const { model, label } = PROVIDERS[provider];
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const completion = await client.chat.completions.create({
          model,
          messages,
          ...(tools?.length ? { tools, tool_choice: "auto" as const } : {}),
          ...tokenLimit(provider),
          stream: true,
          stream_options: { include_usage: true },
        });

        const toolCallsByIndex = new Map<
          number,
          { id: string; name: string; arguments: string }
        >();

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            send("text", { content: delta.content });
          }

          for (const call of delta?.tool_calls ?? []) {
            const idx =
              typeof call.index === "number"
                ? call.index
                : toolCallsByIndex.size;

            const existing = toolCallsByIndex.get(idx) ?? {
              id: "",
              name: "",
              arguments: "",
            };

            if (call.id) existing.id = call.id;
            if (call.function?.name) existing.name += call.function.name;
            if (call.function?.arguments) {
              existing.arguments += call.function.arguments;
            }

            toolCallsByIndex.set(idx, existing);
          }

          if (chunk.usage) {
            send("usage", {
              inputTokens: chunk.usage.prompt_tokens,
              outputTokens: chunk.usage.completion_tokens,
            });
          }
        }

        if (toolCallsByIndex.size > 0) {
          const toolCalls = [...toolCallsByIndex.entries()]
            .sort(([a], [b]) => a - b)
            .map(([i, call]) => ({
              id: call.id || `call_${i}`,
              name: call.name,
              input: safeParse(call.arguments),
            }));

          send("tool_calls", { toolCalls });
        }

        send("done", {});
      } catch (error) {
        console.error(
          "[Provider Stream]",
          error instanceof Error ? error.message : error,
        );

        let message = "Cloud streaming failed";

        if (error instanceof OpenAI.APIError) {
          if (error.status === 401) {
            message = `Invalid ${label} API key`;
          } else if (error.status === 429) {
            message = `${label} rate limit or quota exceeded`;
          } else {
            message = `${label} provider request failed`;
          }
        }

        send("error", { error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
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

    const rateLimit = await checkCliRateLimit(user._id.toString());

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > MAX_BODY_BYTES) {
      return respond({ error: "Request too large" }, 413);
    }

    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return respond({ error: "Request too large" }, 413);
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return respond({ error: "Invalid JSON" }, 400);
    }

    if (!isRecord(body)) {
      return respond({ error: "Invalid chat request" }, 400);
    }

    const messages = body.messages;
    const tools = body.tools;

    if (
      typeof body.provider !== "string" ||
      !Object.hasOwn(PROVIDERS, body.provider) ||
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 100 ||
      !messages.every(isValidMessage) ||
      (tools !== undefined &&
        (!Array.isArray(tools) ||
          tools.length > 20 ||
          !tools.every(isValidTool)))
    ) {
      return respond({ error: "Invalid chat request" }, 400);
    }

    const provider = body.provider as CloudProvider;
    const cfg = PROVIDERS[provider];

    let client: OpenAI;

    if (provider === "openai" || body.useOwnKey === true) {
      const saved = await prisma.userProviderKey.findUnique({
        where: {
          userId_provider: { userId: user._id.toString(), provider },
        },
        select: { encryptedKey: true },
      });

      if (!saved) {
        return respond({ error: `No saved ${cfg.label} API key found` }, 404);
      }

      client = new OpenAI({
        apiKey: decryptProviderKey(saved.encryptedKey),
        ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
      });
    } else {
      const key = cfg.envKey ? process.env[cfg.envKey] : undefined;

      if (!key) {
        return respond(
          { error: `ANAS Free for ${cfg.label} is not configured` },
          503,
        );
      }

      client = new OpenAI({ apiKey: key, baseURL: cfg.baseURL });
    }

    const toolList =
      Array.isArray(tools) && tools.length > 0
        ? (tools as ToolDefinition[])
        : undefined;

    if (body.stream === true) {
      return streamResponse(
        client,
        provider,
        messages as ChatMessage[],
        toolList,
      );
    }

    const completion = await client.chat.completions.create({
      model: cfg.model,
      messages: messages as ChatMessage[],
      ...(toolList ? { tools: toolList, tool_choice: "auto" as const } : {}),
      ...tokenLimit(provider),
    });

    const message = completion.choices[0]?.message;

    const toolCalls =
      message?.tool_calls
        ?.filter(
          (
            call,
          ): call is Extract<
            NonNullable<typeof message.tool_calls>[number],
            { type: "function" }
          > => call.type === "function",
        )
        .map((call, i) => ({
          id: call.id || `call_${i}`,
          name: call.function.name,
          input: safeParse(call.function.arguments),
        })) ?? [];

    return respond({
      content: message?.content ?? "",
      toolCalls,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return respond({ error: "Invalid provider API key" }, 401);
      }
      if (error.status === 429) {
        return respond({ error: "Provider rate limit or quota exceeded" }, 429);
      }
      return respond({ error: "Provider request failed" }, 502);
    }

    console.error(
      "[Provider Chat]",
      error instanceof Error ? error.message : error,
    );

    return respond({ error: "Provider chat request failed" }, 500);
  }
}
