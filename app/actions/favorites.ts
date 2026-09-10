"use server";

import { addUserFavorite, getUserFavorites, removeUserFavorite, type FavoriteItemType, type FavoriteKind, type UserFavoriteRow } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Mirrors a localStorage like/plan toggle onto the logged-in user's account.
 * No-ops silently when logged out — localStorage remains the source of
 * truth for anonymous visitors, this is purely an account-sync side effect.
 */
export async function syncFavorite(itemType: FavoriteItemType, itemId: string, kind: FavoriteKind, active: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  if (active) addUserFavorite(user.id, itemType, itemId, kind);
  else removeUserFavorite(user.id, itemType, itemId, kind);
}

/** Null when logged out. Used once on mount to merge account favorites into this browser's localStorage. */
export async function fetchServerFavorites(): Promise<UserFavoriteRow[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserFavorites(user.id);
}
