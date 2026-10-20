
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json(
      { error: "Invalid Google OAuth mode." },
      { status: 400 },
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth redirect URI is not configured." },
      { status: 500 },
    );
  }

  const state = `${mode}:${randomBytes(32).toString("hex")}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
