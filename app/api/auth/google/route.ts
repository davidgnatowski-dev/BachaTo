import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleAuthorization, googleConfig } from "@/lib/googleAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return NextResponse.redirect(new URL("/logowanie/google?error=config", request.url));
  const { state, verifier, url } = googleAuthorization(config);
  const jar = await cookies();
  jar.set("google_oauth", JSON.stringify({ state, verifier }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/api/auth/google", maxAge: 600,
  });
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
}
