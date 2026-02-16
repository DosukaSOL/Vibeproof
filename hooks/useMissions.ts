/**
 * useMissions Hook
 * Manages missions list and completion state
 */
import {
    DbCompletion,
    DbMission,
    getMissions,
    getUserCompletions,
    submitMissionCompletion
} from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export interface MissionsState {
  missions: DbMission[];
  completions: DbCompletion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export function useMissions(walletAddress: string | null) {
  const [state, setState] = useState<MissionsState>({
    missions: [],
    completions: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  });

  /**
   * Load missions and user's completions
   */
  const loadMissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [missions, completions] = await Promise.all([
        getMissions(),
        walletAddress ? getUserCompletions(walletAddress) : Promise.resolve([]),
      ]);

      setState((prev) => ({
        ...prev,
        missions,
        completions,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error?.message || "Failed to load missions";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [walletAddress]);

  /**
   * Load missions on mount and when wallet changes
   */
  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  /**
   * Submit mission completion
   */
  const submitCompletion = useCallback(
    async (missionId: string, proof: string) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

        const completion = await submitMissionCompletion(
          walletAddress,
          missionId,
          proof
        );

        setState((prev) => ({
          ...prev,
          completions: [...prev.completions, completion],
          isSubmitting: false,
        }));

        return completion;
      } catch (error: any) {
        const message = error?.message || "Failed to submit completion";
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: message,
        }));
        throw error;
      }
    },
    [walletAddress]
  );

  /**
   * Check if mission is completed
   */
  const isCompleted = useCallback(
    (missionId: string) => {
      return state.completions.some(
        (c) => c.mission_id === missionId && c.verified
      );
    },
    [state.completions]
  );

  /**
   * Get mission by ID
   */
  const getMissionById = useCallback(
    (id: string) => {
      return state.missions.find((m) => m.id === id);
    },
    [state.missions]
  );

  /**
   * Refresh missions
   */
  const refresh = useCallback(async () => {
    await loadMissions();
  }, [loadMissions]);

  return {
    missions: state.missions,
    completions: state.completions,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    submitCompletion,
    isCompleted,
    getMissionById,
    refresh,
  };
}
