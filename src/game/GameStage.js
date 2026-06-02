// ============ ASCEND GAME ENGINE + RENDERER ============
// One-tap rise-against-gravity; dodge frosted-glass pillars (PRD §3 core mechanic).
// All mutable state lives in a ref; React re-renders only to repaint Skia + HUD.
// Ported from the design bundle (assets/ascend-game.jsx, canvas → Skia).

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Group,
  Rect,
  RoundedRect,
  Circle,
  Oval,
  LinearGradient,
  RadialGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

import { ASC, FONT, skyAt } from '../theme';
import { rgba } from '../utils/color';
import { IconArrowUp } from '../components/Icons';

const BALL_R = 15;
const GRAVITY = 1500;
const FLAP = 480;
const MAX_FALL = 820; // terminal velocity so the descent stays controlled, not runaway
const DIFF = {
  chill: { sp: 0.82, gap: 1.12 },
  normal: { sp: 1, gap: 1 },
  intense: { sp: 1.22, gap: 0.84 },
};

// Pillar tints — pipes cycle through these so they're colorful, not all clear
// glass. Each is rendered as colored frosted glass with a glowing edge.
const PIPE_TINTS = [
  '#5AA9F2', '#A98CF5', '#4FE0B0', '#F2719B',
  '#F2B33D', '#7CFFE0', '#FF8A5C', '#9CC9FF',
];

