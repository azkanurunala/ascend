// ============ LEADERBOARD ============
// Real global board via Apple Game Center when signed in; otherwise a seeded
// local preview so the screen is never empty. A "View in Game Center" button
// opens Apple's native board. Auth is automatic (device Apple ID) — no login.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import { GhostButton } from '../components/Buttons';
import { Segmented } from '../components/Controls';
import { ScreenHead } from './_ScreenHead';
import { ASC, FONT } from '../theme';
import { fmtNum } from '../utils/format';
import {
  loadTopScores,
  presentLeaderboard,
  isLeaderboardAvailable,
  isAuthenticated,
  authenticateGameCenter,
} from '../leaderboard';

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

export default function LeaderboardScreen({ best, difficulty = 'normal', width, height, topInset, bottomInset }) {
  const [diff, setDiff] = useState(difficulty); // which board you're viewing
  const [live, setLive] = useState(null); // null = loading, [] = none, [...] = real

  // Pull real Game Center scores for the selected difficulty board.
  useEffect(() => {
    let alive = true;
    setLive(null);
    (async () => {
      const rows = await loadTopScores(diff, 50);
      if (alive) setLive(rows);
    })();
    return () => {
      alive = false;
    };
  }, [diff]);

  const isLive = Array.isArray(live) && live.length > 0;

  // Normalize either source to { rank, name, s, me, f }.
  const rows = useMemo(() => {
    if (isLive) {
      return live.map((r) => ({ rank: r.rank, name: r.me ? 'You' : r.name, s: r.score, me: r.me, f: false }));
    }
    const list = [...LB_SEED, { name: 'You', s: best, me: true }].sort((a, b) => b.s - a.s);
    return list.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [isLive, live, best]);

  // "You" summary card — from live data, or a local placeholder if you're not
  // ranked yet (no score submitted / outside the top 50).
  const me = rows.find((r) => r.me) || { rank: null, s: best, me: true };
  const above = me.rank ? rows.find((r) => r.rank === me.rank - 1) : null;
  const top = rows.slice(0, 50);

  // Sign in (if needed), then open Apple's native board. Explain on failure so
  // the button never just silently does nothing.
  const openGameCenter = async () => {
    let ok = await isAuthenticated();
    if (!ok) ok = await authenticateGameCenter();
    const presented = await presentLeaderboard(diff);
    if (!presented) {
      Alert.alert(
        'Game Center unavailable',
        'Sign in to Game Center to see the global leaderboard:\n\nSettings → Game Center → sign in.\n\nThe leaderboard also needs to exist in App Store Connect, and Game Center sign-in is unreliable on the Simulator — test on a real device with a sandbox account.'
      );
    }
  };

  return (
    <MenuScreen
      width={width}
      height={height}
      contentStyle={{ paddingTop: topInset + 30, paddingBottom: bottomInset + 120 }}
    >
      <ScreenHead
        eyebrow={isLive ? 'GLOBAL · GAME CENTER' : 'GAME CENTER · ALL TIME'}
        title="Leaderboard"
        right={<Text style={styles.resetChip}>{isLive ? 'Live' : 'Best'}</Text>}
      />

      {/* difficulty board switcher */}
      <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
        <Segmented value={diff} options={['chill', 'normal', 'intense']} onChange={setDiff} />
      </View>

      {/* your rank */}
      <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
        <Glass tone="hi" pad={14} radius={20} innerStyle={styles.meCard}>
          <Text style={styles.meRank}>{me.rank ? `#${me.rank}` : '—'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.meName}>You</Text>
            <Text style={styles.meSub}>
              {!me.rank
                ? 'Play a run to join the board'
                : above
                ? `${fmtNum(above.s - me.s)} to climb a rank`
                : 'Top of the sky'}
            </Text>
          </View>
          <Text style={styles.meScore}>{fmtNum(me.s)}</Text>
        </Glass>
      </View>

      {isLeaderboardAvailable() && (
        <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
          <GhostButton label="View in Game Center" onPress={openGameCenter} />
        </View>
      )}

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
