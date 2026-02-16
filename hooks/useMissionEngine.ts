/**
 * useMissionEngine Hook
 * Manages the full mission lifecycle: generation, display, verification
 */
import {
    generateMissionInstances,
    getActiveMissions,
    getOneTimeMissions,
    getUserMissionCompletions,
    hasCompletedInstance,
    hasCompletedOneTime,
    MissionCompletion,
    MissionInstance,
    MissionTemplate,
    verifyAndComplete,
} from "@/lib/missionEngine";
import { useCallback, useEffect, useState } from "react";

export type MissionTab = "repeatable" | "one_time";

export interface MissionEngineState {
  repeatableMissions: MissionInstance[];
  oneTimeMissions: MissionTemplate[];
  completions: MissionCompletion[];
  isLoading: boolean;
  isVerifying: string | null; // ID of mission currently being verified
  error: string | null;
  activeTab: MissionTab;
  verificationStatus: Record<string, "idle" | "verifying" | "verified" | "failed">;
}

export function useMissionEngine(walletAddress: string | null) {
  const [state, setState] = useState<MissionEngineState>({
    repeatableMissions: [],
    oneTimeMissions: [],
    completions: [],
    isLoading: false,
    isVerifying: null,
    error: null,
    activeTab: "repeatable",
    verificationStatus: {},
  });

  // ─── Load missions + generate today's instances ────
  const loadMissions = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Generate today's instances (idempotent)
      await generateMissionInstances();

      // Fetch everything in parallel
      const [repeatable, oneTime, completions] = await Promise.all([
        getActiveMissions(),
        getOneTimeMissions(),
        getUserMissionCompletions(walletAddress),
      ]);

      setState((prev) => ({
        ...prev,
        repeatableMissions: repeatable,
        oneTimeMissions: oneTime,
        completions,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || "Failed to load missions",
      }));
    }
  }, [walletAddress]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // ─── Tab switching ─────────────────────────────────
  const setActiveTab = useCallback((tab: MissionTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // ─── Verify a repeatable mission instance ──────────
  const verifyInstance = useCallback(
    async (instance: MissionInstance) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      const missionId = instance.id;
      setState((prev) => ({
        ...prev,
        isVerifying: missionId,
        verificationStatus: { ...prev.verificationStatus, [missionId]: "verifying" },
        error: null,
      }));

      try {
        const completion = await verifyAndComplete(walletAddress, {
          instanceId: instance.id,
          verificationType: instance.verification_type,
          verificationConfig: instance.verification_config,
          xpReward: instance.xp_reward,
        });

        setState((prev) => ({
          ...prev,
          isVerifying: null,
          completions: [completion, ...prev.completions],
          verificationStatus: {
            ...prev.verificationStatus,
            [missionId]: completion.status === "verified" ? "verified" : "failed",
          },
        }));

        return completion;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isVerifying: null,
          verificationStatus: { ...prev.verificationStatus, [missionId]: "failed" },
          error: error?.message || "Verification failed",
        }));
        throw error;
      }
    },
    [walletAddress]
  );

  // ─── Verify a one-time mission template ────────────
  const verifyOneTime = useCallback(
    async (template: MissionTemplate) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      const missionId = template.id;
      setState((prev) => ({
        ...prev,
        isVerifying: missionId,
        verificationStatus: { ...prev.verificationStatus, [missionId]: "verifying" },
        error: null,
      }));

      try {
        const completion = await verifyAndComplete(walletAddress, {
          templateId: template.id,
          verificationType: template.verification_type,
          verificationConfig: template.verification_config,
          xpReward: template.xp_reward,
        });

        setState((prev) => ({
          ...prev,
          isVerifying: null,
          completions: [completion, ...prev.completions],
          verificationStatus: {
            ...prev.verificationStatus,
            [missionId]: completion.status === "verified" ? "verified" : "failed",
          },
        }));

        return completion;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isVerifying: null,
          verificationStatus: { ...prev.verificationStatus, [missionId]: "failed" },
          error: error?.message || "Verification failed",
        }));
        throw error;
      }
    },
    [walletAddress]
  );

  // ─── Submit manual proof for a mission ─────────────
  const submitManualProof = useCallback(
    async (
      opts: { instanceId?: string; templateId?: string },
      proof: string,
      verificationType: string,
      verificationConfig: Record<string, any>,
      xpReward: number
    ) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      const missionId = opts.instanceId || opts.templateId || "";
      setState((prev) => ({
        ...prev,
        isVerifying: missionId,
        verificationStatus: { ...prev.verificationStatus, [missionId]: "verifying" },
        error: null,
      }));

      try {
        const completion = await verifyAndComplete(walletAddress, {
          ...opts,
          verificationType,
          verificationConfig,
          xpReward,
          manualProof: proof,
        });

        setState((prev) => ({
          ...prev,
          isVerifying: null,
          completions: [completion, ...prev.completions],
          verificationStatus: {
            ...prev.verificationStatus,
            [missionId]: completion.status === "verified" ? "verified" : "failed",
          },
        }));

        return completion;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isVerifying: null,
          verificationStatus: { ...prev.verificationStatus, [missionId]: "failed" },
          error: error?.message || "Submission failed",
        }));
        throw error;
      }
    },
    [walletAddress]
  );

  // ─── Completion checkers ───────────────────────────
  const isInstanceCompleted = useCallback(
    (instanceId: string) => hasCompletedInstance(state.completions, instanceId),
    [state.completions]
  );

  const isOneTimeCompleted = useCallback(
    (templateId: string) => hasCompletedOneTime(state.completions, templateId),
    [state.completions]
  );

  const getVerificationStatus = useCallback(
    (missionId: string) => state.verificationStatus[missionId] || "idle",
    [state.verificationStatus]
  );

  // ─── Refresh ───────────────────────────────────────
  const refresh = useCallback(async () => {
    await loadMissions();
  }, [loadMissions]);

  return {
    repeatableMissions: state.repeatableMissions,
    oneTimeMissions: state.oneTimeMissions,
    completions: state.completions,
    isLoading: state.isLoading,
    isVerifying: state.isVerifying,
    error: state.error,
    activeTab: state.activeTab,
    setActiveTab,
    verifyInstance,
    verifyOneTime,
    submitManualProof,
    isInstanceCompleted,
    isOneTimeCompleted,
    getVerificationStatus,
    refresh,
  };
}
