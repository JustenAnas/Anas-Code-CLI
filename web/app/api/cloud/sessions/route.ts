import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.cloudSession.findMany({
      where: { userId: user._id.toString() },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        localSessionId: true,
        title: true,
        workingDirectory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Cloud sessions GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load cloud sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const { localSessionId, title, workingDirectory } = data;

    if (
      typeof localSessionId !== "string" ||
      localSessionId.trim().length === 0 ||
      localSessionId.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "localSessionId is required and must be at most 200 characters",
        },
        { status: 400 },
      );
    }

    if (
      title !== undefined &&
      (typeof title !== "string" || title.length > 200)
    ) {
      return NextResponse.json(
        { error: "title must be a string of at most 200 characters" },
        { status: 400 },
      );
    }

    if (
      workingDirectory !== undefined &&
      workingDirectory !== null &&
      (typeof workingDirectory !== "string" || workingDirectory.length > 1000)
    ) {
      return NextResponse.json(
        {
          error:
            "workingDirectory must be a string of at most 1000 characters or null",
        },
        { status: 400 },
      );
    }

    const userId = user._id.toString();
    const cleanLocalSessionId = localSessionId.trim();

    const session = await prisma.cloudSession.upsert({
      where: {
        userId_localSessionId: {
          userId,
          localSessionId: cleanLocalSessionId,
        },
      },
      create: {
        userId,
        localSessionId: cleanLocalSessionId,
        title:
          typeof title === "string" && title.trim()
            ? title.trim()
            : "New session",
        workingDirectory:
          typeof workingDirectory === "string" ? workingDirectory : null,
      },
      update: {
        ...(typeof title === "string"
          ? { title: title.trim() || "New session" }
          : {}),
        ...(workingDirectory !== undefined ? { workingDirectory } : {}),
      },
      select: {
        id: true,
        localSessionId: true,
        title: true,
        workingDirectory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Cloud sessions POST failed:", error);
    return NextResponse.json(
      { error: "Failed to save cloud session" },
      { status: 500 },
    );
  }
}
