import { createHash, randomBytes } from "node:crypto";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  let url: URL;
  try { url = new URL(redirectUri); } catch { return null; }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "localhost")) return null;
  if (url.pathname !== "/api/auth/google/callback" || url.search || url.hash || url.username || url.password) return null;
  return { clientId, clientSecret, redirectUri };
}

export function googleAuthorization(config: { clientId: string; redirectUri: string }) {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId, redirect_uri: config.redirectUri,
    response_type: "code", scope: "openid email profile", state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  return { state, verifier, url };
}
