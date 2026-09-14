import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { googleAuthorization, googleConfig } from "../lib/googleAuth";

test("Google OAuth binds each attempt to a unique state and PKCE verifier", () => {
  const config = { clientId: "test-client", redirectUri: "https://example.com/api/auth/google/callback" };
  const first = googleAuthorization(config);
  const second = googleAuthorization(config);
  assert.notEqual(first.state, second.state);
  assert.notEqual(first.verifier, second.verifier);
  assert.equal(first.url.origin, "https://accounts.google.com");
  assert.equal(first.url.searchParams.get("code_challenge"), createHash("sha256").update(first.verifier).digest("base64url"));
  assert.equal(first.url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(first.url.searchParams.get("scope"), "openid email profile");
  assert.equal(first.url.searchParams.get("redirect_uri"), config.redirectUri);
  assert.equal(first.url.searchParams.get("state"), first.state);
  assert.equal(first.url.searchParams.has("client_secret"), false);
});

test("invalid Google configuration is rejected without throwing", () => {
  const saved = { ...process.env };
  try {
    process.env.GOOGLE_CLIENT_ID = "test";
    process.env.GOOGLE_CLIENT_SECRET = "test";
    for (const uri of ["invalid", "https://example.com/wrong", "http://example.com/api/auth/google/callback"]) {
      process.env.GOOGLE_REDIRECT_URI = uri;
      assert.equal(googleConfig(), null);
    }
    process.env.GOOGLE_REDIRECT_URI = "https://example.com/api/auth/google/callback";
    assert.ok(googleConfig());
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal(googleConfig(), null);
  } finally {
    for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
