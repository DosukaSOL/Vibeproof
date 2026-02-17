/**
 * Avatar Upload — Supabase Storage with base64 fallback
 * Uploads profile photos so they're visible to all users on the leaderboard.
 * If Supabase Storage is not configured, falls back to a compact base64 data URI
 * stored directly in the users table.
 */

/**
 * Upload a local image to Supabase Storage and return the public URL.
 * Falls back to base64 data URI if storage upload fails.
 * Returns null only if everything fails.
 */
export async function uploadAvatar(
  wallet: string,
  localUri: string
): Promise<string | null> {
  // 1. Try Supabase Storage first
  try {
    const { supabase } = require("@/lib/supabase");
    if (supabase?.storage) {
      // Ensure bucket exists (safe if already created)
      try {
        await supabase.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024,
        });
      } catch {
        // Bucket may already exist or we lack permissions — fine
      }

      const ext =
        localUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const safeName = `avatar_${Date.now()}.${ext}`;
      const path = `${wallet}/${safeName}`;
      const contentType = ext === "png" ? "image/png" : "image/jpeg";

      const response = await fetch(localUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType, upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      }
      // Storage upload failed — fall through to base64 fallback
      console.warn("[avatarUpload] Storage upload failed, using base64 fallback");
    }
  } catch (err: any) {
    console.warn("[avatarUpload] Storage error:", err?.message);
  }

  // 2. Fallback: convert to base64 data URI
  return localUriToBase64DataUri(localUri);
}

/**
 * Convert a local file:// URI to a compact base64 data URI.
 * Reads the file via expo-file-system if available, otherwise via fetch.
 */
async function localUriToBase64DataUri(uri: string): Promise<string | null> {
  try {
    // Try expo-file-system for direct base64 reading (most efficient)
    try {
      const FileSystem = require("expo-file-system");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (base64) {
        // Detect content type from extension
        const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase();
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        return `data:${mime};base64,${base64}`;
      }
    } catch {
      // expo-file-system not available
    }

    // Fallback: fetch as blob and convert
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    console.warn("[avatarUpload] base64 conversion failed:", err?.message);
    return null;
  }
}
