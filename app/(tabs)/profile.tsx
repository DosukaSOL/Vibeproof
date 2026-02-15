import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

function shortWallet(w: string) {
  if (!w) return '';
  return w.length <= 10 ? w : `${w.slice(0, 4)}…${w.slice(-4)}`;
}

export default function Profile() {
  const { wallet, setSession } = useSession();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [stats, setStats] = useState<{ xp: number; level: number; streak: number } | null>(null);

  const w = useMemo(() => wallet ?? '', [wallet]);

  const load = async () => {
    if (!w) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username,xp,level,streak')
        .eq('wallet', w)
        .single();

      if (error) throw error;

      const u = (data?.username ?? '').toString();
      setUsername(u);
      setSavedUsername(u);

      setStats({
        xp: Number(data?.xp ?? 0),
        level: Number(data?.level ?? 1),
        streak: Number(data?.streak ?? 0),
      });
    } catch (e: any) {
      console.log('Profile load error:', e?.message ?? e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [w]);

  const saveUsername = async () => {
    if (!w) {
      Alert.alert('Not connected', 'Connect a wallet first on Missions.');
      return;
    }

    const clean = username.trim().slice(0, 20);

    // simple rule: letters/numbers/_ only (so it looks clean on leaderboard)
    if (clean && !/^[a-zA-Z0-9_]+$/.test(clean)) {
      Alert.alert('Invalid username', 'Use only letters, numbers, and underscore (_).');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({ username: clean || null }).eq('wallet', w);
      if (error) throw error;

      setSavedUsername(clean);
      setUsername(clean);

      Alert.alert('Saved', clean ? `Username set to ${clean}` : 'Username cleared');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    await setSession({ wallet: null, authToken: null });
    Alert.alert('Disconnected', 'Wallet session cleared on this device.');
  };

  const changed = username.trim().slice(0, 20) !== (savedUsername ?? '');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.sub}>Identity + stats</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Wallet</Text>
        <Text style={styles.value}>{w ? shortWallet(w) : 'Not connected'}</Text>

        <View style={{ height: 14 }} />

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. DosukaSOL"
          placeholderTextColor="#777"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!!w}
        />
        <Text style={styles.hint}>Allowed: letters, numbers, underscore. Max 20 chars.</Text>

        <Pressable style={[styles.btn, !w && styles.btnDisabled]} onPress={saveUsername} disabled={!w}>
          <Text style={styles.btnText}>{changed ? 'Save username' : 'Saved'}</Text>
        </Pressable>

        <Pressable style={[styles.linkBtn, !w && styles.btnDisabled]} onPress={disconnect} disabled={!w}>
          <Text style={styles.linkText}>Disconnect wallet</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stats</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{stats?.level ?? '-'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>{stats?.xp ?? '-'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>
              {stats ? `${stats.streak}🔥` : '-'}
            </Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Pull down to refresh. Later we’ll add achievements + “rank”.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#000' },
  sub: { marginTop: 4, opacity: 0.7, color: '#000' },

  card: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    gap: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#000' },

  label: { fontWeight: '800', opacity: 0.7, color: '#000' },
  value: { color: '#000', fontSize: 16 },

  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  hint: { marginTop: 6, opacity: 0.7, color: '#000' },

  btn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: 'white', fontWeight: '800' },

  linkBtn: { marginTop: 10, alignItems: 'center', padding: 6 },
  linkText: { color: '#000', fontWeight: '800', opacity: 0.7 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12 },
  statLabel: { opacity: 0.7, fontWeight: '800', color: '#000' },
  statValue: { marginTop: 6, fontSize: 18, fontWeight: '900', color: '#000' },
});
