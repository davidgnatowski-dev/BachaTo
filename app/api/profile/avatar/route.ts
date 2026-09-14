import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateUserAvatar } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const AVATAR_BUCKET = "avatars";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_URL_PREFIX = "/uploads/avatars/";
const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads", "avatars");

function detectedExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp";
  return null;
}

const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** Storage.upload() rejects a plain Uint8Array/ArrayBuffer content type mismatch across supabase-js versions — a Blob is the one input every version accepts. */
function toBlob(bytes: Uint8Array, contentType: string): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: contentType });
}

async function removeStoredAvatar(avatarUrl: string | null, userId: number) {
  if (!avatarUrl) return;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const index = avatarUrl.indexOf(marker);
    if (index === -1) return;
    const objectPath = avatarUrl.slice(index + marker.length);
    if (!objectPath.startsWith(`${userId}-`)) return;
    await supabase.storage.from(AVATAR_BUCKET).remove([objectPath]);
    return;
  }
  if (!avatarUrl.startsWith(UPLOAD_URL_PREFIX)) return;
  const filename = path.basename(avatarUrl);
  if (!filename.startsWith(`${userId}-`)) return;
  await unlink(path.join(UPLOAD_DIRECTORY, filename)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Zaloguj się ponownie." }, { status: 401 });

  try {
    const formData = await request.formData();
    const upload = formData.get("avatar");
    if (!(upload instanceof File)) {
      return Response.json({ error: "Wybierz plik ze zdjęciem." }, { status: 400 });
    }
    if (upload.size === 0 || upload.size > MAX_FILE_SIZE) {
      return Response.json({ error: "Zdjęcie może mieć maksymalnie 5 MB." }, { status: 400 });
    }

    const bytes = new Uint8Array(await upload.arrayBuffer());
    const extension = detectedExtension(bytes);
    if (!extension) {
      return Response.json({ error: "Dozwolone są wyłącznie prawidłowe pliki JPG, PNG lub WebP." }, { status: 400 });
    }

    const filename = `${user.id}-${randomUUID()}.${extension}`;
    const supabase = getSupabaseAdmin();
    let avatarUrl: string;

    if (supabase) {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filename, toBlob(bytes, CONTENT_TYPES[extension]), { contentType: CONTENT_TYPES[extension], upsert: false });
      if (uploadError) throw uploadError;
      avatarUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filename).data.publicUrl;
    } else {
      await mkdir(UPLOAD_DIRECTORY, { recursive: true });
      avatarUrl = `${UPLOAD_URL_PREFIX}${filename}`;
      await writeFile(path.join(UPLOAD_DIRECTORY, filename), bytes, { flag: "wx" });
    }

    try {
      await updateUserAvatar(user.id, avatarUrl);
    } catch (error) {
      if (supabase) await supabase.storage.from(AVATAR_BUCKET).remove([filename]).catch(() => undefined);
      else await unlink(path.join(UPLOAD_DIRECTORY, filename)).catch(() => undefined);
      throw error;
    }
    await removeStoredAvatar(user.avatarUrl, user.id);
    revalidatePath("/");
    revalidatePath("/konto");
    return Response.json({ avatarUrl });
  } catch {
    return Response.json({ error: "Nie udało się przesłać zdjęcia. Spróbuj ponownie." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Zaloguj się ponownie." }, { status: 401 });

  try {
    await updateUserAvatar(user.id, null);
    await removeStoredAvatar(user.avatarUrl, user.id);
    revalidatePath("/");
    revalidatePath("/konto");
    return Response.json({ avatarUrl: null });
  } catch {
    return Response.json({ error: "Nie udało się usunąć zdjęcia. Spróbuj ponownie." }, { status: 500 });
  }
}
