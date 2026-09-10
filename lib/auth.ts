import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSessionUser, getUserById, type UserRow } from "./db";
import { parseUserPreferences, type UserPreferences } from "./preferences";

const SESSION_COOKIE = "bachato_session";
const SESSION_DAYS = 30;
const SCRYPT_KEYLEN = 64;

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

export interface ResetRequestState {
  error?: string;
  message?: string;
  /**
   * No email service is configured yet, so the reset link is shown directly
   * here instead of being sent by email. Swap this for a real "send email"
   * call in app/resetuj-haslo/actions.ts once one is — everything else
   * (token generation, expiry, one-time use) is already production-shaped.
   */
  devResetUrl?: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  city: string | null;
  district: string | null;
  maxDistanceKm: number | null;
  preferences: UserPreferences;
  publicProfile: boolean;
  createdAt: string;
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarEmoji: row.avatarEmoji,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    city: row.city,
    district: row.district,
    maxDistanceKm: row.maxDistanceKm,
    preferences: parseUserPreferences(row.preferencesJson),
    publicProfile: Boolean(row.publicProfile),
    createdAt: row.createdAt,
  };
}

/** `salt:hash`, both hex — scrypt is Node's built-in, no extra dependency needed for password hashing. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Call only from a Server Action or Route Handler — cookies() can only be mutated there. */
export async function startSession(userId: number) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  createSession(userId, sessionId, expiresAt.toISOString());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Call only from a Server Action or Route Handler. */
export async function endSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) deleteSession(sessionId);
  cookieStore.delete(SESSION_COOKIE);
}

/** Safe to call from Server Components (read-only) as well as Server Actions/Route Handlers. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const row = getSessionUser(sessionId);
  return row ? toPublicUser(row) : null;
}

/** Re-reads the user by id — for after a profile mutation, when the session cookie itself didn't change. */
export function toPublicUserById(id: number): PublicUser | null {
  const row = getUserById(id);
  return row ? toPublicUser(row) : null;
}
