import { View, Text, Button, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Quest = {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
};

export default function HomeScreen() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  // ----------------------------
  // Load user + quests
  // ----------------------------
  const load = async (walletAddr: string) => {
    try {
      setLoading(true);

      // Load quests
      const { data: questData, error: qErr } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;

      setQuests(questData || []);

      // Load user stats
      const { data: userData, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('wallet', walletAddr)
        .single();

      if (uErr && uErr.code !== 'PGRST116') {
        throw uErr;
      }

      setUserStats(userData || null);

    } catch (e: any) {
      Alert.alert('Load error', e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Connect wallet (mock for now)
  // ----------------------------
  const connectWallet = async () => {
    try {
      // TODO: Replace with real wallet connect
      const fakeWallet = 'demo-wallet-123';

      setWallet(fakeWallet);
      await load(fakeWallet);

      Alert.alert('Connected', fakeWallet);
    } catch (e: any) {
      Alert.alert('Wallet error', e.message || 'Failed to connect');
    }
  };

  // ----------------------------
  // Disconnect
  // ----------------------------
  const disconnectWallet = async () => {
    setWallet(null);
    setUserStats(null);
    setQuests([]);
  };

  // ----------------------------
  // COMPLETE QUEST (RPC)
  // ----------------------------
  const completeQuest = async (quest: Quest) => {
    if (!wallet) {
      Alert.alert('Not connected', 'Connect your wallet first.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('complete_quest', {
        p_wallet: wallet,
        p_quest_id: quest.id,
      });

      if (error) {
        const msg = String(error.message || '').toLowerCase();

        if (
          msg.includes('already') ||
          msg.includes('duplicate') ||
          msg.includes('unique')
        ) {
          Alert.alert(
            'Already completed',
            'You already completed this quest.'
          );
          return;
        }

        if (msg.includes('max') || msg.includes('cap')) {
          Alert.alert(
            'Quest ended',
            'This quest hit its max completions.'
          );
          return;
        }

        throw error;
      }

      await load(wallet);

      if (data?.xp_awarded) {
        Alert.alert('Nice!', `+${data.xp_awarded} XP`);
      }

    } catch (e: any) {
      Alert.alert(
        'Supabase error',
        e?.message ?? 'Failed to complete quest'
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>

      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
        VibeProof
      </Text>

      <Text style={{ marginBottom: 20 }}>
        Proof of Vibe. Earn XP. Complete Quests.
      </Text>

      {!wallet ? (
        <Button title="Connect Wallet" onPress={connectWallet} />
      ) : (
        <Button title="Disconnect" onPress={disconnectWallet} />
      )}

      {wallet && userStats && (
        <View style={{ marginVertical: 20 }}>
          <Text>Level: {userStats.level}</Text>
          <Text>XP: {userStats.xp}</Text>
          <Text>Streak: {userStats.streak}</Text>
        </View>
      )}

      <Text style={{ fontSize: 20, marginVertical: 10 }}>
        Quests
      </Text>

      {quests.map((q) => (
        <View
          key={q.id}
          style={{
            padding: 15,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>
            {q.title}
          </Text>

          <Text>{q.description}</Text>

          <Text>XP: {q.reward_xp}</Text>

          <Button
            title="Complete"
            disabled={loading}
            onPress={() => completeQuest(q)}
          />
        </View>
      ))}

      {loading && (
        <Text style={{ marginTop: 20 }}>
          Loading...
        </Text>
      )}

    </ScrollView>
  );
}
