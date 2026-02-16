/**
 * On-Chain Mission Verification
 * Verifies Solana on-chain actions for mission completion
 */
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CONFIG } from "./config";

// RPC connection (mainnet-beta by default)
const RPC_URL =
  CONFIG.SOLANA_CLUSTER === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

// ─── Types ───────────────────────────────────────────
export interface VerificationResult {
  verified: boolean;
  proof: Record<string, any>;
  message: string;
}

// ─── Verify: Any Transaction in Window ───────────────
/**
 * Check if wallet had any transaction within the given window
 */
export async function verifyRecentTransaction(
  walletAddress: string,
  windowHours = 24
): Promise<VerificationResult> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(pubkey, {
      limit: 10,
    });

    if (signatures.length === 0) {
      return {
        verified: false,
        proof: {},
        message: "No recent transactions found",
      };
    }

    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

    for (const sig of signatures) {
      const blockTime = sig.blockTime ? sig.blockTime * 1000 : 0;
      if (blockTime >= cutoff && !sig.err) {
        return {
          verified: true,
          proof: {
            signature: sig.signature,
            blockTime: sig.blockTime,
            slot: sig.slot,
          },
          message: `Transaction found: ${sig.signature.slice(0, 16)}...`,
        };
      }
    }

    return {
      verified: false,
      proof: {},
      message: `No transactions within the last ${windowHours} hours`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `Verification error: ${error.message}`,
    };
  }
}

// ─── Verify: Minimum SOL Balance ─────────────────────
/**
 * Check if wallet holds at least minBalance SOL
 */
export async function verifyMinBalance(
  walletAddress: string,
  minBalance = 0.1
): Promise<VerificationResult> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    if (solBalance >= minBalance) {
      return {
        verified: true,
        proof: {
          balance: solBalance,
          minRequired: minBalance,
          lamports: balance,
        },
        message: `Balance: ${solBalance.toFixed(4)} SOL (≥ ${minBalance} SOL)`,
      };
    }

    return {
      verified: false,
      proof: { balance: solBalance, minRequired: minBalance },
      message: `Balance ${solBalance.toFixed(4)} SOL is below ${minBalance} SOL minimum`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `Balance check error: ${error.message}`,
    };
  }
}

// ─── Verify: Program Interaction ─────────────────────
/**
 * Check if wallet interacted with a specific program recently
 */
export async function verifyProgramInteraction(
  walletAddress: string,
  programId: string,
  windowHours = 24
): Promise<VerificationResult> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(pubkey, {
      limit: 50,
    });

    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

    for (const sig of signatures) {
      const blockTime = sig.blockTime ? sig.blockTime * 1000 : 0;
      if (blockTime < cutoff || sig.err) continue;

      // Fetch full transaction to check program IDs
      const tx = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.transaction?.message) continue;

      const accountKeys = tx.transaction.message.getAccountKeys();
      const hasProgram = accountKeys
        .staticAccountKeys
        .some((key: PublicKey) => key.toString() === programId);

      if (hasProgram) {
        return {
          verified: true,
          proof: {
            signature: sig.signature,
            programId,
            blockTime: sig.blockTime,
          },
          message: `Found interaction with program ${programId.slice(0, 8)}...`,
        };
      }
    }

    return {
      verified: false,
      proof: { programId },
      message: `No interaction with program ${programId.slice(0, 8)}... in the last ${windowHours} hours`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `Program verification error: ${error.message}`,
    };
  }
}

// ─── Verify: Self-Transfer ───────────────────────────
/**
 * Check if wallet sent a transfer (to self or known address) 
 */
export async function verifySelfTransfer(
  walletAddress: string,
  windowHours = 24
): Promise<VerificationResult> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(pubkey, {
      limit: 20,
    });

    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

    for (const sig of signatures) {
      const blockTime = sig.blockTime ? sig.blockTime * 1000 : 0;
      if (blockTime < cutoff || sig.err) continue;

      const tx = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.meta) continue;

      // Check if this wallet's balance changed (sent SOL)
      const accountKeys = tx.transaction.message.getAccountKeys();
      const walletIndex = accountKeys.staticAccountKeys.findIndex(
        (key: PublicKey) => key.toString() === walletAddress
      );

      if (walletIndex >= 0) {
        const preBalance = tx.meta.preBalances[walletIndex] || 0;
        const postBalance = tx.meta.postBalances[walletIndex] || 0;
        const feePayer = accountKeys.staticAccountKeys[0]?.toString();

        // If this wallet is fee payer and balance decreased 
        if (feePayer === walletAddress && preBalance > postBalance) {
          return {
            verified: true,
            proof: {
              signature: sig.signature,
              lamportsSent: preBalance - postBalance,
              blockTime: sig.blockTime,
            },
            message: `Transfer found: ${sig.signature.slice(0, 16)}...`,
          };
        }
      }
    }

    return {
      verified: false,
      proof: {},
      message: "No transfers found in the given time window",
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `Transfer verification error: ${error.message}`,
    };
  }
}

// ─── Dispatcher ──────────────────────────────────────
/**
 * Run the appropriate verification based on type + config
 */
export async function verifyOnChain(
  walletAddress: string,
  verificationType: string,
  config: Record<string, any>
): Promise<VerificationResult> {
  switch (verificationType) {
    case "on_chain_tx":
      return verifyRecentTransaction(
        walletAddress,
        config.window_hours || 24
      );

    case "on_chain_balance":
      return verifyMinBalance(walletAddress, config.min_balance || 0.1);

    case "on_chain_program":
      if (!config.program_id) {
        return {
          verified: false,
          proof: {},
          message: "No program_id configured",
        };
      }
      return verifyProgramInteraction(
        walletAddress,
        config.program_id,
        config.window_hours || 24
      );

    case "on_chain_transfer":
      return verifySelfTransfer(
        walletAddress,
        config.window_hours || 24
      );

    default:
      return {
        verified: false,
        proof: {},
        message: `Unknown on-chain verification type: ${verificationType}`,
      };
  }
}
