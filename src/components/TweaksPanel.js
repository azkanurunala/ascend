// ============ TWEAKS PANEL ============
// In-app game-feel tuner (faithful to the design's floating Tweaks panel):
// Difficulty (chill / normal / intense) + Menu motion. Persisted by App.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ASC, FONT } from '../theme';
import { Segmented, Toggle } from './Controls';

export default function TweaksPanel({ tweaks, setTweak, bottomInset = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen((o) => !o)} style={[styles.fab, { bottom: bottomInset + 96 }]}>
        <Text style={styles.fabText}>{open ? 'CLOSE' : 'TWEAKS'}</Text>
      </Pressable>

      {open && (
        <BlurView intensity={40} tint="light" style={[styles.panel, { bottom: bottomInset + 140 }]}>
          <Text style={styles.title}>Tweaks</Text>

          <Text style={styles.section}>GAME FEEL</Text>
          <Text style={styles.label}>Difficulty</Text>
          <Segmented
            value={tweaks.difficulty}
            options={['chill', 'normal', 'intense']}
            onChange={(v) => setTweak('difficulty', v)}
          />

          <View style={styles.rowH}>
            <Text style={styles.label}>Menu motion</Text>
            <Toggle value={tweaks.menuMotion} onChange={(v) => setTweak('menuMotion', v)} />
          </View>
        </BlurView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 60,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: ASC.hair,
  },
  fabText: { fontFamily: FONT.monoSemi, fontSize: 11, letterSpacing: 1, color: ASC.ink },
  panel: {
    position: 'absolute',
    right: 16,
    zIndex: 60,
    width: 250,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ASC.hair,
    backgroundColor: 'rgba(250,252,255,0.55)',
  },
  title: { fontFamily: FONT.displaySemi, fontSize: 15, color: ASC.ink, marginBottom: 6 },
  section: {
    fontFamily: FONT.monoSemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: ASC.ink3,
    marginTop: 8,
    marginBottom: 8,
  },
  label: { fontFamily: FONT.sansSemi, fontSize: 13, color: ASC.ink2, marginBottom: 6 },
  rowH: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
