/**
 * useXLink Hook
 * Manages X (Twitter) account linking state.
 * OAuth flow uses expo-web-browser directly (NO expo-auth-session hooks).
 */
import { CONFIG } from "@/lib/config";
import {
    completeXLink,
    getXLinkFromDb,
    loadXLink,
    unlinkX,
    XLinkStatus,
} from "@/lib/xLink";
import { useCallback, useEffect, useState } from "react";

export interface UseXLinkReturn {
  status: XLinkStatus;
  isLinking: boolean;
  isUnlinking: boolean;
  error: string | null;
  linkX: () => Promise<void>;
  unlinkXAccount: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useXLink(walletAddress: string | null): UseXLinkReturn {
  const [status, setStatus] = useState<XLinkStatus>({
    isLinked: false,
    username: null,
    userId: null,
    linkedAt: null,
  });
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load status on mount
  useEffect(() => {
    if (!walletAddress) {
      setStatus({
        isLinked: false,
        username: null,
        userId: null,
        linkedAt: null,
      });
      return;
    }

    (async () => {
      try {
        // Check local first, then DB
        const localLink = await loadXLink();
        if (localLink) {
          setStatus({
            isLinked: true,
            username: localLink.x_username,
            userId: localLink.x_user_id,
            linkedAt: localLink.linked_at,
          });
          return;
        }

        const dbStatus = await getXLinkFromDb(walletAddress);
        setStatus(dbStatus);
      } catch (err) {
        console.error("[useXLink] Load error:", err);
      }
    })();
  }, [walletAddress]);

  const linkX = useCallback(async () => {
    if (!walletAddress) {
      setError("Connect your wallet first");
      return;
    }

    if (!CONFIG.X_CLIENT_ID) {
      setError("X linking coming soon — requires server configuration.");
      return;
    }

    // When X_CLIENT_ID is configured, use WebBrowser.openAuthSessionAsync
    // to handle the OAuth PKCE flow manually (no expo-auth-session hooks)
    try {
      setIsLinking(true);
      setError(null);

      const WebBrowser = require("expo-web-browser");

      // Always use the app scheme — Linking.createURL may produce exp:// in dev
      const redirectUri = `${CONFIG.APP_SCHEME}://x-callback`;
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const params = new URLSearchParams({
        response_type: "code",
        client_id: CONFIG.X_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: "tweet.read users.read follows.read offline.access",
        state: Math.random().toString(36).slice(2),
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          const linkResult = await completeXLink(
            walletAddress,
            code,
            codeVerifier,
            redirectUri
          );
          setStatus(linkResult);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to link X account");
      console.error("[useXLink] Link error:", err);
    } finally {
      setIsLinking(false);
    }
  }, [walletAddress]);

  const unlinkXAccount = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsUnlinking(true);
      setError(null);
      await unlinkX(walletAddress);
      setStatus({
        isLinked: false,
        username: null,
        userId: null,
        linkedAt: null,
      });
    } catch (err: any) {
      setError(err.message || "Failed to unlink X account");
    } finally {
      setIsUnlinking(false);
    }
  }, [walletAddress]);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const dbStatus = await getXLinkFromDb(walletAddress);
      setStatus(dbStatus);
    } catch (err) {
      console.error("[useXLink] Refresh error:", err);
    }
  }, [walletAddress]);

  return {
    status,
    isLinking,
    isUnlinking,
    error,
    linkX,
    unlinkXAccount,
    refresh,
  };
}

// ─── PKCE Helpers ───────────────────────────────────────
function generateCodeVerifier(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  try {
    const values = new Uint8Array(64);
    globalThis.crypto.getRandomValues(values);
    for (let i = 0; i < 64; i++) {
      result += chars[values[i] % chars.length];
    }
  } catch {
    // Fallback: Math.random (less secure but won't crash)
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  // crypto.subtle is NOT available in React Native / Hermes.
  // Use expo-crypto's digestStringAsync as a safe alternative.
  try {
    const { digestStringAsync, CryptoDigestAlgorithm } = require("expo-crypto");
    const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, verifier);
    // hash is a hex string — convert to base64url
    const bytes: number[] = [];
    for (let i = 0; i < hash.length; i += 2) {
      bytes.push(parseInt(hash.substring(i, i + 2), 16));
    }
    const base64 = btoa(String.fromCharCode.apply(null, bytes));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    // Absolute fallback: return verifier truncated (not S256, but won't crash)
    return verifier.slice(0, 43);
  }
}
