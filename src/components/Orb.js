// ============ ORB ============
// The luminous glass ball (Skia). A two-color linear gradient body (c1 → c2)
// with a glossy highlight and a soft glowing halo. Used in menus / cosmetics.

import React from 'react';
import { Canvas, Circle, Oval, RadialGradient, LinearGradient, BlurMask, vec } from '@shopify/react-native-skia';
import { ASC_SKINS } from '../theme';
import { rgba } from '../utils/color';

export default function Orb({ skin, size = 56 }) {
  const s = skin || ASC_SKINS[0];
  const box = size * 1.5; // room for the (tight) glow halo
  const c = box / 2;
  const R = size / 2;
  const glowR = size * 0.66; // hugs the orb instead of a wide bloom
  const c1 = s.c1 || s.core || '#FFFFFF';
  const c2 = s.c2 || s.glow || c1;
  const halo = s.glow || c2;
  const bodyColors = s.colors && s.colors.length >= 2 ? s.colors : [c1, c2];

  return (
    <Canvas style={{ width: box, height: box }}>
      {/* glow (subtle) */}
      <Circle cx={c} cy={c} r={glowR}>
        <RadialGradient c={vec(c, c)} r={glowR} positions={[0.25, 1]} colors={[rgba(halo, 0.42), rgba(halo, 0)]} />
        <BlurMask blur={5} style="normal" />
      </Circle>

      {/* body — multi-color diagonal gradient sweep */}
      <Circle cx={c} cy={c} r={R}>
        <LinearGradient start={vec(c - R, c - R)} end={vec(c + R, c + R)} colors={bodyColors} />
      </Circle>

      {/* glossy sheen (top-left light) */}
      <Circle cx={c} cy={c} r={R}>
        <RadialGradient
          c={vec(c - R * 0.34, c - R * 0.4)}
          r={R * 1.05}
          positions={[0, 0.6]}
          colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
        />
      </Circle>

      {/* specular dot */}
      <Oval
        x={c - R + size * 0.16}
        y={c - R + size * 0.12}
        width={size * 0.26}
        height={size * 0.18}
        color="rgba(255,255,255,0.95)"
      >
        <BlurMask blur={1.4} style="normal" />
      </Oval>
    </Canvas>
  );
}
