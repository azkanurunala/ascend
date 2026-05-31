// Menu screen shell: sky background + scrollable content area.
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import SkyBackground from './SkyBackground';

export default function MenuScreen({ width, height, children, contentStyle, scroll = true }) {
  return (
    <View style={styles.root}>
      <SkyBackground width={width} height={height} />
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
});
