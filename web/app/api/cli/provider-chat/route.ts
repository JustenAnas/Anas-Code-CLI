
import OpenAI from "openai";
import { currentCliUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptProviderKey } from "@/lib/provider-key-crypto";
import { checkCliRateLimit } from "@/lib/cli-rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1_000_000;

type ToolDefinition = OpenAI.Chat.Completions.ChatCompletionTool;
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function respond(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidMessage(value: unknown): boolean {
  if (!isRecord(value) || typeof value.role !== "string") {
    return false;
  }

  if (value.role === "system" || value.role === "user") {
    return (
      typeof value.content === "string" &&
      value.content.length <= 50_000
    );
  }

  if (value.role === "assistant") {
    if (
      value.content !== null &&
      value.content !== undefined &&
      (typeof value.content !== "string" ||
        value.content.length > 50_000)
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
  if (!isRecord(value) || value.type !== "function") {
    return false;
  }

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


async function streamOpenAIResponse(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[],
): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages,
          ...(tools?.length
            ? { tools, tool_choice: "auto" as const }
            : {}),
          max_completion_tokens: 1024,
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
            const existing = toolCallsByIndex.get(call.index) ?? {
              id: "",
              name: "",
              arguments: "",
            };

            if (call.id) {
              existing.id = call.id;
            }

            if (call.function?.name) {
              existing.name += call.function.name;
            }

            if (call.function?.arguments) {
              existing.arguments += call.function.arguments;
            }

            toolCallsByIndex.set(call.index, existing);
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
            .map(([, call]) => ({
              id: call.id,
              name: call.name,
              input: JSON.parse(call.arguments || "{}"),
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
            message = "Invalid saved OpenAI API key";
          } else if (error.status === 429) {
            message = "OpenAI rate limit or quota exceeded";
          } else {
            message = "OpenAI provider request failed";
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
    {
      error: "Rate limit exceeded. Please try again shortly.",
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(rateLimit.retryAfter),
      },
    },
  );
}

    const contentLength = Number(
      request.headers.get("content-length") ?? 0,
    );

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
      body.provider !== "openai" ||
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

    
if (body.stream === true) {
  return streamOpenAIResponse(
    client,
    messages as ChatMessage[],
    Array.isArray(tools) && tools.length > 0
      ? (tools as ToolDefinition[])
      : undefined,
  );
}


    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages as ChatMessage[],
      ...(Array.isArray(tools) && tools.length > 0
        ? {
            tools: tools as ToolDefinition[],
            tool_choice: "auto" as const,
          }
        : {}),
      max_completion_tokens: 1024,
    });

    const message = completion.choices[0]?.message;

    const toolCalls =
      message?.tool_calls
        ?.filter(
          (call): call is Extract<
            NonNullable<typeof message.tool_calls>[number],
            { type: "function" }
          > => call.type === "function",
        )
        .map((call) => ({
          id: call.id,
          name: call.function.name,
          input: (() => {
            try {
              return JSON.parse(call.function.arguments);
            } catch {
              return {};
            }
          })(),
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
