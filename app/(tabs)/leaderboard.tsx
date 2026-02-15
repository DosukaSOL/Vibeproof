import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/session';

type Row = {
  wallet: string;
  username: string | null;
  xp: number;
  level: number;
  streak: number;
};

function shortWallet(w: string) {
  if (!w) return '';
  return w.length <= 10 ? w : `${w.slice(0, 4)}…${w.slice(-4)}`;
}

export default function Leaderboard() {
  const { wallet } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const myWallet = useMemo(() => wallet ?? '', [wallet]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet,username,xp,level,streak')
        .order('xp', { ascending: false })
        .limit(50);

      if (error) throw error;

      const normalized = (data ?? []).map((r: any) => ({
        wallet: String(r.wallet ?? ''),
        username: r.username ?? null,
        xp: Number(r.xp ?? 0),
        level: Number(r.level ?? 1),
        streak: Number(r.streak ?? 0),
      }));

      setRows(normalized);
    } catch (e: any) {
      // Keep it simple for now; later we can add a toast
      console.log('Leaderboard load error:', e?.message ?? e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <Text style={styles.sub}>Top 50 by XP</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.hCell, { width: 46 }]}>#</Text>
        <Text style={[styles.hCell, { flex: 1 }]}>Player</Text>
        <Text style={[styles.hCell, { width: 70, textAlign: 'right' }]}>Level</Text>
        <Text style={[styles.hCell, { width: 70, textAlign: 'right' }]}>XP</Text>
        <Text style={[styles.hCell, { width: 70, textAlign: 'right' }]}>Streak</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.wallet}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item, index }) => {
          const isMe = myWallet && item.wallet === myWallet;
          const name = item.username?.trim() ? item.username : shortWallet(item.wallet);

          return (
            <View style={[styles.row, isMe && styles.meRow]}>
              <Text style={[styles.cell, { width: 46 }]}>{index + 1}</Text>
              <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>
                {name} {isMe ? ' (You)' : ''}
              </Text>
              <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{item.level}</Text>
              <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{item.xp}</Text>
              <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{item.streak}🔥</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No users yet. Complete a mission to appear here.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#000' },
  sub: { marginTop: 4, opacity: 0.7, color: '#000' },

  headerRow: {
    marginTop: 14,
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  hCell: { fontWeight: '800', color: '#000', opacity: 0.7 },

  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f1f1',
  },
  meRow: { backgroundColor: '#f6f6ff' },
  cell: { color: '#000' },

  empty: { marginTop: 20, opacity: 0.7, color: '#000' },
});
