import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, RefreshControl, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

type Quest = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  active_date: string;
};

export default function MissionsHome() {
  const { wallet, setWallet, loading: sessionLoading } = useSession();
  const [walletDraft, setWalletDraft] = useState(wallet ?? '');

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
    const { data, error } = await supabase.from('users').select('xp,level,streak').eq('wallet', w).single();
    if (error) throw error;
    setUserStats({ xp: Number(data.xp ?? 0), level: Number(data.level ?? 1), streak: Number(data.streak ?? 0) });
  };

  const load = async (w: string) => {
    setLoading(true);
    try {
      await ensureUser(w);

      const { data: qData, error: qErr } = await supabase
        .from('quests')
        .select('id,title,description,xp_reward,active_date')
        .eq('active_date', todayISO)
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

  const enterWallet = async () => {
    const w = walletDraft.trim();
    if (!w || w.length < 20) {
      Alert.alert('Wallet needed', 'Paste a Solana wallet address (MVP login).');
      return;
    }
    await setWallet(w);
    await load(w);
  };

  const changeWallet = async () => {
    await setWallet(null);
    setWalletDraft('');
    setUserStats(null);
    setQuests([]);
    setCompletedQuestIds(new Set());
  };

  const completeQuest = async (quest: Quest) => {
    if (!wallet) return;
    try {
      const { error: insErr } = await supabase.from('quest_completions').insert({
        wallet,
        quest_id: quest.id,
      });

      if (insErr) {
        if (String(insErr.message).toLowerCase().includes('duplicate')) return;
        throw insErr;
      }

      const { data: uData, error: uErr } = await supabase.from('users').select('*').eq('wallet', wallet).single();
      if (uErr) throw uErr;

      const xpNew = Number(uData.xp ?? 0) + Number(quest.xp_reward);
      const levelNew = Math.floor(xpNew / 1000) + 1;

      const last = uData.last_checkin_date as string | null;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      let streakNew = Number(uData.streak ?? 0);
      if (last === todayISO) {
      } else if (last === yesterday) {
        streakNew = streakNew + 1;
      } else {
        streakNew = 1;
      }

      const { error: upErr } = await supabase
        .from('users')
        .update({ xp: xpNew, level: levelNew, streak: streakNew, last_checkin_date: todayISO })
        .eq('wallet', wallet);

      if (upErr) throw upErr;

      setCompletedQuestIds(new Set([...Array.from(completedQuestIds), quest.id]));
      setUserStats({ xp: xpNew, level: levelNew, streak: streakNew });

      Alert.alert('Quest complete!', `+${quest.xp_reward} XP`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to complete quest');
    }
  };

  // If wallet is already saved, auto-load once user taps refresh (keeps it simple & stable)
  // You can also auto-load on mount later.
  const showLogin = sessionLoading || !wallet;

  return (
    <View style={styles.container}>
      {showLogin ? (
        <>
          <Text style={styles.title}>VibeProof</Text>
          <Text style={styles.subtitle}>MVP login: paste your wallet (we’ll add Seeker connect next)</Text>

          <TextInput
            value={walletDraft}
            onChangeText={setWalletDraft}
            placeholder="Your Solana wallet address"
            placeholderTextColor="#777"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Pressable style={styles.button} onPress={enterWallet} disabled={sessionLoading}>
            <Text style={styles.buttonText}>{sessionLoading ? 'Loading…' : 'Enter'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.topRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{userStats?.level ?? '-'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>{userStats?.xp ?? '-'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{userStats?.streak ?? '-'}🔥</Text>
            </View>
          </View>

          <Text style={styles.h1}>Today’s Missions</Text>
          <Text style={styles.small}>Date: {todayISO}</Text>

          <FlatList
            data={quests}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(wallet)} />}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            renderItem={({ item }) => {
              const done = completedQuestIds.has(item.id);
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
                  <View style={styles.cardRow}>
                    <Text style={styles.xp}>+{item.xp_reward} XP</Text>
                    <Pressable
                      onPress={() => completeQuest(item)}
                      style={[styles.btn, done && styles.btnDone]}
                      disabled={done}
                    >
                      <Text style={styles.btnText}>{done ? 'Completed' : 'Complete'}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No quests found for today. Add rows in Supabase → table “quests” for {todayISO}.
              </Text>
            }
          />

          <Pressable style={styles.linkBtn} onPress={changeWallet}>
            <Text style={styles.linkText}>Change wallet</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#fff' },

  title: { fontSize: 34, fontWeight: '800', color: '#000' },
  subtitle: { fontSize: 14, opacity: 0.7, color: '#000' },

  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#fff', color: '#000' },
  button: { padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#111' },
  buttonText: { color: 'white', fontWeight: '700' },

  topRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 14, padding: 12, gap: 4 },
  statLabel: { opacity: 0.6, fontWeight: '700', color: '#000' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#000' },

  h1: { fontSize: 24, fontWeight: '800', color: '#000' },
  small: { opacity: 0.6, marginBottom: 6, color: '#000' },

  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 14, padding: 14, gap: 6, backgroundColor: '#fff' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#000' },
  cardDesc: { opacity: 0.75, color: '#000' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  xp: { fontWeight: '800', color: '#000' },

  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#111' },
  btnDone: { backgroundColor: '#666' },
  btnText: { color: 'white', fontWeight: '800' },

  linkBtn: { padding: 12, alignItems: 'center' },
  linkText: { fontWeight: '800', color: '#000' },

  empty: { opacity: 0.7, color: '#000' },
});
