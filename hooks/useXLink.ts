/**
 * useXLink Hook
 * Manages X (Twitter) account linking state
 */
import { CONFIG } from "@/lib/config";
import { completeXLink, getXLinkFromDb, loadXLink, unlinkX, XLinkStatus } from "@/lib/xLink";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

// X OAuth 2.0 endpoints
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.x.com/2/oauth2/token",
  revocationEndpoint: "https://api.x.com/2/oauth2/revoke",
};

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

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: CONFIG.APP_SCHEME,
    path: "x-callback",
  });

  // When X_CLIENT_ID is not set, pass a placeholder config.
  // `request` will still be null until the async load completes,
  // and we guard `promptAsync` calls behind the isLinked check.
  const authConfig: AuthSession.AuthRequestConfig = {
    clientId: CONFIG.X_CLIENT_ID || "__unused__",
    redirectUri,
    scopes: ["tweet.read", "users.read", "follows.read", "offline.access"],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    authConfig,
    discovery
  );

  // Load status on mount
  useEffect(() => {
    if (!walletAddress) {
      setStatus({ isLinked: false, username: null, userId: null, linkedAt: null });
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

  // Handle OAuth response
  useEffect(() => {
    if (!response || response.type !== "success" || !walletAddress) return;

    const code = response.params?.code;
    if (!code || !request?.codeVerifier) return;

    (async () => {
      try {
        setIsLinking(true);
        setError(null);
        const result = await completeXLink(
          walletAddress,
          code,
          request.codeVerifier!,
          redirectUri
        );
        setStatus(result);
      } catch (err: any) {
        setError(err.message || "Failed to link X account");
        console.error("[useXLink] Link error:", err);
      } finally {
        setIsLinking(false);
      }
    })();
  }, [response]);

  const linkX = useCallback(async () => {
    if (!walletAddress) {
      setError("Connect your wallet first");
      return;
    }

    if (!CONFIG.X_CLIENT_ID) {
      setError("X OAuth not configured. Set EXPO_PUBLIC_X_CLIENT_ID env var.");
      return;
    }

    try {
      setIsLinking(true);
      setError(null);
      await promptAsync();
    } catch (err: any) {
      setError(err.message || "Failed to start X OAuth flow");
      setIsLinking(false);
    }
  }, [walletAddress, promptAsync]);

  const unlinkXAccount = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsUnlinking(true);
      setError(null);
      await unlinkX(walletAddress);
      setStatus({ isLinked: false, username: null, userId: null, linkedAt: null });
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
