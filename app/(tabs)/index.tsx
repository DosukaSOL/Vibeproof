import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, RefreshControl, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';

type Quest = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  active_date: string;
};

export default function VibeProofHome() {
  const [wallet, setWallet] = useState('');
  const [walletSet, setWalletSet] = useState(false);

  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const load = async (w: string) => {
    setLoading(true);
    try {
      const { error: upsertErr } = await supabase.from('users').upsert({ wallet: w }, { onConflict: 'wallet' });
      if (upsertErr) throw upsertErr;

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
    } catch (e: any) {
      Alert.alert('Supabase error', e.message ?? 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const setWalletAndLoad = async () => {
    const w = wallet.trim();
    if (!w || w.length < 20) {
      Alert.alert('Wallet needed', 'Paste a Solana wallet address (MVP login).');
      return;
    }
    setWalletSet(true);
    await load(w);
  };

  const completeQuest = async (quest: Quest) => {
    const w = wallet.trim();
    try {
      const { error: insErr } = await supabase.from('quest_completions').insert({
        wallet: w,
        quest_id: quest.id,
      });

      if (insErr) {
        if (String(insErr.message).toLowerCase().includes('duplicate')) return;
        throw insErr;
      }

      const { data: uData, error: uErr } = await supabase.from('users').select('*').eq('wallet', w).single();
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
        .eq('wallet', w);

      if (upErr) throw upErr;

      setCompletedQuestIds(new Set([...Array.from(completedQuestIds), quest.id]));
      Alert.alert('Quest complete!', `+${quest.xp_reward} XP`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to complete quest');
    }
  };

  if (!walletSet) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>VibeProof</Text>
        <Text style={styles.subtitle}>MVP login: paste your wallet</Text>

        <TextInput
          value={wallet}
          onChangeText={setWallet}
          placeholder="Your Solana wallet address"
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={setWalletAndLoad}>
          <Text style={styles.buttonText}>Enter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Today’s Missions</Text>
      <Text style={styles.small}>Date: {todayISO}</Text>

      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(wallet.trim())} />}
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

      <Pressable style={styles.linkBtn} onPress={() => setWalletSet(false)}>
        <Text style={styles.linkText}>Change wallet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // force light theme so text is always visible
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#fff' },

  title: { fontSize: 34, fontWeight: '800', color: '#000' },
  subtitle: { fontSize: 14, opacity: 0.7, color: '#000' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#000',
  },

  button: { padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#111' },
  buttonText: { color: 'white', fontWeight: '700' },

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
