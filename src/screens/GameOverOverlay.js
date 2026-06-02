// ============ GAME OVER OVERLAY ============
// Final score, personal-best comparison, achievement badge, Play again / Revive / Home.
// Ported from ascend-screens.jsx <GameOverOverlay> (PRD §6 Screen 2).

import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import Glass from '../components/Glass';
import Float from '../components/Float';
import { PrimaryButton, GhostButton, TextButton } from '../components/Buttons';
import { IconArrowUp, IconStar, IconRevive } from '../components/Icons';
import { ASC, FONT } from '../theme';
import { fmtNum } from '../utils/format';

export default function GameOverOverlay({
  score,
  best,
  isBest,
  band,
  reviveLabel,
  onRetry,
  onRevive,
  onHome,
  animate,
}) {
  return (
    // A full-screen Modal guarantees the overlay fills the whole screen (the same
    // mechanism the paywall uses); the BlurView frosts the game behind it.
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onHome}>
      <StatusBar style="light" />
      <BlurView intensity={50} tint="dark" style={styles.blur}>
        <Float enabled={animate} distance={0} duration={1}>
        <Glass tone="hi" pad={24} radius={28} style={styles.card} innerStyle={{ alignItems: 'center' }}>
          {isBest ? (
            <View style={styles.bestRow}>
              <IconStar size={13} color={ASC.gold} />
              <Text style={styles.bestText}>NEW PERSONAL BEST</Text>
            </View>
          ) : (
            <Text style={styles.runEnded}>RUN ENDED · {band}</Text>
          )}

          <Text style={styles.score}>{fmtNum(score)}</Text>
          <Text style={styles.bestLine}>Best {fmtNum(best)}</Text>

          <PrimaryButton
            label="Play again"
            size="sm"
            icon={<IconArrowUp size={18} color="#08233C" />}
            onPress={onRetry}
            style={{ width: '100%', marginTop: 20 }}
          />

          <GhostButton
            label={reviveLabel}
            icon={<IconRevive size={16} color={ASC.ink} />}
            onPress={onRevive}
            style={{ marginTop: 10 }}
          />

          <TextButton label="Home" onPress={onHome} style={{ marginTop: 8 }} />
        </Glass>
        </Float>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(6,12,26,0.22)', // subtle scrim so the card pops on the blur
  },
  card: { width: '100%', maxWidth: 340 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bestText: { fontFamily: FONT.monoSemi, fontSize: 11, color: ASC.gold, letterSpacing: 1.5 },
  runEnded: { fontFamily: FONT.mono, fontSize: 11, color: ASC.ink2, letterSpacing: 1.5, marginBottom: 8 },
  score: { fontFamily: FONT.monoSemi, fontSize: 56, color: ASC.ink, lineHeight: 58 },
  bestLine: { fontFamily: FONT.sans, fontSize: 13, color: ASC.ink2, marginTop: 6 },
});
