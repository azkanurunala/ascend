// ============ ONBOARDING / HOW TO PLAY ============
// First-run tutorial that walks through the orbit-slingshot mechanic step by
// step, each with a small Skia diagram in the game's own visual language.
// Shown automatically before the first run; re-openable from the home screen.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Circle,
  Line,
  Path,
  Skia,
  RoundedRect,
  RadialGradient,
  DashPathEffect,
  vec,
} from '@shopify/react-native-skia';
import Glass from '../components/Glass';
import Float from '../components/Float';
import { PrimaryButton, TextButton } from '../components/Buttons';
import { ASC, FONT } from '../theme';
import { rgba } from '../utils/color';

const DIAG_W = 276;
const DIAG_H = 150;
const CX = DIAG_W / 2;
const CY = DIAG_H / 2 + 6;

const STEPS = [
  {
    tag: 'STEP 1 · THE IDEA',
    title: 'It’s a slingshot',
    body: 'Your orb is tethered to a glowing gravity well, like a hammer-thrower winding up. It circles the well — that’s the heart of the game.',
    diagram: 'concept',
  },
  {
    tag: 'STEP 2 · HOLD',
    title: 'Hold to charge',
    body: 'Press and HOLD anywhere. The orb orbits the well and winds up power — the ring brightens as it charges. The longer you hold, the harder the fling.',
    diagram: 'charge',
  },
  {
    tag: 'STEP 3 · RELEASE',
    title: 'Release to fling',
    body: 'The orb flies the way it’s MOVING, not away from the well. It’s circling, so timing aims it. Let go when it’s on the well’s right side — that’s when it’s heading straight up.',
    diagram: 'release',
  },
  {
    tag: 'STEP 4 · CHAIN & CLIMB',
    title: 'Catch the next well',
    body: 'As the orb nears the next well, HOLD again to latch on. Hold–release–hold–release, zig-zagging upward. Miss them all and you fall off-screen — that ends the run. Climb as high as you can!',
    diagram: 'chain',
  },
];

// small filled arrowhead at (x,y) pointing along unit vector (ux,uy)
function arrow(p, x, y, ux, uy, len, head) {
  const tx = x + ux * len;
  const ty = y + uy * len;
  p.moveTo(x, y);
  p.lineTo(tx, ty);
  // head: two barbs rotated ±150° from the direction
  const ang = Math.atan2(uy, ux);
  for (const s of [1, -1]) {
    const a = ang + s * 2.5;
    p.moveTo(tx, ty);
    p.lineTo(tx + Math.cos(a) * head, ty + Math.sin(a) * head);
  }
}

