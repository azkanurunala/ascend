// Gentle vertical bob (respects reduced-motion via `enabled`).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export default function Float({ enabled = true, distance = 7, duration = 2600, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      a.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, duration, a]);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}
