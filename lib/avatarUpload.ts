/**
 * Avatar Upload — Supabase Storage
 * Uploads profile photos so they're visible to all users on the leaderboard.
 * Falls back gracefully if Storage is not configured.
 */

/**
 * Upload a local image to Supabase Storage and return the public URL.
 * Returns null if upload fails (bucket missing, no permissions, etc.).
 */
export async function uploadAvatar(
  wallet: string,
  localUri: string
): Promise<string | null> {
  try {
    const { supabase } = require("@/lib/supabase");
    if (!supabase?.storage) return null;

    // Ensure bucket exists (safe if already created)
    try {
      await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2 MB max
      });
    } catch {
      // Bucket may already exist or we lack permissions — fine
    }

    const ext =
      localUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
    const safeName = `avatar_${Date.now()}.${ext}`;
    const path = `${wallet}/${safeName}`;
    const contentType = ext === "png" ? "image/png" : "image/jpeg";

    // Fetch local file as blob (React Native supports file:// URIs)
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType, upsert: true });

    if (uploadError) {
      console.warn("[avatarUpload] Upload failed:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (err: any) {
    console.warn("[avatarUpload] Error:", err?.message);
    return null;
  }
}
