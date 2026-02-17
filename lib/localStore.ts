/**
 * Local Data Store — AsyncStorage-backed CRUD for offline-first operation
 * The app works fully without Supabase; this is the primary data layer.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER: "vp_user",
  COMPLETIONS: "vp_completions",
  SOCIAL_LINKS: "vp_social",
};

// ─── Types ──────────────────────────────────────────────

export interface LocalUser {
  wallet: string;
  username: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
  missionsCompleted: number;
  lastActiveDate: string;
  createdAt: string;
  avatarUri?: string;
}

export interface LocalCompletion {
  missionId: string;
  completedAt: string;
  xpAwarded: number;
  date: string; // YYYY-MM-DD for daily tracking
}

export interface SocialLink {
  provider: "x" | "telegram" | "discord" | "github";
  username: string;
  userId?: string;
  linkedAt: string;
}

// ─── User CRUD ──────────────────────────────────────────

export async function getLocalUser(wallet: string): Promise<LocalUser | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.USER}_${wallet}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLocalUser(user: LocalUser): Promise<void> {
  await AsyncStorage.setItem(
    `${KEYS.USER}_${user.wallet}`,
    JSON.stringify(user)
  );
}

export async function createLocalUser(wallet: string): Promise<LocalUser> {
  const existing = await getLocalUser(wallet);
  if (existing) {
    // Update streak logic on daily visit
    const today = todayStr();
    const yesterday = yesterdayStr();
    if (existing.lastActiveDate === yesterday) {
      existing.streak += 1;
      existing.lastActiveDate = today;
      await saveLocalUser(existing);
    } else if (existing.lastActiveDate !== today) {
      existing.streak = 1;
      existing.lastActiveDate = today;
      await saveLocalUser(existing);
    }
    return existing;
  }

  const user: LocalUser = {
    wallet,
    username: "",
    xp: 0,
    streak: 1,
    level: 1,
    rank: 0,
    missionsCompleted: 0,
    lastActiveDate: todayStr(),
    createdAt: new Date().toISOString(),
  };
  await saveLocalUser(user);
  return user;
}

export async function updateLocalUsername(
  wallet: string,
  username: string
): Promise<LocalUser> {
  const user = await getLocalUser(wallet);
  if (!user) throw new Error("User not found");
  user.username = username;
  await saveLocalUser(user);
  return user;
}

export async function updateAvatarUri(
  wallet: string,
  avatarUri: string
): Promise<LocalUser> {
  const user = await getLocalUser(wallet);
  if (!user) throw new Error("User not found");
  user.avatarUri = avatarUri;
  await saveLocalUser(user);
  return user;
}

export async function addXP(
  wallet: string,
  amount: number
): Promise<LocalUser> {
  const user = await getLocalUser(wallet);
  if (!user) throw new Error("User not found");

  user.xp += amount;
  user.level = Math.floor(user.xp / 1000) + 1;
  user.missionsCompleted += 1;

  // Update streak
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (user.lastActiveDate === yesterday) {
    user.streak += 1;
  } else if (user.lastActiveDate !== today) {
    user.streak = 1;
  }
  user.lastActiveDate = today;

  await saveLocalUser(user);
  return user;
}

// ─── Completions CRUD ───────────────────────────────────

export async function getCompletions(
  wallet: string
): Promise<LocalCompletion[]> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.COMPLETIONS}_${wallet}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addCompletion(
  wallet: string,
  completion: LocalCompletion
): Promise<void> {
  const completions = await getCompletions(wallet);
  completions.push(completion);
  await AsyncStorage.setItem(
    `${KEYS.COMPLETIONS}_${wallet}`,
    JSON.stringify(completions)
  );
}

export async function isDailyMissionCompleted(
  wallet: string,
  missionId: string,
  date?: string
): Promise<boolean> {
  const completions = await getCompletions(wallet);
  const targetDate = date || todayStr();
  return completions.some(
    (c) => c.missionId === missionId && c.date === targetDate
  );
}

export async function isOneTimeMissionCompleted(
  wallet: string,
  missionId: string
): Promise<boolean> {
  const completions = await getCompletions(wallet);
  return completions.some((c) => c.missionId === missionId);
}

// ─── Social Links CRUD ──────────────────────────────────

export async function getSocialLinks(
  wallet: string
): Promise<SocialLink[]> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.SOCIAL_LINKS}_${wallet}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSocialLink(
  wallet: string,
  link: SocialLink
): Promise<void> {
  const links = await getSocialLinks(wallet);
  const idx = links.findIndex((l) => l.provider === link.provider);
  if (idx >= 0) links[idx] = link;
  else links.push(link);
  await AsyncStorage.setItem(
    `${KEYS.SOCIAL_LINKS}_${wallet}`,
    JSON.stringify(links)
  );
}

export async function removeSocialLink(
  wallet: string,
  provider: string
): Promise<void> {
  const links = await getSocialLinks(wallet);
  const filtered = links.filter((l) => l.provider !== provider);
  await AsyncStorage.setItem(
    `${KEYS.SOCIAL_LINKS}_${wallet}`,
    JSON.stringify(filtered)
  );
}

export async function hasSocialLink(
  wallet: string,
  provider: string
): Promise<boolean> {
  const links = await getSocialLinks(wallet);
  return links.some((l) => l.provider === provider);
}

// ─── Helpers ────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  return new Date(Date.now() - 86400000).toISOString().split("T")[0];
}
