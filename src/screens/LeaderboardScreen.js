// ============ LEADERBOARD ============
// Real global board via Apple Game Center. Authenticates on open, loads the
// live top-50 for the selected difficulty, and lets you jump to Apple's native
// board. No fake/seeded data — an honest empty state when there are no scores
// yet (or the player isn't signed in to Game Center).

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import { PrimaryButton } from '../components/Buttons';
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

export default function LeaderboardScreen({ best, difficulty = 'normal', width, height, topInset, bottomInset }) {
  const available = isLeaderboardAvailable();
  const [diff, setDiff] = useState(difficulty); // which board you're viewing
  const [live, setLive] = useState(null); // null = loading, [] = none, [...] = real
  const [authed, setAuthed] = useState(false);

  // Authenticate (if needed) then load the real Game Center scores.
  useEffect(() => {
    let alive = true;
    setLive(null);
    (async () => {
      let ok = await isAuthenticated();
      if (!ok) ok = await authenticateGameCenter();
      if (!alive) return;
      setAuthed(ok);
      const rows = ok ? await loadTopScores(diff, 50) : [];
      if (alive) setLive(rows || []);
    })();
    return () => {
      alive = false;
    };
  }, [diff]);

  const loading = live === null;
  const rows = (live || []).map((r) => ({ rank: r.rank, name: r.me ? 'You' : r.name, s: r.score, me: r.me }));
  const me = rows.find((r) => r.me) || { rank: null, s: best, me: true };
  const above = me.rank ? rows.find((r) => r.rank === me.rank - 1) : null;

  // Open Apple's native global board (signing in first if needed).
  const openGameCenter = async () => {
    if (!available) {
      Alert.alert(
        'Game Center unavailable',
        'This build does not include the Game Center module. Run a fresh dev/EAS build on a physical device.'
      );
      return;
    }

    let ok = await isAuthenticated();
    if (!ok) ok = await authenticateGameCenter();
    console.log('[GameCenter] openGameCenter authed =', ok, 'board =', diff);

    if (!ok) {
      Alert.alert(
        'Not signed in to Game Center',
        'Sign in first, then try again:\n\nSettings → Game Center → sign in.'
      );
      return;
    }

    const presented = await presentLeaderboard(diff);
    if (!presented) {
      Alert.alert(
        "Couldn't open the board",
        'Signed in, but the native board did not open. The leaderboard may not be live yet in App Store Connect, or the ID is not recognized. This works on a physical device once the app version with Game Center is submitted.'
      );
    }
  };

  return (
    <MenuScreen
      width={width}
      height={height}
      contentStyle={{ paddingTop: topInset + 30, paddingBottom: bottomInset + 120 }}
    >
      <ScreenHead eyebrow="GLOBAL · GAME CENTER" title="Leaderboard" />

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

      {available && (
        <View style={{ paddingHorizontal: 18, marginBottom: 16 }}>
          <PrimaryButton size="sm" label="Open Game Center" onPress={openGameCenter} />
        </View>
      )}

      {/* list / states */}
      {loading ? (
        <Text style={styles.state}>Loading scores…</Text>
      ) : rows.length > 0 ? (
        <View style={{ paddingHorizontal: 18, gap: 7 }}>
          {rows.map((r) => (
            <View key={r.rank} style={[styles.row, r.me && styles.rowMe]}>
              <Text style={[styles.rowRank, { color: r.rank <= 3 ? ASC.gold : ASC.ink3 }]}>{r.rank}</Text>
              <View style={styles.rowMid}>
                <Text style={[styles.rowName, { fontFamily: r.me ? FONT.sansBold : FONT.sansSemi }]}>{r.name}</Text>
              </View>
              <Text style={styles.rowScore}>{fmtNum(r.s)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 18 }}>
          <Glass tone="hi" pad={22} radius={20} innerStyle={{ alignItems: 'center' }}>
            <Text style={styles.emptyTitle}>No scores yet</Text>
            <Text style={styles.emptyBody}>
              {authed
                ? 'Be the first to set a height on this board — your best is submitted automatically.'
                : 'Sign in to Game Center (Settings → Game Center) to compete on the global leaderboard.'}
            </Text>
          </Glass>
        </View>
      )}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
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
  rowScore: { fontFamily: FONT.monoSemi, fontSize: 14, color: ASC.ink2 },

  state: { fontFamily: FONT.sans, fontSize: 13, color: ASC.ink2, textAlign: 'center', paddingVertical: 24 },
  emptyTitle: { fontFamily: FONT.display, fontSize: 18, color: ASC.ink, marginBottom: 6 },
  emptyBody: { fontFamily: FONT.sans, fontSize: 13, color: ASC.ink2, textAlign: 'center', lineHeight: 19 },
});
