/**
 * useWallet Hook
 * Manages wallet connection state and operations
 */
import {
    clearSession,
    getStoredWallet,
    isSessionValid,
    loadSession,
    saveSession,
} from "@/lib/auth";
import {
    connectWallet,
    disconnectWallet,
    formatWalletAddress,
    WalletConnectResult,
} from "@/lib/solana";
import { useCallback, useEffect, useState } from "react";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  /**
   * Initialize wallet from stored session
   */
  useEffect(() => {
    (async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const isValid = await isSessionValid();
        if (isValid) {
          const session = await loadSession();
          if (session) {
            setState((prev) => ({
              ...prev,
              address: session.walletAddress,
              isConnected: true,
              isLoading: false,
            }));
            return;
          }
        }

        // No valid session, try to get stored wallet
        const wallet = await getStoredWallet();
        if (wallet) {
          setState((prev) => ({
            ...prev,
            address: wallet,
            isConnected: false,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            address: null,
            isConnected: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error("[useWallet] Init error:", error);
        setState((prev) => ({
          ...prev,
          address: null,
          isConnected: false,
          isLoading: false,
          error: "Failed to load wallet",
        }));
      }
    })();
  }, []);

  /**
   * Connect to wallet
   */
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result: WalletConnectResult = await connectWallet();

      // Save session
      await saveSession({
        walletAddress: result.walletAddress,
        authToken: result.authToken,
        createdAt: result.timestamp,
      });

      setState((prev) => ({
        ...prev,
        address: result.walletAddress,
        isConnected: true,
        isLoading: false,
        error: null,
      }));

      return result.walletAddress;
    } catch (error: any) {
      const message = error?.message || "Failed to connect wallet";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  /**
   * Disconnect from wallet
   */
  const disconnect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await disconnectWallet();
      await clearSession();

      setState((prev) => ({
        ...prev,
        address: null,
        isConnected: false,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const message = error?.message || "Failed to disconnect wallet";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  /**
   * Format address for display
   */
  const formatAddress = useCallback(
    (chars = 6) => formatWalletAddress(state.address || "", chars),
    [state.address]
  );

  return {
    address: state.address,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    connect,
    disconnect,
    formatAddress,
  };
}
