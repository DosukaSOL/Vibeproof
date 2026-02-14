import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

export default function LeaderboardTab() {
  const { wallet } = useSession();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const myRank = useMemo(() => {
    if (!wallet) return null;
    const idx = rows.findIndex((r) => r.wallet === wallet);
    return idx >= 0 ? idx + 1 : null;
  }, [rows, wallet]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet,xp,level,streak')
        .order('xp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Leaderboard</Text>

      {wallet ? (
        <Text style={styles.sub}>
          {myRank ? `Your rank: #${myRank}` : 'Complete a quest to appear here.'}
        </Text>
      ) : (
        <Text style={styles.sub}>Enter a wallet in Missions to see your rank.</Text>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.wallet}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        renderItem={({ item, index }) => {
          const isMe = wallet && item.wallet === wallet;
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={[styles.rank, isMe && styles.meText]}>#{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.wallet, isMe && styles.meText]} numberOfLines={1}>
                  {item.wallet}
                </Text>
                <Text style={[styles.meta, isMe && styles.meText]}>
                  Lvl {item.level} • Streak {item.streak}
                </Text>
              </View>
              <Text style={[styles.xp, isMe && styles.meText]}>{item.xp} XP</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No users yet. Complete a quest to appear here.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8, backgroundColor: '#fff' },
  h1: { fontSize: 24, fontWeight: '800', color: '#000' },
  sub: { opacity: 0.7, marginBottom: 8, color: '#000' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 14 },
  rowMe: { borderColor: '#111', borderWidth: 2 },

  rank: { fontWeight: '900', width: 44, color: '#000' },
  wallet: { fontFamily: 'Menlo', fontSize: 12, color: '#000' },
  meta: { opacity: 0.7, marginTop: 2, color: '#000' },
  xp: { fontWeight: '900', color: '#000' },

  meText: { color: '#000' },
  empty: { opacity: 0.7, color: '#000' },
});
