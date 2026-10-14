import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memories = await prisma.agentMemory.findMany({
      where: { userId: user._id.toString() },
      orderBy: { key: "asc" },
      select: {
        key: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Cloud memory GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load cloud memory" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { key, content } = data;

    if (typeof key !== "string" || !key.trim() || key.length > 200) {
      return NextResponse.json(
        { error: "A valid key of at most 200 characters is required" },
        { status: 400 },
      );
    }

    if (typeof content !== "string" || content.length > 10000) {
      return NextResponse.json(
        { error: "content must be a string of at most 10000 characters" },
        { status: 400 },
      );
    }

    const memory = await prisma.agentMemory.upsert({
      where: {
        userId_key: {
          userId: user._id.toString(),
          key: key.trim(),
        },
      },
      create: {
        userId: user._id.toString(),
        key: key.trim(),
        content,
      },
      update: { content },
      select: {
        key: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ memory });
  } catch (error) {
    console.error("Cloud memory PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to save cloud memory" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key?.trim() || key.length > 200) {
      return NextResponse.json(
        { error: "A valid key is required" },
        { status: 400 },
      );
    }

    await prisma.agentMemory.deleteMany({
      where: {
        userId: user._id.toString(),
        key: key.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cloud memory DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to delete cloud memory" },
      { status: 500 },
    );
  }
}
