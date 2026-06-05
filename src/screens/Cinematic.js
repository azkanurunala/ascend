// ============ CINEMATIC INTRO ============
// Frames the purpose of the game over REAL gameplay: the engine runs in
// autoplay (the orb orbits wells, charges, slingshots, and climbs the bands)
// as an always-opaque backdrop, with story captions layered on top. No
// background fades — the live game canvas fully covers what's behind it.
// Shown once on first launch (persisted `introSeen`), replayable from Home.

import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import GameStage from '../game/GameStage';
import { TextButton, PrimaryButton } from '../components/Buttons';
import { ASC, FONT } from '../theme';

// Engaging, second-person story beats — stakes + the climb + a challenge hook.
const LINES = [
  'You are the last light\nof a fallen star.',
  'Eight skies stand between you\nand home among the stars.',
  'You can’t fly — but every\nglowing well is a chance.',
  'Hold to orbit. Let go at the\nright moment. Slingshot higher.',
  'Through clouds, aurora,\nthe very edge of space…',
  'How high can you climb?',
];
const BEAT_MS = 4200;

export default function Cinematic({ visible, onDone, skin, reduceMotion, width, height, topInset }) {
  const [runKey, setRunKey] = useState(1);
  const [i, setI] = useState(0);
  const slide = useRef(new Animated.Value(0)).current; // caption enters with a slide (no bg fade)
  const last = LINES.length - 1;

  // (re)start the gameplay loop + story whenever the cinematic opens
  useEffect(() => {
    if (visible) {
      setI(0);
      setRunKey((k) => k + 1);
    }
  }, [visible]);

  // caption enters by sliding up — full opacity, so nothing shows "behind"
  useEffect(() => {
    if (!visible) return;
    slide.setValue(reduceMotion ? 1 : 0);
    if (!reduceMotion) {
      Animated.timing(slide, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [i, visible, reduceMotion, slide]);

  // advance the story; the gameplay underneath keeps climbing the whole time
  useEffect(() => {
    if (!visible || i >= last) return;
    const id = setTimeout(() => setI((x) => Math.min(last, x + 1)), BEAT_MS);
    return () => clearTimeout(id);
  }, [i, visible, last]);

  if (!visible) return null;
  const finish = () => onDone && onDone();
  const captionY = slide.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <StatusBar style="light" />

      {/* REAL gameplay, played by the autopilot — opaque, no see-through */}
      <GameStage
        key={runKey}
        skin={skin}
        runKey={runKey}
        reviveAt={0}
        paused={false}
        reduceMotion={reduceMotion}
        highQuality={false}
        difficulty="chill"
        autoPlay
        demoScore={0}
        onGameOver={() => setRunKey((k) => k + 1)} // keep the demo climbing forever
        onBand={() => {}}
        width={width}
        height={height}
        topInset={topInset}
      />

      {/* absorb stray taps so they don't fight the autopilot */}
      <Pressable style={StyleSheet.absoluteFill} />

      {/* bottom scrim + sliding caption (legible over any sky) */}
      <View style={styles.captionWrap} pointerEvents="none">
        <LinearGradient colors={['rgba(6,12,26,0)', 'rgba(6,12,26,0.86)']} style={StyleSheet.absoluteFill} />
        <Animated.Text style={[styles.caption, { transform: [{ translateY: captionY }] }]}>
          {LINES[i]}
        </Animated.Text>
      </View>

      {/* skip (always) / begin (last beat) */}
      <View style={[styles.skip, { top: topInset + 14 }]}>
        <TextButton label="Skip" onPress={finish} color={ASC.inkOn2} />
      </View>
      {i >= last && (
        <View style={styles.begin}>
          <PrimaryButton label="Begin the climb" onPress={finish} style={{ width: '100%' }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, backgroundColor: ASC.ink },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    justifyContent: 'flex-end',
    paddingHorizontal: 34,
    paddingBottom: 132,
  },
  caption: {
    fontFamily: FONT.displaySemi,
    fontSize: 23,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  skip: { position: 'absolute', right: 18, zIndex: 110 },
  begin: { position: 'absolute', bottom: 56, left: 28, right: 28, zIndex: 110 },
});
