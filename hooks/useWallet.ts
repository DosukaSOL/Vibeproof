/**
 * useWallet Hook
 * Re-exports from WalletContext for shared state across ALL screens.
 * This ensures wallet state (connected/address) is synchronized everywhere.
 */
export { useWallet } from "@/context/WalletContext";

// Legacy type export for backward compatibility
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}
