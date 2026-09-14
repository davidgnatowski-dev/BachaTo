import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleConfig } from "@/lib/googleAuth";
import { resolveGoogleUser } from "@/lib/db";
import { startSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = googleConfig();
  const origin = config ? new URL(config.redirectUri).origin : new URL(request.url).origin;
  const fail = (error: string) => NextResponse.redirect(new URL(`/logowanie/google?error=${error}`, origin));
  const jar = await cookies();
  const saved = jar.get("google_oauth")?.value;
  jar.set("google_oauth", "", { path: "/api/auth/google", maxAge: 0 });
  if (!config) return fail("config");
  try {
    const query = new URL(request.url).searchParams;
    const flow = saved ? JSON.parse(saved) : null;
    if (!flow?.state || !flow?.verifier || query.get("state") !== flow.state) return fail("invalid");
    if (query.has("error")) return fail("cancelled");
    const code = query.get("code");
    if (!code) return fail("invalid");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret,
        redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: flow.verifier }),
    });
    if (!tokenResponse.ok) return fail("invalid");
    const token = await tokenResponse.json();
    if (typeof token.access_token !== "string") return fail("invalid");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!profileResponse.ok) return fail("invalid");
    const profile = await profileResponse.json();
    if (typeof profile.sub !== "string" || !profile.sub || typeof profile.email !== "string" || !profile.email.includes("@") || profile.email_verified !== true) return fail("invalid");
    const id = await resolveGoogleUser(profile.sub, profile.email.toLowerCase(), typeof profile.name === "string" ? profile.name.slice(0, 100) : profile.email.split("@")[0]);
    await startSession(id);
    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    return fail(error instanceof Error && error.message === "account_exists" ? "exists" : "invalid");
  }
}