function Diagram({ kind, skin }) {
  const core = (skin && (skin.c2 || skin.glow)) || ASC.sky;
  const orbC = (skin && skin.c1) || '#FFFFFF';
  const tint = ASC.sky;

  // a well glyph: halo + ring + frosted core
  const Well = ({ x, y, r = 17, color = tint }) => (
    <>
      <Circle cx={x} cy={y} r={r * 2}>
        <RadialGradient c={vec(x, y)} r={r * 2} positions={[0.2, 1]} colors={[rgba(color, 0.4), rgba(color, 0)]} />
      </Circle>
      <Circle cx={x} cy={y} r={r} style="stroke" strokeWidth={2} color={rgba(color, 0.85)} />
      <Circle cx={x} cy={y} r={r * 0.6}>
        <RadialGradient c={vec(x - 4, y - 4)} r={r * 0.7} colors={['rgba(255,255,255,0.95)', rgba(color, 0.5)]} />
      </Circle>
    </>
  );
  const Orb = ({ x, y, r = 11 }) => (
    <>
      <Circle cx={x} cy={y} r={r * 1.6}>
        <RadialGradient c={vec(x, y)} r={r * 1.6} positions={[0.4, 1]} colors={[rgba(core, 0.5), rgba(core, 0)]} />
      </Circle>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient c={vec(x - 3, y - 4)} r={r * 1.3} colors={[orbC, core]} />
      </Circle>
      <Circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.28} color="rgba(255,255,255,0.9)" />
    </>
  );

  const RO = 44; // orbit radius in the diagram

  if (kind === 'concept') {
    const ox = CX + RO * Math.cos(-0.7);
    const oy = CY + RO * Math.sin(-0.7);
    const ring = Skia.Path.Make();
    ring.addCircle(CX, CY, RO);
    // rotation hint arc (CCW) with arrowhead
    const arc = Skia.Path.Make();
    arc.addArc({ x: CX - RO - 16, y: CY - RO - 16, width: (RO + 16) * 2, height: (RO + 16) * 2 }, -10, -70);
    const head = Skia.Path.Make();
    arrow(head, CX + (RO + 16) * Math.cos(-1.4), CY + (RO + 16) * Math.sin(-1.4), 0.95, -0.3, 0.1, 7);
    return (
      <Canvas style={{ width: DIAG_W, height: DIAG_H }}>
        <Path path={ring} style="stroke" strokeWidth={1.4} color={rgba(tint, 0.45)}>
          <DashPathEffect intervals={[5, 5]} />
        </Path>
        <Path path={arc} style="stroke" strokeWidth={2} color={rgba(ASC.ink, 0.35)} />
        <Path path={head} style="stroke" strokeWidth={2} strokeCap="round" color={rgba(ASC.ink, 0.35)} />
        <Line p1={vec(CX, CY)} p2={vec(ox, oy)} style="stroke" strokeWidth={1.4} color={rgba(tint, 0.6)} />
        <Well x={CX} y={CY} />
        <Orb x={ox} y={oy} />
      </Canvas>
    );
  }

  if (kind === 'charge') {
    const ox = CX + RO * Math.cos(-0.7);
    const oy = CY + RO * Math.sin(-0.7);
    const barW = 150;
    const barX = CX - barW / 2;
    const barY = DIAG_H - 14;
    return (
      <Canvas style={{ width: DIAG_W, height: DIAG_H - 4 }}>
        {/* charged: bright thick ring */}
        <Circle cx={CX} cy={CY - 8} r={RO} style="stroke" strokeWidth={4.5} color={rgba(ASC.mint, 0.85)} />
        <Line p1={vec(CX, CY - 8)} p2={vec(ox, oy - 8)} style="stroke" strokeWidth={3} color={rgba(ASC.mint, 0.8)} />
        <Well x={CX} y={CY - 8} color={ASC.mint} />
        <Orb x={ox} y={oy - 8} />
        {/* power bar */}
        <RoundedRect x={barX} y={barY} width={barW} height={7} r={4} color="rgba(15,26,43,0.14)" />
        <RoundedRect x={barX} y={barY} width={barW * 0.8} height={7} r={4} color={ASC.mint} />
      </Canvas>
    );
  }

  if (kind === 'release') {
    // orb at 3 o'clock (right of well); CCW tangent points UP
    const ox = CX + RO;
    const oy = CY;
    const up = Skia.Path.Make();
    arrow(up, ox, oy - 14, 0, -1, 40, 9);
    const ring = Skia.Path.Make();
    ring.addCircle(CX, CY, RO);
    return (
      <Canvas style={{ width: DIAG_W, height: DIAG_H }}>
        <Path path={ring} style="stroke" strokeWidth={1.2} color={rgba(tint, 0.3)}>
          <DashPathEffect intervals={[5, 5]} />
        </Path>
        <Well x={CX} y={CY} />
        <Path path={up} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color={ASC.gold} />
        <Orb x={ox} y={oy} />
      </Canvas>
    );
  }

  // chain: lower well + orb arcing up to an upper well
  const loX = CX - 54;
  const loY = DIAG_H - 26;
  const hiX = CX + 60;
  const hiY = 28;
  const par = Skia.Path.Make();
  par.moveTo(loX + 10, loY - 10);
  par.quadTo(CX - 30, hiY - 30, hiX - 12, hiY + 4);
  return (
    <Canvas style={{ width: DIAG_W, height: DIAG_H }}>
      <Path path={par} style="stroke" strokeWidth={2} color={rgba(ASC.gold, 0.8)}>
        <DashPathEffect intervals={[4, 5]} />
      </Path>
      <Well x={loX} y={loY} r={14} />
      <Well x={hiX} y={hiY} r={15} color={ASC.mint} />
      <Orb x={loX + 10} y={loY - 10} r={10} />
    </Canvas>
  );
}

export default function Onboarding({ visible, onDone, skin, animate }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const next = () => {
    if (last) {
      setI(0);
      onDone();
    } else {
      setI((x) => x + 1);
    }
  };
  const skip = () => {
    setI(0);
    onDone();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={skip}>
      <StatusBar style="light" />
      <BlurView intensity={50} tint="dark" style={styles.blur}>
        <Float enabled={animate} distance={0} duration={1}>
          <Glass tone="hi" pad={22} radius={28} style={styles.card} innerStyle={{ alignItems: 'center' }}>
            <Text style={styles.tag}>{step.tag}</Text>

            <View style={styles.diagram}>
              <Diagram kind={step.diagram} skin={skin} />
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>

            {/* progress dots */}
            <View style={styles.dots}>
              {STEPS.map((_, k) => (
                <View key={k} style={[styles.dot, k === i && styles.dotActive]} />
              ))}
            </View>

            <PrimaryButton
              label={last ? 'Start climbing' : 'Next'}
              size="sm"
              onPress={next}
              style={{ width: '100%', marginTop: 16 }}
            />
            <TextButton label={last ? '' : 'Skip'} onPress={skip} style={{ marginTop: last ? 0 : 6, height: last ? 0 : undefined }} />
          </Glass>
        </Float>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(6,12,26,0.24)',
  },
  card: { width: '100%', maxWidth: 340 },
  tag: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2, color: ASC.ink2, marginBottom: 6 },
  diagram: {
    width: DIAG_W,
    height: DIAG_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  title: { fontFamily: FONT.displaySemi, fontSize: 22, color: ASC.ink, marginTop: 4 },
  body: {
    fontFamily: FONT.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: ASC.ink2,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(15,26,43,0.18)' },
  dotActive: { backgroundColor: ASC.sky, width: 18 },
});
