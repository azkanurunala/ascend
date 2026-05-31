// Shared screen header (eyebrow + large display title + optional right slot).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ASC, FONT } from '../theme';

export function ScreenHead({ eyebrow, title, right }) {
  return (
    <View style={styles.head}>
      <View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 2.6,
    color: ASC.ink2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: { fontFamily: FONT.display, fontSize: 30, color: ASC.ink },
});
