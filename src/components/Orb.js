// ============ ORB ============
// The luminous glass ball, rendered with Skia. Used in menus / cosmetics.
// Ported from ascend-theme.jsx <Orb> (DOM radial gradients → Skia).

import React from 'react';
import {
  Canvas,
  Circle,
  Oval,
  RadialGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { ASC_SKINS, mixHex } from '../theme';
import { rgba } from '../utils/color';

export default function Orb({ skin, size = 56 }) {
  const s = skin || ASC_SKINS[0];
  const box = size * 1.7; // room for the glow halo
  const c = box / 2;
  const bodyR = size / 2;
  const glowR = size * 0.84;

  return (
    <Canvas style={{ width: box, height: box }}>
      {/* glow halo */}
      <Circle cx={c} cy={c} r={glowR}>
        <RadialGradient
          c={vec(c, c)}
          r={glowR}
          positions={[0, 0.68]}
          colors={[rgba(s.glow, 0.6), rgba(s.glow, 0)]}
        />
      </Circle>

      {/* body */}
      <Circle cx={c} cy={c} r={bodyR}>
        <RadialGradient
          c={vec(c - bodyR * 0.36, c - bodyR * 0.44)}
          r={bodyR * 1.4}
          positions={[0, 0.46, 1]}
          colors={['#ffffff', s.core, mixHex(s.core, s.glow, 0.55)]}
        />
      </Circle>

      {/* specular highlight */}
      <Oval
        x={c - bodyR + size * 0.18}
        y={c - bodyR + size * 0.14}
        width={size * 0.28}
        height={size * 0.2}
        color="rgba(255,255,255,0.9)"
      >
        <BlurMask blur={1.4} style="normal" />
      </Oval>
    </Canvas>
  );
}
