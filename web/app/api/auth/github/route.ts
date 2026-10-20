import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json(
      { error: "Invalid GitHub OAuth mode." },
      { status: 400 },
    );
  }

  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!redirectUri) {
    return NextResponse.json(
      { error: "GitHub OAuth redirect URI is not configured." },
      { status: 500 },
    );
  }

  const state = `${mode}:${randomBytes(32).toString("hex")}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );

  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
