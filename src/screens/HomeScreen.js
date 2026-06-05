// ============ HOME / PLAY ============
// Ported from ascend-screens.jsx <HomeScreen>. Adds Playtime stat (PRD §6).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { sfx } from '../audio';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import Orb from '../components/Orb';
import Float from '../components/Float';
import { PrimaryButton } from '../components/Buttons';
import { IconArrowUp, IconBest } from '../components/Icons';
import { ASC, FONT } from '../theme';
import { fmtNum, fmtTime } from '../utils/format';

function MiniStat({ label, value, accent }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, accent && { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function HomeScreen({
  skin,
  best,
  games,
  playtime,
  topBand,
  reviveReady,
  animate,
  onPlay,
  onHowTo,
  onStory,
  width,
  height,
  topInset,
  bottomInset,
}) {
  return (
    <MenuScreen
      width={width}
      height={height}
      contentStyle={{ minHeight: height, paddingTop: topInset + 26, paddingBottom: bottomInset + 120, paddingHorizontal: 22 }}
    >
      {/* wordmark */}
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.eyebrow}>OFFLINE · ONE TOUCH</Text>
        <Text style={styles.wordmark}>Ascend</Text>
        <Text style={styles.tagline}>Orbit the wells. Slingshot to the stars.</Text>
      </View>

      {/* hero orb */}
      <View style={styles.heroWrap}>
        <Float enabled={animate} distance={9} duration={3400}>
          <Orb skin={skin} size={104} />
        </Float>
        <View style={styles.heroShadow} />
      </View>

      {/* best card */}
      <Glass tone="hi" pad={18} radius={24} style={{ marginBottom: 12 }}>
        <View style={styles.bestRow}>
          <View>
            <Text style={styles.eyebrowDk}>PERSONAL BEST</Text>
            <Text style={styles.bestNum}>{fmtNum(best)}</Text>
          </View>
          <IconBest size={44} color={ASC.gold} />
        </View>
        <View style={styles.statRow}>
          <MiniStat label="RUNS" value={fmtNum(games)} />
          <MiniStat label="PLAYTIME" value={fmtTime(playtime)} />
          <MiniStat label="CEILING" value={topBand} />
          <MiniStat label="REVIVE" value={reviveReady ? 'Ready' : 'Used'} accent={reviveReady ? ASC.mint : ASC.ink3} />
        </View>
      </Glass>

      <View style={{ flex: 1, minHeight: 30 }} />

      {/* play */}
      <PrimaryButton label="Play" icon={<IconArrowUp size={20} color="#08233C" />} onPress={onPlay} />
      <View style={styles.links}>
        {onHowTo && (
          <Pressable
            onPress={() => { sfx('tap'); onHowTo(); }}
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
          >
            <Text style={styles.pillText}>How to play</Text>
          </Pressable>
        )}
        {onStory && (
          <Pressable
            onPress={() => { sfx('tap'); onStory(); }}
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
          >
            <Text style={styles.pillText}>Story</Text>
          </Pressable>
        )}
      </View>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  pillPressed: { backgroundColor: 'rgba(255,255,255,0.4)' },
  pillText: { fontFamily: FONT.sansSemi, fontSize: 14, color: ASC.ink },
  eyebrow: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 4, color: ASC.ink2, textTransform: 'uppercase' },
  eyebrowDk: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2.6, color: ASC.ink2, textTransform: 'uppercase' },
  wordmark: { fontFamily: FONT.display, fontSize: 60, color: ASC.ink, marginTop: 8, letterSpacing: -1.5 },
  tagline: { fontFamily: FONT.sans, fontSize: 14.5, color: ASC.ink2, marginTop: 10 },

  heroWrap: { alignItems: 'center', marginTop: 30, marginBottom: 26 },
  heroShadow: {
    position: 'absolute',
    bottom: -6,
    width: 120,
    height: 16,
    borderRadius: 60,
    backgroundColor: 'rgba(20,50,80,0.12)',
  },

  bestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bestNum: { fontFamily: FONT.monoSemi, fontSize: 40, color: ASC.ink, lineHeight: 44 },

  statRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  mini: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 9,
    paddingHorizontal: 9,
  },
  miniLabel: { fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: 1.4, color: ASC.ink3 },
  miniValue: { fontFamily: FONT.sansSemi, fontSize: 14, color: ASC.ink, marginTop: 3 },
});
