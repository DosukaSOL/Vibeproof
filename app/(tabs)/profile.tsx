import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
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
  const [rank, setRank] = useState<number | null>(null);

  const w = useMemo(() => wallet ?? '', [wallet]);
  const changed = username !== savedUsername;

  const load = async () => {
    if (!w) return;
    setLoading(true);

    try {
      // 1) Fetch user row
      const { data, error } = await supabase
        .from('users')
        .select('username,xp,level,streak')
        .eq('wallet', w)
        .single();

      if (error) throw error;

      const u = (data?.username ?? '').toString();
      setUsername(u);
      setSavedUsername(u);

      const myXp = Number(data?.xp ?? 0);
      setStats({
        xp: myXp,
        level: Number(data?.level ?? 1),
        streak: Number(data?.streak ?? 0),
      });

      // 2) Rank = how many users have more XP than you + 1
      const { count, error: rankErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('xp', myXp);

      if (rankErr) throw rankErr;

      setRank((count ?? 0) + 1);
    } catch (e: any) {
      console.log('Profile load error:', e?.message ?? e);
      Alert.alert('Profile error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveUsername = async () => {
    if (!w) return;
    const trimmed = username.trim();

    // simple validation: letters, numbers, underscore; 1-20 chars
    if (!/^[a-zA-Z0-9_]{1,20}$/.test(trimmed)) {
      Alert.alert('Invalid username', 'Use letters, numbers, underscore. Max 20 chars.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({ username: trimmed }).eq('wallet', w);
      if (error) throw error;

      setSavedUsername(trimmed);
      Alert.alert('Saved', 'Username updated.');
    } catch (e: any) {
      console.log('Save username error:', e?.message ?? e);
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    await setSession({ wallet: null, authToken: null });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

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

        <Pressable
          style={[styles.btn, (!w || !changed || loading) && styles.btnDisabled]}
          onPress={saveUsername}
          disabled={!w || !changed || loading}
        >
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
            <Text style={styles.statValue}>{stats ? String(stats.level) : '-'}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>{stats ? String(stats.xp) : '-'}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{stats ? `${stats.streak}🔥` : '-'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Rank</Text>
            <Text style={styles.statValue}>{rank ?? '-'}</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Pull down to refresh. Rank is based on XP (higher XP = better rank).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 34, fontWeight: '800', color: '#000' },
  sub: { fontSize: 14, opacity: 0.7, color: '#000', marginBottom: 12 },

  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 10,
    backgroundColor: '#fff',
  },

  label: { fontSize: 12, opacity: 0.7, color: '#000' },
  value: { fontSize: 16, fontWeight: '700', color: '#000' },

  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
    fontSize: 16,
  },

  hint: { fontSize: 12, opacity: 0.7, color: '#000' },

  btn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#111',
    marginVertical: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: 'white', fontWeight: '700' },

  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: '#000', fontWeight: '700' },

  cardTitle: { fontSize: 18, fontWeight: '800', color: '#000' },

  statsRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  statLabel: { fontSize: 12, opacity: 0.7, color: '#000' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#000' },
});
