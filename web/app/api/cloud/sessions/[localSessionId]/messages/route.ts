import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{ localSessionId: string }>;
};

const MAX_METADATA_LENGTH = 100_000;

function isValidToolCall(value: unknown): boolean {
  if (value === undefined || value === null) return true;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.name === "string" &&
    item.name.length > 0 &&
    item.name.length <= 200 &&
    item.input !== null &&
    typeof item.input === "object" &&
    !Array.isArray(item.input)
  );
}

function isValidToolCalls(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) &&
      value.length <= 100 &&
      value.every(isValidToolCall))
  );
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { localSessionId } = await params;

    const session = await prisma.cloudSession.findUnique({
      where: {
        userId_localSessionId: {
          userId: user._id.toString(),
          localSessionId,
        },
      },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = await prisma.cloudMessage.findMany({
      where: { sessionId: session.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        localMessageId: true,
        role: true,
        content: true,
        toolCallId: true,
        toolCall: true,
        toolCalls: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Cloud messages GET failed:", error);

    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { localSessionId } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const { localMessageId, role, content, toolCallId, toolCall, toolCalls } =
      data;

    if (
      typeof localMessageId !== "string" ||
      !localMessageId.trim() ||
      localMessageId.length > 200
    ) {
      return NextResponse.json(
        { error: "A valid localMessageId is required" },
        { status: 400 },
      );
    }

    if (
      typeof role !== "string" ||
      !["system", "user", "assistant", "tool"].includes(role)
    ) {
      return NextResponse.json(
        { error: "role must be system, user, assistant, or tool" },
        { status: 400 },
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "content must be a string" },
        { status: 400 },
      );
    }

    if (
      toolCallId !== undefined &&
      toolCallId !== null &&
      (typeof toolCallId !== "string" || toolCallId.length > 200)
    ) {
      return NextResponse.json(
        { error: "toolCallId must be a string" },
        { status: 400 },
      );
    }

    if (!isValidToolCall(toolCall) || !isValidToolCalls(toolCalls)) {
      return NextResponse.json(
        { error: "Invalid tool-call metadata" },
        { status: 400 },
      );
    }

    const metadataSize = JSON.stringify({
      toolCall,
      toolCalls,
    }).length;

    if (metadataSize > MAX_METADATA_LENGTH) {
      return NextResponse.json(
        { error: "Tool-call metadata is too large" },
        { status: 413 },
      );
    }

    const session = await prisma.cloudSession.findUnique({
      where: {
        userId_localSessionId: {
          userId: user._id.toString(),
          localSessionId,
        },
      },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const metadata = {
      toolCallId:
        typeof toolCallId === "string" ? toolCallId : null,
      toolCall: toJsonInput(toolCall),
      toolCalls: toJsonInput(toolCalls),
    };

    const message = await prisma.cloudMessage.upsert({
      where: {
        sessionId_localMessageId: {
          sessionId: session.id,
          localMessageId: localMessageId.trim(),
        },
      },
      create: {
        sessionId: session.id,
        localMessageId: localMessageId.trim(),
        role,
        content,
        ...metadata,
      },
      update: {
        role,
        content,
        ...metadata,
      },
      select: {
        localMessageId: true,
        role: true,
        content: true,
        toolCallId: true,
        toolCall: true,
        toolCalls: true,
        createdAt: true,
      },
    });

    await prisma.cloudSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error("Cloud messages POST failed:", error);

    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 },
    );
  }
}

