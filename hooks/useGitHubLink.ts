/**
 * useGitHubLink Hook
 * Manages GitHub account linking state.
 * Uses GitHub Device Flow (no client_secret needed).
 */
import { CONFIG } from "@/lib/config";
import {
    completeGitHubLink,
    getGitHubLinkFromDb,
    GitHubLinkStatus,
    loadGitHubLink,
    pollForDeviceToken,
    requestDeviceCode,
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

      // 1. Request a device code from GitHub
      const deviceCode = await requestDeviceCode();

      // 2. Copy the code to clipboard
      try {
        const Clipboard = require("expo-clipboard");
        await Clipboard.setStringAsync(deviceCode.user_code);
      } catch {
        // Clipboard not critical — user can read the code from the alert
      }

      // 3. Show the code and wait for user to press "Open GitHub"
      const { Alert, Linking } = require("react-native");
      const userConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Enter Code on GitHub",
          `Your code:\n\n${deviceCode.user_code}\n\nCopied to clipboard! Tap "Open GitHub" to authorize.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Open GitHub", onPress: () => resolve(true) },
          ],
          { cancelable: false }
        );
      });

      if (!userConfirmed) {
        setIsLinking(false);
        return;
      }

      // 4. Open GitHub device verification page
      await Linking.openURL(deviceCode.verification_uri);

      // 5. Poll for the access token (user is in browser authorizing)
      const tokens = await pollForDeviceToken(
        deviceCode.device_code,
        deviceCode.interval,
        deviceCode.expires_in
      );

      // 6. Complete the link (fetch profile, save locally + DB)
      const linkResult = await completeGitHubLink(
        walletAddress,
        tokens.access_token
      );
      setStatus(linkResult);
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
