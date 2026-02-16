/**
 * useMissionEngine Hook
 * Manages the full mission lifecycle using LOCAL templates + verification.
 * No Supabase dependency — missions work fully offline.
 */
import {
  getDailyMissions,
  getOneTimeMissions,
  MissionTemplate,
} from "@/lib/missionTemplates";
import {
  addCompletion,
  addXP,
  getCompletions,
  getLocalUser,
  hasSocialLink,
  isDailyMissionCompleted,
  isOneTimeMissionCompleted,
  LocalCompletion,
} from "@/lib/localStore";
import { verifyMission } from "@/lib/localVerify";
import { useCallback, useEffect, useState } from "react";

export type MissionTab = "repeatable" | "one_time";

export interface MissionEngineState {
  repeatableMissions: MissionTemplate[];
  oneTimeMissions: MissionTemplate[];
  completedIds: Set<string>;
  isLoading: boolean;
  isVerifying: string | null;
  error: string | null;
  activeTab: MissionTab;
  verificationStatus: Record<string, "idle" | "verifying" | "verified" | "failed">;
}

export function useMissionEngine(walletAddress: string | null) {
  const [repeatableMissions, setRepeatableMissions] = useState<MissionTemplate[]>([]);
  const [oneTimeMissions, setOneTimeMissions] = useState<MissionTemplate[]>([]);
  const [completions, setCompletions] = useState<LocalCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MissionTab>("repeatable");
  const [verificationStatus, setVerificationStatus] = useState<
    Record<string, "idle" | "verifying" | "verified" | "failed">
  >({});

  const load = useCallback(async () => {
    if (!walletAddress) {
      setRepeatableMissions([]);
      setOneTimeMissions([]);
      setCompletions([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      const daily = getDailyMissions(today);
      const oneTime = getOneTimeMissions();
      const userCompletions = await getCompletions(walletAddress);

      setRepeatableMissions(daily);
      setOneTimeMissions(oneTime);
      setCompletions(userCompletions);

      await autoCompleteOneTimeMissions(walletAddress, oneTime, userCompletions);
    } catch (e: any) {
      setError(e?.message || "Failed to load missions");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    load();
  }, [load]);

  const autoCompleteOneTimeMissions = async (
    wallet: string,
    missions: MissionTemplate[],
    existingCompletions: LocalCompletion[]
  ) => {
    for (const mission of missions) {
      const alreadyDone = existingCompletions.some((c) => c.missionId === mission.id);
      if (alreadyDone) continue;

      let shouldAutoComplete = false;

      if (mission.verification_type === "app_action") {
        const action = mission.verification_config?.action;
        if (action === "first_connect") {
          shouldAutoComplete = true;
        } else if (action === "set_username") {
          const user = await getLocalUser(wallet);
          shouldAutoComplete = !!user?.username && user.username.length > 0;
        } else if (action === "daily_checkin") {
          shouldAutoComplete = true;
        }
      } else if (mission.verification_type === "social_link") {
        const provider = mission.verification_config?.provider;
        if (provider) {
          shouldAutoComplete = await hasSocialLink(wallet, provider);
        }
      }

      if (shouldAutoComplete) {
        try {
          await addCompletion(wallet, {
            missionId: mission.id,
            completedAt: new Date().toISOString(),
            xpAwarded: mission.xp_reward,
            date: new Date().toISOString().split("T")[0],
          });
          await addXP(wallet, mission.xp_reward);
          setCompletions((prev) => [
            ...prev,
            {
              missionId: mission.id,
              completedAt: new Date().toISOString(),
              xpAwarded: mission.xp_reward,
              date: new Date().toISOString().split("T")[0],
            },
          ]);
        } catch {
          // Ignore auto-complete errors
        }
      }
    }
  };

  const isInstanceCompleted = useCallback(
    (missionId: string) => completions.some((c) => c.missionId === missionId),
    [completions]
  );

  const isOneTimeCompleted = useCallback(
    (missionId: string) => completions.some((c) => c.missionId === missionId),
    [completions]
  );

  const getVerificationStatus = useCallback(
    (missionId: string): "idle" | "verifying" | "verified" | "failed" => {
      return verificationStatus[missionId] || "idle";
    },
    [verificationStatus]
  );

  const verifyInstance = useCallback(
    async (mission: MissionTemplate) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      setVerificationStatus((prev) => ({ ...prev, [mission.id]: "verifying" }));

      try {
        const result = await verifyMission(
          walletAddress,
          mission.verification_type,
          mission.verification_config || {}
        );

        if (result.verified) {
          await addCompletion(walletAddress, {
            missionId: mission.id,
            completedAt: new Date().toISOString(),
            xpAwarded: mission.xp_reward,
            date: new Date().toISOString().split("T")[0],
          });
          await addXP(walletAddress, mission.xp_reward);
          setCompletions((prev) => [
            ...prev,
            {
              missionId: mission.id,
              completedAt: new Date().toISOString(),
              xpAwarded: mission.xp_reward,
              date: new Date().toISOString().split("T")[0],
            },
          ]);
          setVerificationStatus((prev) => ({ ...prev, [mission.id]: "verified" }));
          return { status: "verified", verification_result: result };
        } else {
          setVerificationStatus((prev) => ({ ...prev, [mission.id]: "failed" }));
          return { status: "failed", verification_result: result };
        }
      } catch (e: any) {
        setVerificationStatus((prev) => ({ ...prev, [mission.id]: "failed" }));
        throw e;
      }
    },
    [walletAddress]
  );

  const verifyOneTime = useCallback(
    async (mission: MissionTemplate) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      return verifyInstance(mission);
    },
    [walletAddress, verifyInstance]
  );

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

      setVerificationStatus((prev) => ({ ...prev, [missionId]: "verifying" }));

      try {
        await addCompletion(walletAddress, {
          missionId,
          completedAt: new Date().toISOString(),
          xpAwarded: xpReward,
          date: new Date().toISOString().split("T")[0],
        });
        await addXP(walletAddress, xpReward);
        setCompletions((prev) => [
          ...prev,
          {
            missionId,
            completedAt: new Date().toISOString(),
            xpAwarded: xpReward,
            date: new Date().toISOString().split("T")[0],
          },
        ]);
        setVerificationStatus((prev) => ({ ...prev, [missionId]: "verified" }));
        return { status: "verified" };
      } catch (e: any) {
        setVerificationStatus((prev) => ({ ...prev, [missionId]: "failed" }));
        throw e;
      }
    },
    [walletAddress]
  );

  const refresh = useCallback(async () => { await load(); }, [load]);

  return {
    repeatableMissions,
    oneTimeMissions,
    completions,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    verificationStatus,
    isInstanceCompleted,
    isOneTimeCompleted,
    getVerificationStatus,
    verifyInstance,
    verifyOneTime,
    submitManualProof,
    refresh,
  };
}
