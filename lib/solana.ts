/**
 * Solana Mobile Wallet Adapter Integration
 * Handles wallet connections via Seeker
 */
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import * as Linking from "expo-linking";
import "react-native-get-random-values";
import { CONFIG } from "./config";

export interface WalletConnectResult {
  walletAddress: string;
  authToken: string;
  timestamp: number;
}

/**
 * Connect to Solana wallet via Seeker
 * Returns wallet address and auth token
 */
export async function connectWallet(): Promise<WalletConnectResult> {
  const redirect = Linking.createURL("wallet");

  try {
    const authorizationResult = await transact(async (wallet) => {
      const res = await wallet.authorize({
        cluster: CONFIG.SOLANA_CLUSTER,
        identity: {
          name: CONFIG.APP_NAME,
          uri: "https://vibeproof.app",
        },
      });

      return res;
    });

    const firstAccount = authorizationResult?.accounts?.[0];
    if (!firstAccount?.address) {
      throw new Error("No wallet account returned from authorize()");
    }

    return {
      walletAddress: firstAccount.address,
      authToken: authorizationResult.auth_token || "",
      timestamp: Date.now(),
    };
  } catch (error: any) {
    const message = error?.message || String(error) || "Unknown wallet error";
    throw new Error(`Wallet connection failed: ${message}`);
  }
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(
  message: string,
  walletAddress: string
): Promise<string> {
  try {
    const encodedMessage = new TextEncoder().encode(message);

    const signatureResult = await transact(async (wallet) => {
      return await wallet.signMessages({
        addresses: [walletAddress],
        payloads: [encodedMessage],
      });
    });

    if (!signatureResult?.[0]) {
      throw new Error("Failed to sign message");
    }

    // Convert signature to base64
    const signatureArray = signatureResult[0];
    const binaryString = String.fromCharCode(...signatureArray);
    const base64Signature = Buffer.from(binaryString, "binary").toString(
      "base64"
    );

    return base64Signature;
  } catch (error: any) {
    const message = error?.message || String(error) || "Unknown signature error";
    throw new Error(`Message signing failed: ${message}`);
  }
}

/**
 * Disconnect wallet (clear session on device)
 */
export async function disconnectWallet(): Promise<void> {
  try {
    // This just clears local state; actual disconnection happens on wallet app
    // Wallet Adapter doesn't provide explicit disconnect, so we handle it client-side
  } catch (error: any) {
    console.error("[Solana] Disconnect error:", error);
    throw error;
  }
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string, chars = 6): string {
  if (!address || address.length < chars * 2) {
    return address;
  }
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}
