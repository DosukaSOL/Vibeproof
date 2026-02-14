import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl, ScrollView, Pressable } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

const LEVEL_XP = 1000;

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.barOuter}>
      <View style={[styles.barInner, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
  );
}

export default function ProfileTab() {
  const { wallet, setWallet } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('wallet', wallet).single();
      if (error) throw error;
      setUser(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [wallet]);

  const logout = async () => {
    await setWallet(null);
    setUser(null);
  };

  const xp = Number(user?.xp ?? 0);
  const level = Number(user?.level ?? 1);
  const streak = Number(user?.streak ?? 0);
  const xpIntoLevel = xp % LEVEL_XP;
  const xpToNext = LEVEL_XP - xpIntoLevel;
  const progress = xpIntoLevel / LEVEL_XP;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.h1}>Your Vibe</Text>

      {!wallet ? (
        <Text style={styles.empty}>Go to Missions and enter a wallet first.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Wallet</Text>
          <Text style={styles.mono}>{wallet}</Text>

          <View style={styles.row}>
            <View style={styles.stat}>
              <Text style={styles.big}>{level}</Text>
              <Text style={styles.small}>Level</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.big}>{xp}</Text>
              <Text style={styles.small}>XP</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.big}>{streak}</Text>
              <Text style={styles.small}>Streak</Text>
            </View>
          </View>

          <Text style={styles.progressLabel}>
            {xpIntoLevel}/{LEVEL_XP} XP • {xpToNext} to next level
          </Text>
          <ProgressBar progress={progress} />

          <Pressable style={styles.btn} onPress={logout}>
            <Text style={styles.btnText}>Change wallet</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', minHeight: '100%' },
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12, color: '#000' },
  empty: { opacity: 0.6, color: '#000' },

  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 14, padding: 16, gap: 10 },
  label: { opacity: 0.6, fontWeight: '700', color: '#000' },
  mono: { fontFamily: 'Menlo', fontSize: 12, color: '#000' },

  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 14, padding: 12, alignItems: 'center' },
  big: { fontSize: 20, fontWeight: '900', color: '#000' },
  small: { opacity: 0.6, fontWeight: '700', color: '#000', marginTop: 4 },

  progressLabel: { opacity: 0.8, fontWeight: '700', color: '#000', marginTop: 6 },
  barOuter: { height: 12, borderRadius: 999, backgroundColor: '#eee', overflow: 'hidden' },
  barInner: { height: '100%', backgroundColor: '#111' },

  btn: { padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#111', marginTop: 10 },
  btnText: { color: 'white', fontWeight: '800' },
});
