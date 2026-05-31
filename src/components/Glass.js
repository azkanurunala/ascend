// ============ GLASS SURFACE ============
// Frosted-glass panel (the core of the glassmorphism language).
// Ported from ascend-theme.jsx <Glass>. tone: 'reg' | 'hi' | 'dk'.

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ASC } from '../theme';

export default function Glass({
  tone = 'reg',
  dark = false,
  radius = 20,
  pad = 16,
  intensity = 24,
  style,
  innerStyle,
  children,
  onPress,
}) {
  const bg =
    tone === 'hi'
      ? dark
        ? 'rgba(255,255,255,0.12)'
        : ASC.glassHi
      : tone === 'dk'
      ? dark
        ? 'rgba(255,255,255,0.05)'
        : ASC.glassDk
      : dark
      ? 'rgba(255,255,255,0.08)'
      : ASC.glass;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        {
          borderRadius: radius,
          shadowColor: ASC.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 8,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius: radius,
            borderColor: dark ? ASC.hairDk : ASC.hair,
            backgroundColor: bg,
            padding: pad,
          },
          innerStyle,
        ]}
      >
        {children}
      </BlurView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
