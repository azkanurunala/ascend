// ============ LEADERBOARD ============
// Local top-50 with your rank, friends, weekly reset (PRD §6/§7).
// Ported & expanded from ascend-screens.jsx <LeaderboardScreen> (16 → 50 seed).

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import { ScreenHead } from './_ScreenHead';
import { ASC, FONT } from '../theme';
import { fmtNum } from '../utils/format';

// Deterministic local seed (no randomness → stable rankings across renders).
const NAMES = [
  'Kestrel', 'Alex', 'nova_77', 'Mira', 'drift.io', 'Pavel', 'Lune', 'qwerty',
  'Sol', 'echo', 'Tariq', 'wisp', 'June', 'k.', 'halo', 'Ona', 'Bex', 'mono',
  'Yuki', 'cirrus', 'Dax', 'pip', 'Noor', 'vela', 'Ren', 'glide', 'Suki', 'arc',
  'Tove', 'lumen', 'Iris', 'fenn', 'Cass', 'orbit', 'Milo', 'zephyr', 'Pia',
  'koi', 'Bram', 'haze', 'Esme', 'volt', 'Nima', 'rune', 'Lio', 'spire', 'Wren',
  'aero', 'Quill',
];
const FRIEND_IDX = new Set([1, 3, 6, 9, 12, 15, 20, 27, 33, 41]);
const LB_SEED = NAMES.map((name, i) => ({
  name,
  s: 15200 - i * 278 - ((i * i) % 53) * 7,
  f: FRIEND_IDX.has(i),
}));

export default function LeaderboardScreen({ best, width, height, topInset, bottomInset }) {
  const rows = useMemo(() => {
    const list = [...LB_SEED, { name: 'You', s: best, me: true }].sort((a, b) => b.s - a.s);
    return list.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [best]);
  const me = rows.find((r) => r.me);
  const top = rows.slice(0, 50);

  return (
    <MenuScreen
      width={width}
      height={height}
      contentStyle={{ paddingTop: topInset + 30, paddingBottom: bottomInset + 120 }}
    >
      <ScreenHead
        eyebrow="THIS WEEK · LOCAL"
        title="Leaderboard"
        right={<Text style={styles.resetChip}>Resets Sun</Text>}
      />

      {/* your rank */}
      <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
        <Glass tone="hi" pad={14} radius={20} innerStyle={styles.meCard}>
          <Text style={styles.meRank}>#{me.rank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.meName}>You</Text>
            <Text style={styles.meSub}>
              {me.rank > 1
                ? `${fmtNum(rows[me.rank - 2].s - me.s)} to climb a rank`
                : 'Top of the sky'}
            </Text>
          </View>
          <Text style={styles.meScore}>{fmtNum(me.s)}</Text>
        </Glass>
      </View>

      {/* list */}
      <View style={{ paddingHorizontal: 18, gap: 7 }}>
        {top.map((r) => (
          <View key={r.rank} style={[styles.row, r.me && styles.rowMe]}>
            <Text style={[styles.rowRank, { color: r.rank <= 3 ? ASC.gold : ASC.ink3 }]}>{r.rank}</Text>
            <View style={styles.rowMid}>
              <Text style={[styles.rowName, { fontFamily: r.me ? FONT.sansBold : FONT.sansSemi }]}>{r.name}</Text>
              {r.f && <Text style={styles.friendTag}>FRIEND</Text>}
            </View>
            <Text style={styles.rowScore}>{fmtNum(r.s)}</Text>
          </View>
        ))}
      </View>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  resetChip: {
    fontFamily: FONT.mono,
    fontSize: 11,
    color: ASC.ink2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meRank: { fontFamily: FONT.monoSemi, fontSize: 26, color: ASC.sky, width: 52, textAlign: 'center' },
  meName: { fontFamily: FONT.sansBold, fontSize: 15, color: ASC.ink },
  meSub: { fontFamily: FONT.sans, fontSize: 12, color: ASC.ink2 },
  meScore: { fontFamily: FONT.monoSemi, fontSize: 19, color: ASC.ink },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  rowMe: { backgroundColor: 'rgba(120,185,245,0.42)', borderColor: 'rgba(90,169,242,0.6)' },
  rowRank: { fontFamily: FONT.monoSemi, fontSize: 14, width: 30, textAlign: 'center' },
  rowMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 14.5, color: ASC.ink },
  friendTag: {
    fontFamily: FONT.mono,
    fontSize: 9,
    color: ASC.violet,
    backgroundColor: 'rgba(169,140,245,0.16)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    letterSpacing: 0.6,
    overflow: 'hidden',
  },
  rowScore: { fontFamily: FONT.monoSemi, fontSize: 14, color: ASC.ink2 },
});
