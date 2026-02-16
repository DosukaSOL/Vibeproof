/**
 * WalletContext — shared wallet state across ALL screens
 * This is the single source of truth for wallet connection.
 */
import {
    clearSession,
    isSessionValid,
    loadSession,
    saveSession,
} from "@/lib/auth";
import { createLocalUser } from "@/lib/localStore";
import {
    connectWallet,
    disconnectWallet,
    formatWalletAddress,
    WalletConnectResult,
} from "@/lib/solana";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  formatAddress: (chars?: number) => string;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isLoading: true,
  error: null,
  connect: async () => "",
  disconnect: async () => {},
  formatAddress: () => "",
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const valid = await isSessionValid();
        if (valid) {
          const session = await loadSession();
          if (session?.walletAddress) {
            // Ensure local user profile exists
            try {
              await createLocalUser(session.walletAddress);
            } catch (e) {
              console.warn("[WalletProvider] createLocalUser warning:", e);
            }
            setAddress(session.walletAddress);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error("[WalletProvider] Init error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const connect = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const result: WalletConnectResult = await connectWallet();

      // Save session for persistence
      await saveSession({
        walletAddress: result.walletAddress,
        authToken: result.authToken,
        createdAt: result.timestamp,
      });

      // Auto-create local user profile
      try {
        await createLocalUser(result.walletAddress);
      } catch (e) {
        console.warn("[WalletProvider] createLocalUser warning:", e);
      }

      setAddress(result.walletAddress);
      setIsConnected(true);
      setIsLoading(false);
      return result.walletAddress;
    } catch (err: any) {
      const msg = err?.message || "Failed to connect wallet";
      setError(msg);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
      await clearSession();
      setAddress(null);
      setIsConnected(false);
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatAddr = useCallback(
    (chars = 6) => formatWalletAddress(address || "", chars),
    [address]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isLoading,
        error,
        connect,
        disconnect,
        formatAddress: formatAddr,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
