// ============ FORM CONTROLS ============
// Glass segmented control + toggle, shared by Settings and the Tweaks panel.

import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { ASC, FONT } from '../theme';

export function Segmented({ value, options, onChange }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const label = typeof o === 'object' ? o.label : o;
        const on = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[styles.segBtn, on && styles.segBtnOn]}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value, anim]);
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleWrap}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: tx }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(15,26,43,0.08)',
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segBtnOn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: 'rgba(20,50,90,0.18)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  segText: {
    fontFamily: FONT.sansSemi,
    fontSize: 13,
    color: ASC.ink2,
    textTransform: 'capitalize',
  },
  segTextOn: { color: ASC.ink },

  toggleWrap: { padding: 2 },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(20,40,70,0.18)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: { backgroundColor: ASC.sky },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
