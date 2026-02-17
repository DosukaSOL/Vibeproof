/**
 * useGitHubLink Hook
 * Manages GitHub account linking state.
 * OAuth flow uses expo-web-browser directly.
 */
import { CONFIG } from "@/lib/config";
import {
    completeGitHubLink,
    getGitHubLinkFromDb,
    GitHubLinkStatus,
    loadGitHubLink,
    unlinkGitHub,
} from "@/lib/githubLink";
import { useCallback, useEffect, useState } from "react";

export interface UseGitHubLinkReturn {
  status: GitHubLinkStatus;
  isLinking: boolean;
  isUnlinking: boolean;
  error: string | null;
  linkGitHub: () => Promise<void>;
  unlinkGitHubAccount: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGitHubLink(walletAddress: string | null): UseGitHubLinkReturn {
  const [status, setStatus] = useState<GitHubLinkStatus>({
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
      setStatus({ isLinked: false, username: null, userId: null, linkedAt: null });
      return;
    }

    (async () => {
      try {
        // Check local first, then DB
        const localLink = await loadGitHubLink();
        if (localLink) {
          setStatus({
            isLinked: true,
            username: localLink.github_username,
            userId: localLink.github_user_id,
            linkedAt: localLink.linked_at,
          });
          return;
        }

        const dbStatus = await getGitHubLinkFromDb(walletAddress);
        setStatus(dbStatus);
      } catch (err) {
        console.error("[useGitHubLink] Load error:", err);
      }
    })();
  }, [walletAddress]);

  const linkGitHub = useCallback(async () => {
    if (!walletAddress) {
      setError("Connect your wallet first");
      return;
    }

    if (!CONFIG.GITHUB_CLIENT_ID) {
      setError("GitHub linking coming soon — requires app configuration.");
      return;
    }

    try {
      setIsLinking(true);
      setError(null);

      const WebBrowser = require("expo-web-browser");

      const redirectUri = `${CONFIG.APP_SCHEME}://github-callback`;
      const state = Math.random().toString(36).slice(2);

      const params = new URLSearchParams({
        client_id: CONFIG.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: "read:user",
        state,
      });

      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          const linkResult = await completeGitHubLink(
            walletAddress,
            code,
            redirectUri
          );
          setStatus(linkResult);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to link GitHub account");
      console.error("[useGitHubLink] Link error:", err);
    } finally {
      setIsLinking(false);
    }
  }, [walletAddress]);

  const unlinkGitHubAccount = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsUnlinking(true);
      setError(null);
      await unlinkGitHub(walletAddress);
      setStatus({ isLinked: false, username: null, userId: null, linkedAt: null });
    } catch (err: any) {
      setError(err.message || "Failed to unlink GitHub account");
    } finally {
      setIsUnlinking(false);
    }
  }, [walletAddress]);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const dbStatus = await getGitHubLinkFromDb(walletAddress);
      setStatus(dbStatus);
    } catch (err) {
      console.error("[useGitHubLink] Refresh error:", err);
    }
  }, [walletAddress]);

  return {
    status,
    isLinking,
    isUnlinking,
    error,
    linkGitHub,
    unlinkGitHubAccount,
    refresh,
  };
}
