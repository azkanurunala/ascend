// ============ BOTTOM NAV (glass) ============
// Play · Ranks · Skins · Settings. Ported from ascend-app.jsx <BottomNav>.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ASC, FONT } from '../theme';
import { IconArrowUp, IconRanks, IconSkins, IconSettings } from './Icons';

const ITEMS = [
  { id: 'play', label: 'Play', Icon: IconArrowUp },
  { id: 'ranks', label: 'Ranks', Icon: IconRanks },
  { id: 'skins', label: 'Skins', Icon: IconSkins },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
];

export default function BottomNav({ tab, setTab, bottomInset = 0 }) {
  return (
    <View style={[styles.wrap, { bottom: bottomInset + 14 }]} pointerEvents="box-none">
      <BlurView intensity={28} tint="light" style={styles.bar}>
        {ITEMS.map((it) => {
          const active = tab === it.id;
          const color = active ? ASC.ink : 'rgba(15,26,43,0.5)';
          return (
            <Pressable key={it.id} onPress={() => setTab(it.id)} style={styles.item}>
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <it.Icon size={21} color={color} />
              </View>
              <Text style={[styles.label, { color, fontFamily: active ? FONT.sansBold : FONT.sans }]}>
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 26,
    padding: 7,
    overflow: 'hidden',
    shadowColor: 'rgba(20,50,90,0.22)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: 'rgba(20,50,90,0.18)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  label: { fontSize: 10 },
});
