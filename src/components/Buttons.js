// ============ BUTTONS ============
// Glass-language buttons used across menus and overlays.

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ASC, FONT } from '../theme';
import { sfx } from '../audio';

export function PrimaryButton({ label, icon, onPress, disabled, style, size = 'lg', tint, textColor }) {
  const press = () => {
    sfx('tap');
    onPress && onPress();
  };
  // optional tint: color the button with the orb's gradient (Home Play button)
  const colors = tint && tint.length >= 2 ? tint : ['#FFFFFF', '#CFEFFF'];
  return (
    <Pressable
      onPress={disabled ? undefined : press}
      style={({ pressed }) => [styles.primaryWrap, style, disabled && { opacity: 0.55 }, pressed && !disabled && styles.pressed]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, size === 'sm' && styles.primarySm]}
      >
        {icon}
        <Text style={[styles.primaryText, size === 'sm' && styles.primaryTextSm, textColor && { color: textColor }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, icon, onPress, disabled, style, color }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.ghost, style, disabled && { opacity: 0.45 }, pressed && !disabled && styles.pressed]}
    >
      {icon}
      <Text style={[styles.ghostText, color && { color }]}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress, style, color }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.textBtn, style, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.textBtnText, color && { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: 22,
    shadowColor: 'rgba(30,90,150,0.32)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 22,
  },
  primarySm: { paddingVertical: 15, borderRadius: 18 },
  primaryText: { fontFamily: FONT.display, fontSize: 19, color: '#08233C', letterSpacing: -0.2 },
  primaryTextSm: { fontSize: 16 },
  pressed: { transform: [{ scale: 0.97 }] },

  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: ASC.hair,
  },
  ghostText: { fontFamily: FONT.sansSemi, fontSize: 14, color: ASC.ink },

  textBtn: { width: '100%', paddingVertical: 8, alignItems: 'center' },
  textBtnText: { fontFamily: FONT.sansSemi, fontSize: 14, color: ASC.ink2 },
});
