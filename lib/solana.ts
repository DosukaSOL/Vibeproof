/**
 * Solana Mobile Wallet Adapter Integration
 * Handles wallet connections via Seeker
 */
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import * as Linking from "expo-linking";
// Note: crypto.getRandomValues is polyfilled in index.js via expo-crypto
import { CONFIG } from "./config";

export interface WalletConnectResult {
  walletAddress: string;
  authToken: string;
  timestamp: number;
}

/**
 * Normalize wallet address to base58.
 * Seeker may return base64-encoded public key bytes instead of base58.
 */
export function normalizeAddress(address: string): string {
  // Try base58 first
  try {
    const pk = new PublicKey(address);
    return pk.toBase58();
  } catch {
    // Not valid base58 — try base64 decode
  }
  try {
    const bytes = Buffer.from(address, "base64");
    if (bytes.length === 32) {
      return new PublicKey(bytes).toBase58();
    }
  } catch {
    // Not valid base64 either
  }
  // Return as-is and let downstream handle any error
  return address;
}

/**
 * Connect to Solana wallet via Seeker
 * Requires user to approve a sign-message step for security.
 */
export async function connectWallet(): Promise<WalletConnectResult> {
  const redirect = Linking.createURL("wallet");

  try {
    const result = await transact(async (wallet) => {
      // Step 1: Authorize — gets wallet address
      const auth = await wallet.authorize({
        cluster: CONFIG.SOLANA_CLUSTER,
        identity: {
          name: CONFIG.APP_NAME,
          uri: "https://vibeproof.app",
        },
      });

      const account = auth?.accounts?.[0];
      if (!account?.address) {
        throw new Error("No wallet account returned from authorize()");
      }

      // Step 2: Sign a login message — forces the user to approve in wallet
      const timestamp = Date.now();
      const loginMessage = `VibeProof Login\nTimestamp: ${timestamp}`;
      const encodedMessage = new TextEncoder().encode(loginMessage);

      await wallet.signMessages({
        addresses: [account.address],
        payloads: [encodedMessage],
      });

      return { auth, timestamp };
    });

    const rawAddress = result.auth.accounts[0].address;
    const base58Address = normalizeAddress(rawAddress);

    return {
      walletAddress: base58Address,
      authToken: result.auth.auth_token || "",
      timestamp: result.timestamp,
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
