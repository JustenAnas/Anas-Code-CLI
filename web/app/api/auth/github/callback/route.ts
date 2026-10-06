import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { createSession, normalizeEmail } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "GitHub authorization code is missing." },
      { status: 400 },
    );
  }

  if (!state) {
    return NextResponse.json(
      { error: "GitHub OAuth state is missing." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("github_oauth_state")?.value;

  cookieStore.delete("github_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.json(
      { error: "Invalid GitHub OAuth state." },
      { status: 400 },
    );
  }

  const [mode] = state.split(":");

  if (mode !== "login" && mode !== "signup") {
    return NextResponse.json(
      { error: "Invalid GitHub OAuth mode." },
      { status: 400 },
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured." },
      { status: 500 },
    );
  }

  const redirectUri =
    "http://localhost:3000/api/auth/github/callback";

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to authenticate with GitHub." },
        { status: 401 },
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: "GitHub did not return an access token." },
        { status: 401 },
      );
    }

    const profileResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${tokens.access_token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get GitHub user information." },
        { status: 401 },
      );
    }

    const githubUser = await profileResponse.json();

    const emailsResponse = await fetch(
      "https://api.github.com/user/emails",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${tokens.access_token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!emailsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get GitHub email information." },
        { status: 401 },
      );
    }

    const emails = await emailsResponse.json();

    const primaryEmail = emails.find(
      (email: {
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }) => email.primary && email.verified,
    );

    if (!primaryEmail?.email) {
      return NextResponse.json(
        {
          error:
            "Your GitHub account does not have a verified primary email.",
        },
        { status: 400 },
      );
    }

    const email = normalizeEmail(primaryEmail.email);
    const db = await getDb();
    const users = db.collection("users");

    let user = await users.findOne({
      provider: "github",
      providerId: String(githubUser.id),
    });

    if (mode === "login") {
      if (!user) {
        user = await users.findOne({ email });
      }

      if (!user) {
        return NextResponse.redirect(
          new URL(
            "/login?error=Account%20not%20found.%20Please%20sign%20up%20first.",
            request.url,
          ),
        );
      }
    }

    if (mode === "signup") {
      if (user) {
        return NextResponse.redirect(
          new URL(
            "/login?error=An%20account%20already%20exists.%20Please%20log%20in.",
            request.url,
          ),
        );
      }

      const existingEmailUser = await users.findOne({ email });

      if (existingEmailUser) {
        return NextResponse.redirect(
          new URL(
            "/login?error=An%20account%20already%20exists%20with%20this%20email.%20Please%20log%20in.",
            request.url,
          ),
        );
      }

      const result = await users.insertOne({
        name:
          githubUser.name ||
          githubUser.login ||
          email.split("@")[0],
        email,
        provider: "github",
        providerId: String(githubUser.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = await users.findOne({
        _id: result.insertedId,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unable to create or find your ANAS account." },
        { status: 500 },
      );
    }

    await createSession(user._id.toString());

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.json(
      { error: "GitHub authentication failed." },
      { status: 500 },
    );
  }
}