function fmt(n) {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function GameStage({
  skin,
  runKey,
  reviveAt,
  paused,
  reduceMotion,
  highQuality = true,
  difficulty = 'normal',
  onGameOver,
  onBand,
  width,
  height,
  topInset = 44,
}) {
  const W = width;
  const H = height;

  const g = useRef(null);
  const [phase, setPhase] = useState('ready'); // ready | run | dead
  const phaseRef = useRef('ready');
  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // mirror props into refs for the single mounted loop
  const skinRef = useRef(skin);
  const pausedRef = useRef(paused);
  const rmRef = useRef(reduceMotion);
  const hqRef = useRef(highQuality);
  const difRef = useRef(difficulty);
  const onGameOverRef = useRef(onGameOver);
  const onBandRef = useRef(onBand);
  skinRef.current = skin;
  pausedRef.current = paused;
  rmRef.current = reduceMotion;
  hqRef.current = highQuality;
  difRef.current = difficulty;
  onGameOverRef.current = onGameOver;
  onBandRef.current = onBand;

  const [, setFrame] = useState(0);

  // ---- world factories -----------------------------------------------------
  const starCount = () => (hqRef.current ? 60 : 26);
  const cloudCount = () => (hqRef.current ? 5 : 3);

  function seedClouds() {
    const arr = [];
    for (let i = 0; i < cloudCount(); i++)
      arr.push({
        x: Math.random() * W * 1.4,
        y: Math.random() * H * 0.8 + 30,
        s: 50 + Math.random() * 90,
        sp: 0.18 + Math.random() * 0.16,
        o: 0.5 + Math.random() * 0.4,
      });
    return arr;
  }
  function seedStars() {
    const arr = [];
    for (let i = 0; i < starCount(); i++)
      arr.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random(),
      });
    return arr;
  }
  function freshWorld() {
    return {
      W,
      H,
      ballX: W * 0.32,
      ballY: H * 0.42,
      vel: 0,
      rot: 0,
      obstacles: [],
      pipeCount: 0,
      spawnX: W + 60,
      scoreF: 0,
      score: 0,
      dist: 0,
      trail: [],
      sparks: [],
      clouds: seedClouds(),
      stars: seedStars(),
      pops: [],
      shake: 0,
      band: 'Meadow',
      started: false,
      dead: false,
      t: 0,
      last: 0,
      elapsed: 0,
      flashRevive: 0,
    };
  }

  // ---- difficulty (PRD formulas, tuned to px) ------------------------------
  function diff(score) {
    const D = DIFF[difRef.current] || DIFF.normal;
    return {
      speed: Math.min(360 * D.sp, (156 + score * 0.02) * D.sp),
      gapH: Math.max(146 * D.gap, (248 - score * 0.0135) * D.gap),
      spacingX: Math.max(196, 320 - score * 0.012),
    };
  }
  function spawnObstacle(w) {
    const d = diff(w.score);
    const margin = 64;
    const gapH = d.gapH;
    const gapY = margin + gapH / 2 + Math.random() * (w.H - 2 * margin - gapH - 70);
    const tint = PIPE_TINTS[w.pipeCount % PIPE_TINTS.length];
    w.pipeCount += 1;
    w.obstacles.push({ x: w.spawnX, gapY, gapH, w: 62, passed: false, tint });
    w.spawnX += d.spacingX;
  }

  // ---- lifecycle: build world on runKey ------------------------------------
  useEffect(() => {
    g.current = freshWorld();
    setPhaseBoth('ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  // ---- revive --------------------------------------------------------------
  useEffect(() => {
    if (!reviveAt) return;
    const w = g.current;
    if (!w) return;
    w.dead = false;
    w.vel = -FLAP * 0.4;
    w.ballY = w.H * 0.42;
    w.obstacles = w.obstacles.filter((o) => o.x > w.ballX + 220 || o.x < w.ballX - 80);
    w.flashRevive = 1;
    setPhaseBoth('run');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviveAt]);

  // ---- input ---------------------------------------------------------------
  const tap = () => {
    const w = g.current;
    if (!w || pausedRef.current) return;
    if (phaseRef.current === 'dead') return;
    if (!w.started) {
      w.started = true;
      setPhaseBoth('run');
      spawnObstacle(w);
    }
    w.vel = -FLAP;
    for (let i = 0; i < (hqRef.current ? 5 : 2); i++)
      w.sparks.push({
        x: w.ballX - 6,
        y: w.ballY + 10,
        vx: -40 - Math.random() * 60,
        vy: (Math.random() - 0.5) * 80,
        life: 1,
        r: 1.5 + Math.random() * 2.2,
      });
  };

  // ---- simulation ----------------------------------------------------------
  function idle(w, dt) {
    w.t += dt;
    w.ballY = w.H * 0.42 + Math.sin(w.t * 2) * 10;
    w.clouds.forEach((c) => {
      c.x -= c.sp * 18 * dt;
      if (c.x < -c.s) {
        c.x = w.W + c.s;
        c.y = Math.random() * w.H * 0.8 + 30;
      }
    });
    pushTrail(w);
  }

  function step(w, dt) {
    w.t += dt;
    w.elapsed += dt;
    const d = diff(w.score);

    // physics
    w.vel += GRAVITY * dt;
    if (w.vel > MAX_FALL) w.vel = MAX_FALL;
    w.ballY += w.vel * dt;
    w.rot = Math.max(-0.5, Math.min(0.9, w.vel / 900));

    // scroll + score
    const dx = d.speed * dt;
    w.dist += dx;
    w.scoreF += dt * d.speed * 0.42;
    w.score = Math.floor(w.scoreF);

    // band
    const sky = skyAt(w.score);
    if (sky.name !== w.band) {
      w.band = sky.name;
      if (onBandRef.current) onBandRef.current(sky.name);
    }

    // obstacles
    w.spawnX -= dx;
    w.obstacles.forEach((o) => {
      o.x -= dx;
    });
    while (w.spawnX < w.W + 40) spawnObstacle(w);
    w.obstacles = w.obstacles.filter((o) => o.x + o.w > -20);

    // scoring + collision
    const bx = w.ballX,
      by = w.ballY,
      br = BALL_R;
    for (const o of w.obstacles) {
      if (!o.passed && o.x + o.w < bx) {
        o.passed = true;
        w.scoreF += 50;
        w.score = Math.floor(w.scoreF);
        w.pops.push({ x: bx + 18, y: by - 26, life: 1, val: 50 });
      }
      const withinX = bx + br > o.x && bx - br < o.x + o.w;
      if (withinX) {
        const top = o.gapY - o.gapH / 2,
          bot = o.gapY + o.gapH / 2;
        if (by - br < top || by + br > bot) die(w);
      }
    }
    if (by + br > w.H - 4 || by - br < 2) die(w);

    // trail + sparks + pops
    pushTrail(w);
    w.sparks.forEach((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt * 1.6;
    });
    w.sparks = w.sparks.filter((s) => s.life > 0);
    w.pops.forEach((p) => {
      p.y -= 34 * dt;
      p.life -= dt * 1.1;
    });
    w.pops = w.pops.filter((p) => p.life > 0);

    // clouds parallax
    w.clouds.forEach((c) => {
      c.x -= c.sp * d.speed * 0.5 * dt;
      if (c.x < -c.s) {
        c.x = w.W + c.s;
        c.y = Math.random() * w.H * 0.8 + 30;
      }
    });
    if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 3);
    if (w.flashRevive > 0) w.flashRevive = Math.max(0, w.flashRevive - dt * 1.4);
  }

  function pushTrail(w) {
    w.trail.unshift({ x: w.ballX, y: w.ballY });
    if (w.trail.length > 16) w.trail.pop();
  }

  function die(w) {
    if (w.dead) return;
    w.dead = true;
    w.shake = 1;
    for (let i = 0; i < (hqRef.current ? 22 : 10); i++)
      w.sparks.push({
        x: w.ballX,
        y: w.ballY,
        vx: (Math.random() - 0.5) * 320,
        vy: (Math.random() - 0.5) * 320,
        life: 1,
        r: 1.5 + Math.random() * 3,
      });
    setPhaseBoth('dead');
    const fin = w.score;
    const secs = w.elapsed;
    if (!rmRef.current) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
    setTimeout(() => onGameOverRef.current && onGameOverRef.current(fin, secs), 90);
  }

  // ---- single mounted loop -------------------------------------------------
  useEffect(() => {
    let raf;
    const loop = (ts) => {
      const w = g.current;
      if (w) {
        if (!w.last) w.last = ts;
        let dt = (ts - w.last) / 1000;
        w.last = ts;
        if (dt > 0.05) dt = 0.05;
        const running = phaseRef.current === 'run' && w.started && !w.dead && !pausedRef.current;
        if (running) step(w, dt);
        else if (!w.started && !pausedRef.current) idle(w, dt);
      }
      setFrame((f) => (f + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =================== RENDER ===================
  const w = g.current;
  if (!w) return <View style={[styles.fill, { backgroundColor: ASC.ink }]} />;

  const sky = skyAt(w.score);
  const sx = w.shake > 0 && !rmRef.current ? (Math.random() - 0.5) * w.shake * 7 : 0;
  const sy = w.shake > 0 && !rmRef.current ? (Math.random() - 0.5) * w.shake * 7 : 0;

  const sk = skinRef.current;
  const starsAlpha = Math.max(0, Math.min(1, (w.score - 3600) / 1800));

  return (
    // Sky-toned background as a safety net behind the canvas.
    <Pressable style={[styles.fill, { backgroundColor: sky.bot }]} onPressIn={tap}>
      {/* flex:1 (not a numeric height) so the Skia surface fills the full screen
          on the New Architecture — a fixed pixel height under-sizes the canvas. */}
      <Canvas style={styles.fill}>
        <Group transform={[{ translateX: sx }, { translateY: sy }]}>
          {/* sky */}
          <Rect x={-20} y={-20} width={W + 40} height={H + 40}>
            <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={[sky.top, sky.bot]} />
          </Rect>

          {/* stars on dark bands */}
          {sky.dark &&
            w.stars.map((s, i) => {
              const tw = 0.5 + 0.5 * Math.sin(w.t * s.sp * 2 + s.tw);
              const a = starsAlpha * tw * 0.9;
              if (a <= 0.01) return null;
              return <Circle key={`st${i}`} cx={s.x} cy={s.y} r={s.r} color={rgba('#ffffff', a)} />;
            })}

          {/* clouds */}
          {w.clouds.map((c, i) => {
            const op = c.o * (sky.dark ? 0.4 : 0.85);
            const pts = [
              [c.x - c.s * 0.5, c.y + c.s * 0.12, c.s * 0.42],
              [c.x - c.s * 0.16, c.y - c.s * 0.12, c.s * 0.5],
              [c.x + c.s * 0.24, c.y - c.s * 0.04, c.s * 0.46],
              [c.x + c.s * 0.58, c.y + c.s * 0.14, c.s * 0.38],
              [c.x + c.s * 0.1, c.y + c.s * 0.24, c.s * 0.5],
            ];
            return (
              <Group key={`cl${i}`} opacity={op}>
                <BlurMask blur={highQuality ? 13 : 6} style="normal" />
                {pts.map((p, j) => (
                  <Circle key={j} cx={p[0]} cy={p[1]} r={p[2]} color={sky.fog} />
                ))}
              </Group>
            );
          })}

          {/* pillars */}
          {w.obstacles.map((o, i) => (
            <Pillar key={`ob${i}`} o={o} H={H} dark={sky.dark} />
          ))}

          {/* trail */}
          {w.trail.map((p, i) => {
            const f = 1 - i / w.trail.length;
            return (
              <Circle key={`tr${i}`} cx={p.x} cy={p.y} r={13 * f * 0.9} color={rgba(sk.trail, f * 0.45)} />
            );
          })}

          {/* sparks */}
          {w.sparks.map((s, i) => (
            <Circle key={`sp${i}`} cx={s.x} cy={s.y} r={s.r} color={rgba(sk.trail, Math.max(0, s.life) * 0.8)} />
          ))}

          {/* ball */}
          <Ball x={w.ballX} y={w.ballY} rot={w.rot} skin={sk} />

          {/* revive flash */}
          {w.flashRevive > 0 && (
            <Rect x={-20} y={-20} width={W + 40} height={H + 40} color={rgba('#ffffff', w.flashRevive * 0.5)} />
          )}
        </Group>
      </Canvas>

      {/* +score pops */}
      {w.pops.map((p, i) => (
        <Text
          key={`pop${i}`}
          style={[
            styles.pop,
            {
              left: p.x + sx,
              top: p.y + sy,
              opacity: Math.max(0, p.life),
              color: sky.dark ? '#fff' : ASC.ink,
            },
          ]}
        >
          +{p.val}
        </Text>
      ))}

      {/* HUD */}
      {phase !== 'ready' && (
        <View style={[styles.hud, { top: topInset + 14 }]} pointerEvents="none">
          <Text style={[styles.hudBand, { color: sky.dark ? ASC.inkOn2 : ASC.ink2 }]}>▲ {w.band}</Text>
          <Text
            style={[
              styles.hudScore,
              {
                color: sky.dark ? ASC.inkOn : ASC.ink,
                textShadowColor: sky.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
              },
            ]}
          >
            {fmt(w.score)}
          </Text>
        </View>
      )}

      {/* ready overlay */}
      {phase === 'ready' && (
        <View style={styles.ready} pointerEvents="none">
          <IconArrowUp size={34} color={sky.dark ? ASC.inkOn : ASC.ink} />
          <Text style={[styles.readyTitle, { color: sky.dark ? ASC.inkOn : ASC.ink }]}>Tap to rise</Text>
          <Text style={[styles.readySub, { color: sky.dark ? ASC.inkOn2 : ASC.ink2 }]}>
            Keep tapping. Thread the glass. Climb.
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---- pillar (frosted glass) ------------------------------------------------
function Pillar({ o, H, dark }) {
  const r = 16;
  const top = o.gapY - o.gapH / 2;
  const bot = o.gapY + o.gapH / 2;
  // Colored frosted glass: each pipe carries a tint so they're not all clear.
  const tint = o.tint || '#FFFFFF';
  const edgeA = dark ? 0.55 : 0.8;
  const midA = dark ? 0.26 : 0.4;
  const stroke = rgba(tint, dark ? 0.55 : 0.85);
  const cap = rgba(tint, dark ? 0.4 : 0.6);

  const piece = (key, drawY, drawH, capY) => {
    if (drawH <= 0) return null;
    // extend past the screen edge so only the gap-facing corners show rounding
    const ry = key === 'top' ? drawY - r : drawY;
    const rh = key === 'top' ? drawH + r : drawH + r;
    return (
      <Group key={key}>
        <RoundedRect x={o.x} y={ry} width={o.w} height={rh} r={r}>
          <LinearGradient
            start={vec(o.x, 0)}
            end={vec(o.x + o.w, 0)}
            positions={[0, 0.5, 1]}
            colors={[rgba(tint, midA * 0.7), rgba(tint, edgeA * 0.55), rgba(tint, midA * 0.6)]}
          />
        </RoundedRect>
        <RoundedRect x={o.x + 0.7} y={ry + 0.7} width={o.w - 1.4} height={rh - 1.4} r={r} style="stroke" strokeWidth={1.6} color={stroke} />
        {/* inner light streak (kept white for the glass highlight) */}
        <Rect
          x={o.x + o.w * 0.22}
          y={drawY + (key === 'top' ? 0 : 6)}
          width={3}
          height={drawH - 6}
          color="rgba(255,255,255,0.45)"
        />
        {/* glowing lip cap at the gap end */}
        <RoundedRect x={o.x - 4} y={capY} width={o.w + 8} height={10} r={5} color={cap} />
      </Group>
    );
  };

  return (
    <Group>
      {piece('top', 0, top, top - 10)}
      {piece('bot', bot, H - bot, bot)}
    </Group>
  );
}

// ---- ball ------------------------------------------------------------------
function Ball({ x, y, rot, skin }) {
  const R = BALL_R;
  const c1 = skin.c1 || skin.core || '#FFFFFF';
  const c2 = skin.c2 || skin.glow || c1;
  const halo = skin.glow || c2;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot * 0.4 }]}>
      {/* glow (subtle, tight) */}
      <Circle cx={0} cy={0} r={R * 1.5}>
        <RadialGradient c={vec(0, 0)} r={R * 1.5} positions={[0.4, 1]} colors={[rgba(halo, 0.45), rgba(halo, 0)]} />
      </Circle>
      {/* body — two-color diagonal gradient */}
      <Circle cx={0} cy={0} r={R}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={[c1, c2]} />
      </Circle>
      {/* glossy sheen */}
      <Circle cx={0} cy={0} r={R}>
        <RadialGradient
          c={vec(-R * 0.34, -R * 0.4)}
          r={R * 1.25}
          positions={[0, 0.55]}
          colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
        />
      </Circle>
      {/* rim */}
      <Circle cx={0} cy={0} r={R - 0.6} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.7)" />
      {/* highlight */}
      <Oval x={-R * 0.32 - R * 0.26} y={-R * 0.36 - R * 0.18} width={R * 0.52} height={R * 0.36} color="rgba(255,255,255,0.92)" />
    </Group>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  pop: {
    position: 'absolute',
    fontFamily: FONT.monoSemi,
    fontSize: 16,
    fontWeight: '600',
  },
  hud: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  hudBand: {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hudScore: {
    fontFamily: FONT.monoSemi,
    fontSize: 52,
    lineHeight: 56,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  ready: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 150,
    alignItems: 'center',
    zIndex: 5,
  },
  readyTitle: {
    fontFamily: FONT.displaySemi,
    fontSize: 22,
    marginTop: 6,
  },
  readySub: {
    fontFamily: FONT.sans,
    fontSize: 13,
    marginTop: 4,
  },
});
