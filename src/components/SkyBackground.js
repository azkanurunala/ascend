// ============ MENU SKY BACKGROUND ============
// Calm meadow→open-sky gradient with drifting blurred glass blobs.
// Ported from ascend-screens.jsx <MenuSky> (radial blobs → Skia).

import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Rect,
  Circle,
  LinearGradient,
  RadialGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { rgba } from '../utils/color';

const BLOBS = [
  { c: '#FFFFFF', x: -0.12, y: 0.08, s: 280, o: 0.55 },
  { c: '#CFEFFF', x: 0.62, y: 0.02, s: 320, o: 0.5 },
  { c: '#E8FFE6', x: 0.3, y: 0.64, s: 300, o: 0.45 },
  { c: '#FFF6D8', x: 0.78, y: 0.52, s: 220, o: 0.4 },
];

export default function SkyBackground({ width, height }) {
  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          positions={[0, 0.48, 1]}
          colors={['#79C7E8', '#BFE3E0', '#EAF3E4']}
        />
      </Rect>

      {BLOBS.map((b, i) => {
        const cx = width * b.x + b.s / 2;
        const cy = height * b.y + b.s / 2;
        const r = b.s / 2;
        return (
          <Circle key={i} cx={cx} cy={cy} r={r}>
            <RadialGradient
              c={vec(cx, cy)}
              r={r}
              positions={[0, 0.68]}
              colors={[rgba(b.c, b.o), rgba(b.c, 0)]}
            />
            <BlurMask blur={30} style="normal" />
          </Circle>
        );
      })}
    </Canvas>
  );
}
