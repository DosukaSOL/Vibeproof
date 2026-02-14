import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl, ScrollView, Pressable } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

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
              <Text style={styles.big}>{user?.level ?? '-'}</Text>
              <Text style={styles.small}>Level</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.big}>{user?.xp ?? '-'}</Text>
              <Text style={styles.small}>XP</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.big}>{user?.streak ?? '-'}</Text>
              <Text style={styles.small}>Streak</Text>
            </View>
          </View>

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

  btn: { padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#111', marginTop: 10 },
  btnText: { color: 'white', fontWeight: '800' },
});
