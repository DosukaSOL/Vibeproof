/**
 * useMissionEngine Hook
 * Manages the full mission lifecycle using LOCAL templates + verification.
 * No Supabase dependency — missions work fully offline.
 */
import {
    addCompletion,
    addXP,
    getCompletions,
    getLocalUser,
    getStreakMultiplier,
    hasSocialLink,
    LocalCompletion
} from "@/lib/localStore";
import { verifyMission } from "@/lib/localVerify";
import {
    getDailyMissions,
    getOneTimeMissions,
    getWeeklyMissions,
    MissionTemplate,
} from "@/lib/missionTemplates";
import { useCallback, useEffect, useState } from "react";

export type MissionTab = "repeatable" | "one_time" | "weekly";

export interface MissionEngineState {
  repeatableMissions: MissionTemplate[];
  oneTimeMissions: MissionTemplate[];
  weeklyMissions: MissionTemplate[];
  completedIds: Set<string>;
  isLoading: boolean;
  isVerifying: string | null;
  error: string | null;
  activeTab: MissionTab;
  verificationStatus: Record<string, "idle" | "verifying" | "verified" | "failed">;
  streakMultiplier: number;
  lastLevelUp: number | null;
}

export function useMissionEngine(walletAddress: string | null) {
  const [repeatableMissions, setRepeatableMissions] = useState<MissionTemplate[]>([]);
  const [oneTimeMissions, setOneTimeMissions] = useState<MissionTemplate[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<MissionTemplate[]>([]);
  const [completions, setCompletions] = useState<LocalCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MissionTab>("repeatable");
  const [verificationStatus, setVerificationStatus] = useState<
    Record<string, "idle" | "verifying" | "verified" | "failed">
  >({});
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [lastLevelUp, setLastLevelUp] = useState<number | null>(null);

  /** Dismiss level-up celebration */
  const clearLevelUp = useCallback(() => setLastLevelUp(null), []);

  const load = useCallback(async () => {
    if (!walletAddress) {
      setRepeatableMissions([]);
      setOneTimeMissions([]);
      setWeeklyMissions([]);
      setCompletions([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      const daily = getDailyMissions(today);
      const oneTime = getOneTimeMissions();
      const weekly = getWeeklyMissions(today);
      const userCompletions = await getCompletions(walletAddress);

      // Load streak multiplier
      const user = await getLocalUser(walletAddress);
      const mult = getStreakMultiplier(user?.streak ?? 0);
      setStreakMultiplier(mult);

      setRepeatableMissions(daily);
      setOneTimeMissions(oneTime);
      setWeeklyMissions(weekly);
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
        } else if (action === "set_avatar") {
          const user = await getLocalUser(wallet);
          shouldAutoComplete = !!user?.avatarUri && user.avatarUri.length > 0;
        } else if (action === "first_daily") {
          // Auto-complete if user has at least 1 daily mission completion
          const hasDailyCompletion = existingCompletions.some(
            (c) => c.missionId.startsWith("daily_")
          );
          shouldAutoComplete = hasDailyCompletion;
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
          const effectiveXP = Math.round(mission.xp_reward * streakMultiplier);
          await addCompletion(walletAddress, {
            missionId: mission.id,
            completedAt: new Date().toISOString(),
            xpAwarded: effectiveXP,
            date: new Date().toISOString().split("T")[0],
          });
          const { previousLevel } = await addXP(walletAddress, effectiveXP);
          const user = await getLocalUser(walletAddress);
          if (user && user.level > previousLevel) {
            setLastLevelUp(user.level);
          }
          // Refresh multiplier after XP gain (streak may have changed)
          const mult = getStreakMultiplier(user?.streak ?? 0);
          setStreakMultiplier(mult);

          setCompletions((prev) => [
            ...prev,
            {
              missionId: mission.id,
              completedAt: new Date().toISOString(),
              xpAwarded: effectiveXP,
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
    [walletAddress, streakMultiplier]
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
      const effectiveXP = Math.round(xpReward * streakMultiplier);

      setVerificationStatus((prev) => ({ ...prev, [missionId]: "verifying" }));

      try {
        await addCompletion(walletAddress, {
          missionId,
          completedAt: new Date().toISOString(),
          xpAwarded: effectiveXP,
          date: new Date().toISOString().split("T")[0],
        });
        const { previousLevel } = await addXP(walletAddress, effectiveXP);
        const user = await getLocalUser(walletAddress);
        if (user && user.level > previousLevel) {
          setLastLevelUp(user.level);
        }
        const mult = getStreakMultiplier(user?.streak ?? 0);
        setStreakMultiplier(mult);

        setCompletions((prev) => [
          ...prev,
          {
            missionId,
            completedAt: new Date().toISOString(),
            xpAwarded: effectiveXP,
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
    [walletAddress, streakMultiplier]
  );

  const refresh = useCallback(async () => { await load(); }, [load]);

  return {
    repeatableMissions,
    oneTimeMissions,
    weeklyMissions,
    completions,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    verificationStatus,
    streakMultiplier,
    lastLevelUp,
    clearLevelUp,
    isInstanceCompleted,
    isOneTimeCompleted,
    getVerificationStatus,
    verifyInstance,
    verifyOneTime,
    submitManualProof,
    refresh,
  };
}
