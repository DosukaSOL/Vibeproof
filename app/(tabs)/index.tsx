import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';
import { connectAndSignIn } from '../../lib/solanaMobile';

type Quest = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  active_date: string;

  active?: boolean | null;
  is_sponsored?: boolean | null;
  sponsor_name?: string | null;
  sponsor_url?: string | null;
  xp_multiplier?: number | null;
  max_completions?: number | null;
};

const LEVEL_XP = 1000;

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.barOuter}>
      <View style={[styles.barInner, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
  );
}

export default function MissionsHome() {
  const { wallet, authToken, setSession, loading: sessionLoading } = useSession();

  const [userStats, setUserStats] = useState<{ xp: number; level: number; streak: number } | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const ensureUser = async (w: string) => {
    const { error } = await supabase.from('users').upsert({ wallet: w }, { onConflict: 'wallet' });
    if (error) throw error;
  };

  const fetchStats = async (w: string) => {
    const { data, error } = await supabase.from('users')
      .select('xp,level,streak')
      .eq('wallet', w)
      .single();

    if (error) throw error;

    setUserStats({
      xp: Number(data.xp ?? 0),
      level: Number(data.level ?? 1),
      streak: Number(data.streak ?? 0),
    });
  };

  const load = async (w: string) => {
    setLoading(true);
    try {
      await ensureUser(w);

      const { data: qData, error: qErr } = await supabase
        .from('quests')
        .select('id,title,description,xp_reward,active_date,active,is_sponsored,sponsor_name,sponsor_url,xp_multiplier,max_completions')       
        .eq('active_date', todayISO)
        .eq('active', true)
        .order('xp_reward', { ascending: false });

      if (qErr) throw qErr;
      setQuests(qData ?? []);

      const { data: cData, error: cErr } = await supabase
        .from('quest_completions')
        .select('quest_id')
        .eq('wallet', w);

      if (cErr) throw cErr;
      setCompletedQuestIds(new Set((cData ?? []).map((x: any) => x.quest_id)));

      await fetchStats(w);
    } catch (e: any) {
      Alert.alert('Supabase error', e.message ?? 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };
  const connectWallet = async () => {
    try {
      const res = await connectAndSignIn(authToken);
      await setSession({ wallet: res.walletAddress, authToken: res.authToken });
      await load(res.walletAddress);
      Alert.alert('Connected', res.walletAddress);
    } catch (e: any) {
      Alert.alert('Wallet connect failed', e.message ?? 'Unknown error');
    }
  };

  const disconnectWallet = async () => {
    await setSession({ wallet: null, authToken: null });
    setUserStats(null);
    setQuests([]);
    setCompletedQuestIds(new Set());
  };
const completeQuest = async (quest: Quest) => {
  if (!wallet) {
    Alert.alert('Not connected', 'Connect your wallet first.');
    return;
  }

  try {
// Enforce max_completions (global cap)
if (quest.max_completions && Number(quest.max_completions) > 0) {
  const { data: stat, error: statErr } = await supabase
    .from('quest_stats')
    .select('completion_count')
    .eq('quest_id', quest.id)
    .maybeSingle();

  // If no row exists yet, that's fine (treat as 0)
  if (statErr) throw statErr;

  const currentCount = Number(stat?.completion_count ?? 0);

  if (currentCount >= Number(quest.max_completions)) {
    Alert.alert('Quest ended', 'This sponsored quest hit its max completions.');
    return;
  }
}
    // 1) Insert completion row (prevents double-completing)
    const { error: insErr } = await supabase.from('quest_completions').insert({
      wallet,
      quest_id: quest.id,
    });

    if (insErr) {
      const msg = String(insErr.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        Alert.alert('Already completed', 'You already completed this quest.');
        return;
      }
      throw insErr;
    }

    // 2) Fetch latest user row
    const { data: uData, error: uErr } = await supabase
      .from('users')
      .select('xp,level,streak,last_checkin_date')
      .eq('wallet', wallet)
      .single();

    if (uErr) throw uErr;

    // 3) Streak logic + daily bonus (first completion of the day)
    const last = (uData.last_checkin_date as string | null) ?? null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const isFirstActionToday = last !== todayISO;
    const prevStreak = Number(uData.streak ?? 0);

    let streakNew = prevStreak;
    if (isFirstActionToday) {
      streakNew = last === yesterday ? prevStreak + 1 : 1;
    }

    const baseXP = Number(quest.xp_reward ?? 0);
    const mult = Number(quest.xp_multiplier ?? 1);
    const questXP = Math.max(1, Math.floor(baseXP * mult));   
    const dailyBonus = isFirstActionToday ? 25 + Math.min(75, prevStreak * 5) : 0; // scales with streak
    const gainedXP = questXP + dailyBonus;

    const xpNew = Number(uData.xp ?? 0) + gainedXP;
    const levelNew = Math.floor(xpNew / LEVEL_XP) + 1;

    // 4) Update user stats
    const { error: upErr } = await supabase
      .from('users')
      .update({
        xp: xpNew,
        level: levelNew,
        streak: streakNew,
        last_checkin_date: todayISO,
      })
      .eq('wallet', wallet);

    if (upErr) throw upErr;

    // 5) Update UI state (functional update avoids stale state bugs)
    setCompletedQuestIds((prev) => new Set([...Array.from(prev), quest.id]));
    setUserStats({ xp: xpNew, level: levelNew, streak: streakNew });

    Alert.alert(
      'Quest complete!',
      dailyBonus > 0 ? `+${questXP} XP\n+${dailyBonus} Daily bonus 🎁` : `+${questXP} XP`
    );
  } catch (e: any) {
    Alert.alert('Complete failed', e?.message ?? 'Unknown error');
  }
};
  const showLogin = sessionLoading || !wallet;

  const xp = userStats?.xp ?? 0;
  const level = userStats?.level ?? 1;
  const streak = userStats?.streak ?? 0;

  const xpIntoLevel = xp % LEVEL_XP;
  const xpToNext = LEVEL_XP - xpIntoLevel;
  const progress = xpIntoLevel / LEVEL_XP;

  return (
    <View style={styles.container}>
      {showLogin ? (
        <>
          <Text style={styles.title}>VibeProof</Text>
          <Text style={styles.subtitle}>Seeker login: connect your wallet</Text>

          <Pressable style={styles.button} onPress={connectWallet} disabled={sessionLoading}>
            <Text style={styles.buttonText}>
              {sessionLoading ? 'Loading…' : 'Connect Wallet'}
            </Text>
          </Pressable>

          <Text style={styles.subtitle}>
            Tip: Install Phantom or another Solana wallet.
          </Text>
        </>
      ) : (
        <>
          <View style={styles.topCard}>
            <View style={styles.topRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue}>{level}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Streak</Text>
                <Text style={styles.statValue}>{streak}🔥</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>XP</Text>
                <Text style={styles.statValue}>{xp}</Text>
              </View>
            </View>

            <Text style={styles.progressLabel}>
              {xpIntoLevel}/{LEVEL_XP} XP • {xpToNext} to next level
            </Text>

            <ProgressBar progress={progress} />
          </View>

          <Text style={styles.h1}>Today’s Missions</Text>

          <FlatList
            data={quests}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={() => load(wallet)} />
            }
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            renderItem={({ item }) => {
              const done = completedQuestIds.has(item.id);

              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>

                  {!!item.description && (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  )}
{item.is_sponsored ? (
  <Text style={styles.badge}>
    Sponsored{item.sponsor_name ? ` • ${item.sponsor_name}` : ''}
  </Text>
) : null}

{item.is_sponsored && item.sponsor_url ? (
  <Text style={styles.sponsorUrl}>{item.sponsor_url}</Text>
) : null}
                  <View style={styles.cardRow}>
                    <Text style={styles.xp}>+{item.xp_reward} XP</Text>

                    <Pressable
                      onPress={() => completeQuest(item)}
                      style={[styles.btn, done && styles.btnDone]}
                      disabled={done}
                    >
                      <Text style={styles.btnText}>
                        {done ? 'Completed' : 'Complete'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>No quests today.</Text>
            }
          />

          <Pressable style={styles.linkBtn} onPress={disconnectWallet}>
            <Text style={styles.linkText}>Disconnect wallet</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({

badge: {
  alignSelf: 'flex-start',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: '#111',
  fontWeight: '900',
  color: '#000',
  marginTop: 6,
},
sponsorUrl: { opacity: 0.6, fontSize: 12, color: '#000' },
  container: { flex: 1, padding: 16, backgroundColor: '#fff', gap: 10 },

  title: { fontSize: 34, fontWeight: '800', color: '#000' },
  subtitle: { fontSize: 14, opacity: 0.7, color: '#000' },

  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#111',
    marginVertical: 12,
  },
  buttonText: { color: 'white', fontWeight: '700' },

  topCard: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', gap: 10 },

  stat: { flex: 1 },
  statLabel: { opacity: 0.6, fontWeight: '700', color: '#000' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#000' },

  progressLabel: { opacity: 0.8, fontWeight: '700', color: '#000' },
  barOuter: { height: 12, borderRadius: 999, backgroundColor: '#eee', overflow: 'hidden' },
  barInner: { height: '100%', backgroundColor: '#111' },

  h1: { fontSize: 24, fontWeight: '800', color: '#000' },

  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#000' },
  cardDesc: { opacity: 0.75, color: '#000' },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  xp: { fontWeight: '800', color: '#000' },

  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#111',
  },
  btnDone: { backgroundColor: '#666' },

  btnText: { color: 'white', fontWeight: '800' },

  linkBtn: { padding: 12, alignItems: 'center' },
  linkText: { fontWeight: '800', color: '#000' },

  empty: { opacity: 0.7, color: '#000' },
});
