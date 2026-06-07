// ============ ASCEND GAME ENGINE + RENDERER ============
// ORBIT SLINGSHOT: the orb coasts under a gentle pull. HOLD to latch it into
// orbit around the nearest gravity well; RELEASE to slingshot it off on the
// tangent toward the next well. Chain wells to climb the eight altitude bands.
// Miss every well and the orb falls off-screen — that's game over.
// All mutable state lives in a ref; React re-renders only to repaint Skia + HUD.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Group,
  Rect,
  Circle,
  Oval,
  Line,
  LinearGradient,
  RadialGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

import { ASC, FONT, skyAt } from '../theme';
import { rgba } from '../utils/color';
import { sfx } from '../audio';

// BASE_* values are tuned for the iPhone width below. At runtime everything is
// multiplied by a screen scale S = width / BASE_W, so a bigger canvas (iPad)
// plays as a proportionally zoomed iPhone — well spacing, reach, capture range
// and speeds all scale together, keeping every well reachable. (Without this,
// iPad spread wells far apart while reach stayed fixed → unreachable gaps.)
const BASE_W = 393; // iPhone logical width the physics were tuned at
const BASE_BALL_R = 14;
const BASE_ORB_GRAV = 480; // downward world pull (px/s²) — what you slingshot against
const BASE_CAPTURE_R = 142; // how close to a well's center a grab will latch
const BASE_ORBIT_MIN = 44; // clamp the orbit radius so latches feel consistent
const BASE_SPEED_MIN = 300; // orbital/flight speed floor so the orb never crawls
const BASE_SPEED_MAX = 820; // …and ceiling so a charged fling can't go ballistic
const BASE_SPIN_ACCEL = 600; // holding spins the orbit up — this IS your launch power
const BASE_ALT_SCALE = 5; // world-px of climb per score point (scaled so score is device-independent)
const RELEASE_BOOST = 1.04; // small extra slingshot kick on release
const ANCHOR = 0.6; // the orb rides ~60% down the screen; upcoming wells sit above
const WELL_BONUS = 20; // score for each fresh well grabbed (combo)

// difficulty knobs: stronger pull, wider spacing and more well drift = harder
const DIFF = {
  chill: { grav: 0.84, spacing: 0.88, drift: 0.5 },
  normal: { grav: 1, spacing: 1, drift: 1 },
  intense: { grav: 1.18, spacing: 1.16, drift: 1.6 },
};

// Well tints — each gravity well is luminous frosted glass in one of these hues.
const WELL_TINTS = [
  '#5AA9F2', '#A98CF5', '#4FE0B0', '#F2719B',
  '#F2B33D', '#7CFFE0', '#FF8A5C', '#9CC9FF',
];

function fmt(n) {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export default function GameStage({
  skin,
  runKey,
  reviveAt,
  paused,
  reduceMotion,
  highQuality = true,
  difficulty = 'normal',
  autoPlay = false, // debug: the orb plays itself (see src/debug.js)
  demoScore = 0, // debug: start the run near this score (drives the sky band)
  onGameOver,
  onBand,
  width,
  height,
  topInset = 44,
}) {
  const W = width;
  const H = height;

  // Screen scale vs the iPhone baseline. Shadows the BASE_* constants with
  // scaled values so every physics/geometry calc below stays proportional on
  // larger canvases (iPad): reach, capture range, launch power AND well spacing
  // all grow by the same S, so a bigger canvas is a cleanly zoomed iPhone and
  // every well stays as reachable as it is on phone. Orientation is locked to
  // portrait, so S tops out ~2.6 on a 12.9" iPad. Only a lower floor is clamped
  // (tiny split-view widths) — NEVER cap the top: an upper clamp freezes reach
  // while raw-W placement keeps spreading wells, recreating the iPad gap bug.
  const S = Math.max(0.9, W / BASE_W);
  const BALL_R = BASE_BALL_R * S;
  const ORB_GRAV = BASE_ORB_GRAV * S;
  const CAPTURE_R = BASE_CAPTURE_R * S;
  const ORBIT_MIN = BASE_ORBIT_MIN * S;
  const SPEED_MIN = BASE_SPEED_MIN * S;
  const SPEED_MAX = BASE_SPEED_MAX * S;
  const SPIN_ACCEL = BASE_SPIN_ACCEL * S;
  const ALT_SCALE = BASE_ALT_SCALE * S;

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
  const autoRef = useRef(autoPlay);
  const demoScoreRef = useRef(demoScore);
  const onGameOverRef = useRef(onGameOver);
  const onBandRef = useRef(onBand);
  skinRef.current = skin;
  pausedRef.current = paused;
  rmRef.current = reduceMotion;
  hqRef.current = highQuality;
  difRef.current = difficulty;
  autoRef.current = autoPlay;
  demoScoreRef.current = demoScore;
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
    // debug: start the run already high so we can capture any sky band
    const baseY = autoRef.current && demoScoreRef.current > 0 ? demoScoreRef.current * ALT_SCALE : 0;
    const baseScore = Math.floor(baseY / ALT_SCALE);
    const w = {
      W,
      H,
      // orb lives in world space; +y is UP (it climbs as y grows)
      orb: { x: W * 0.5, y: baseY, vx: 0, vy: 0 },
      orbScreen: { x: W * 0.5, y: H * ANCHOR },
      wells: [],
      wellCount: 0,
      holding: false, // finger currently down → orbiting
      orbitWell: null, // well object the orb is latched to
      orbitR: 70,
      orbitAng: 0,
      orbitDir: 1,
      orbitOmega: 1.1,
      orbitSpeed: SPEED_MIN, // tangential speed; charges up while holding
      autoTarget: null, // debug autopilot: the well it's currently aiming for
      camY: baseY, // world-y mapped to the anchor line
      camTarget: baseY,
      altPeak: baseY,
      bonus: 0,
      scoreF: baseScore,
      score: baseScore,
      trail: [],
      sparks: [],
      pops: [],
      clouds: seedClouds(),
      stars: seedStars(),
      shake: 0,
      whiff: 0, // brief feedback when a grab finds no well
      band: 'Meadow',
      started: false,
      dead: false,
      t: 0,
      last: 0,
      elapsed: 0,
      flashRevive: 0,
    };
    // seed the first well right under the orb so the ready-screen demo orbits it
    w.wells.push(makeWell(w, W * 0.5, baseY));
    // pre-spawn a ladder of wells above so the climb is visible from frame one
    while (w.wells[w.wells.length - 1].y < baseY + H * 1.4) spawnWell(w);
    return w;
  }

  function makeWell(w, x, y) {
    const D = DIFF[difRef.current] || DIFF.normal;
    const driftAmp = w.score > 1400 ? (18 + Math.random() * 42) * S * D.drift : 0;
    const well = {
      baseX: x,
      x,
      y,
      r: (30 + Math.random() * 8) * S,
      tint: WELL_TINTS[w.wellCount % WELL_TINTS.length],
      driftAmp,
      driftSp: 0.5 + Math.random() * 0.7,
      driftPh: Math.random() * Math.PI * 2,
      scored: false,
    };
    w.wellCount += 1;
    return well;
  }
  function spawnWell(w) {
    const D = DIFF[difRef.current] || DIFF.normal;
    const last = w.wells[w.wells.length - 1];
    // Vertical gap scales with S (width), but the orb dies at H+46 below a 0.6·H
    // anchor, so fall-recovery room is height-based. iPad's shorter aspect ratio
    // shrinks that room while S grows the gap — cap dy to 0.34·H so the next well
    // always stays within reach of a fall. No-op on tall phones (cap > max gap).
    const dy = Math.min((148 + Math.random() * 78) * S * D.spacing, H * 0.34);
    const ny = (last ? last.y : 0) + dy;
    const margin = 68 * S;
    let nx = W * 0.5;
    if (last) {
      // zig-zag, but keep the horizontal gap within slingshot reach. maxDX is
      // tied to S (not raw width) so a wide canvas can't place wells unreachably
      // far apart (the iPad bug). minGap keeps consecutive wells distinct.
      const minGap = Math.min(W * 0.26, 120 * S);
      const maxDX = 300 * S;
      const lo = Math.max(margin, last.baseX - maxDX);
      const hi = Math.min(W - margin, last.baseX + maxDX);
      for (let i = 0; i < 10; i++) {
        nx = lo + Math.random() * (hi - lo);
        if (Math.abs(nx - last.baseX) >= minGap) break;
      }
    }
    w.wells.push(makeWell(w, nx, ny));
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
    // drop the orb back onto the nearest well above the camera and re-latch it
    const safe =
      w.wells.find((wl) => wl.y > w.camTarget) || w.wells[w.wells.length - 1];
    if (safe) {
      w.orb.x = safe.x;
      w.orb.y = safe.y - 70;
      w.orb.vx = 0;
      w.orb.vy = 0;
      latchTo(w, safe);
    }
    w.flashRevive = 1;
    setPhaseBoth('run');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviveAt]);

  // ---- input: hold to orbit, release to slingshot --------------------------
  function nearestWell(w) {
    let best = null;
    let bestD = CAPTURE_R;
    for (const wl of w.wells) {
      const d = Math.hypot(w.orb.x - wl.x, w.orb.y - wl.y);
      if (d < bestD) {
        bestD = d;
        best = wl;
      }
    }
    return best;
  }
  function latchTo(w, well) {
    const dx = w.orb.x - well.x;
    const dy = w.orb.y - well.y;
    const dist = Math.hypot(dx, dy) || 1;
    // orbit at the orb's ACTUAL arrival distance (only clamp the extremes) so
    // latching never teleports the orb — keeps the motion perfectly continuous.
    const r = clamp(dist, ORBIT_MIN, CAPTURE_R);
    const ang = Math.atan2(dy, dx);
    const speed = clamp(Math.hypot(w.orb.vx, w.orb.vy), SPEED_MIN, SPEED_MAX);
    // keep spinning the way the orb was already travelling around the well
    const ccw = (-dy * w.orb.vx + dx * w.orb.vy) / dist;
    const dir = ccw >= 0 ? 1 : -1;
    w.holding = true;
    w.orbitWell = well;
    w.orbitR = r;
    w.orbitAng = ang;
    w.orbitDir = dir;
    w.orbitSpeed = speed; // carry in the flight speed; it charges up from here
    w.orbitOmega = (speed / r) * dir;
    if (!well.scored) {
      well.scored = true;
      w.bonus += WELL_BONUS;
      w.pops.push({ x: w.orbScreen.x + 16, y: w.orbScreen.y - 26, life: 1, val: WELL_BONUS });
      if (!autoRef.current) sfx('well'); // chime on a fresh well (quiet during demo)
    } else if (!autoRef.current) {
      sfx('grab'); // soft tick on re-latching an already-scored well
    }
  }
  const grab = () => {
    const w = g.current;
    if (!w || pausedRef.current || phaseRef.current === 'dead') return;
    if (!w.started) {
      w.started = true;
      setPhaseBoth('run');
    }
    const well = nearestWell(w);
    if (!well) {
      w.whiff = 1; // missed — no well in reach
      return;
    }
    latchTo(w, well);
    if (!rmRef.current) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };
  const release = () => {
    const w = g.current;
    if (!w || !w.holding) return;
    w.holding = false;
    w.orbitWell = null;
    if (!autoRef.current) sfx('launch'); // slingshot whoosh (quiet during demo)
    // velocity is already the orbital tangent — add a small slingshot kick
    w.orb.vx *= RELEASE_BOOST;
    w.orb.vy *= RELEASE_BOOST;
    for (let i = 0; i < (hqRef.current ? 6 : 3); i++)
      w.sparks.push({
        x: w.orbScreen.x,
        y: w.orbScreen.y,
        vx: -w.orb.vx * 0.15 + (Math.random() - 0.5) * 60,
        vy: w.orb.vy * 0.15 + (Math.random() - 0.5) * 60,
        life: 1,
        r: 1.5 + Math.random() * 2.2,
      });
  };

  // ---- debug autopilot: plays the game on its own for screenshot capture ---
  function pickTargetAbove(w, fromWell) {
    const fromY = fromWell ? fromWell.y : w.orb.y;
    let best = null;
    for (const wl of w.wells) {
      if (wl === fromWell) continue;
      if (wl.y > fromY + 12 && (!best || wl.y < best.y)) best = wl;
    }
    return best;
  }
  // Look-ahead: simulate the slingshot arc from the orb's current state and
  // report whether it would pass within grab range of target `t`. Lets the
  // autopilot release ONLY when the fling will actually reach the next well —
  // so the demo chains reliably and climbs smoothly (no falls, no rescues).
  function arcReaches(w, t, D) {
    let x = w.orb.x, y = w.orb.y;
    let vx = w.orb.vx * RELEASE_BOOST, vy = w.orb.vy * RELEASE_BOOST;
    const g = ORB_GRAV * D.grav, dt = 1 / 60;
    for (let s = 0; s < 130; s++) {
      vy -= g * dt;
      x += vx * dt;
      y += vy * dt;
      if (x < BALL_R) { x = BALL_R; vx = Math.abs(vx) * 0.92; }
      else if (x > w.W - BALL_R) { x = w.W - BALL_R; vx = -Math.abs(vx) * 0.92; }
      if (Math.hypot(x - t.x, y - t.y) < CAPTURE_R * 0.85) return true;
      if (vy < 0 && y < t.y - CAPTURE_R) return false; // falling below the target — missed
    }
    return false;
  }
  function autopilot(w) {
    const D = DIFF[difRef.current] || DIFF.normal;
    if (w.holding && w.orbitWell) {
      if (!w.autoTarget || w.autoTarget.y <= w.orbitWell.y) w.autoTarget = pickTargetAbove(w, w.orbitWell);
      const t = w.autoTarget;
      if (!t) {
        if (w.orb.vy > 0 && w.orbitSpeed > 660) release();
        return;
      }
      // need at least enough charge to climb to the target, then release the
      // first frame the predicted arc actually reaches it
      const dy = Math.max(90, t.y - w.orb.y);
      const minCharge = clamp(1.08 * Math.sqrt(2 * ORB_GRAV * D.grav * dy), SPEED_MIN + 120, SPEED_MAX);
      if (w.orbitSpeed >= minCharge && w.orb.vy > 0 && arcReaches(w, t, D)) release();
      else if (w.orbitSpeed >= SPEED_MAX * 0.995 && w.orb.vy > 0) release(); // failsafe
    } else {
      // flying: grab the target as soon as it's in range (else any nearby well)
      const t = w.autoTarget;
      if (t && Math.hypot(t.x - w.orb.x, t.y - w.orb.y) < CAPTURE_R) {
        latchTo(w, t);
        w.autoTarget = pickTargetAbove(w, t);
      } else {
        const well = nearestWell(w);
        if (well) {
          latchTo(w, well);
          w.autoTarget = pickTargetAbove(w, well);
        }
      }
    }
  }

  // ---- simulation ----------------------------------------------------------
  function driftWells(w) {
    for (const wl of w.wells) {
      if (wl.driftAmp) wl.x = wl.baseX + Math.sin(w.t * wl.driftSp + wl.driftPh) * wl.driftAmp;
    }
  }

  function idle(w, dt) {
    w.t += dt;
    driftWells(w);
    // demo orbit around the first well so the mechanic reads at a glance
    const well = w.wells[0];
    w.orbitAng += 1.1 * dt;
    w.orbitR = 70;
    w.orb.x = well.x + w.orbitR * Math.cos(w.orbitAng);
    w.orb.y = well.y + w.orbitR * Math.sin(w.orbitAng);
    w.clouds.forEach((c) => {
      c.x -= c.sp * 18 * dt;
      if (c.x < -c.s) {
        c.x = w.W + c.s;
        c.y = Math.random() * w.H * 0.8 + 30;
      }
    });
    updateCamera(w, dt);
    pushTrail(w);
  }

  function updateCamera(w, dt) {
    w.camTarget = Math.max(w.camTarget, w.orb.y);
    w.camY += (w.camTarget - w.camY) * Math.min(1, dt * 3.5);
    const anchorY = w.H * ANCHOR;
    w.orbScreen = { x: w.orb.x, y: anchorY - (w.orb.y - w.camY) };
  }

  function step(w, dt) {
    w.t += dt;
    w.elapsed += dt;
    const D = DIFF[difRef.current] || DIFF.normal;

    driftWells(w);

    if (w.holding && w.orbitWell) {
      // ---- orbiting: spin up (charge), velocity tracks the tangent ----
      // holding accelerates the orbit — the longer you hold, the harder the fling
      w.orbitSpeed = Math.min(SPEED_MAX, w.orbitSpeed + SPIN_ACCEL * dt);
      const c = w.orbitWell;
      const r = w.orbitR;
      const om = (w.orbitSpeed / r) * w.orbitDir;
      w.orbitOmega = om;
      w.orbitAng += om * dt;
      w.orb.x = c.x + r * Math.cos(w.orbitAng);
      w.orb.y = c.y + r * Math.sin(w.orbitAng);
      w.orb.vx = -r * Math.sin(w.orbitAng) * om;
      w.orb.vy = r * Math.cos(w.orbitAng) * om;
    } else {
      // ---- free flight: gentle downward pull, elastic side walls ----
      w.orb.vy -= ORB_GRAV * D.grav * dt;
      const sp = Math.hypot(w.orb.vx, w.orb.vy);
      if (sp > SPEED_MAX) {
        const k = SPEED_MAX / sp;
        w.orb.vx *= k;
        w.orb.vy *= k;
      }
      w.orb.x += w.orb.vx * dt;
      w.orb.y += w.orb.vy * dt;
      if (w.orb.x < BALL_R) {
        w.orb.x = BALL_R;
        w.orb.vx = Math.abs(w.orb.vx) * 0.92;
      } else if (w.orb.x > w.W - BALL_R) {
        w.orb.x = w.W - BALL_R;
        w.orb.vx = -Math.abs(w.orb.vx) * 0.92;
      }
    }

    updateCamera(w, dt);

    // altitude → score (monotonic climb) + well combo bonus
    w.altPeak = Math.max(w.altPeak, w.orb.y);
    w.scoreF = w.altPeak / ALT_SCALE + w.bonus;
    w.score = Math.floor(w.scoreF);

    // band
    const sky = skyAt(w.score);
    if (sky.name !== w.band) {
      w.band = sky.name;
      if (onBandRef.current) onBandRef.current(sky.name);
    }

    // spawn wells above, cull wells that scrolled well below the screen
    while (w.wells[w.wells.length - 1].y < w.camTarget + w.H * 1.5) spawnWell(w);
    const cullY = w.camY - w.H * 1.2;
    w.wells = w.wells.filter((wl) => wl.y > cullY || wl === w.orbitWell);

    // death: orb fell off the bottom of the screen
    if (w.orbScreen.y > w.H + 46) die(w);

    // rotation for the orb sprite — face its travel direction
    w.rot = clamp(Math.atan2(w.orb.vy, Math.abs(w.orb.vx) + 1) * -0.4, -0.6, 0.6);

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

    // clouds parallax (drift down as you climb)
    w.clouds.forEach((c) => {
      c.y += Math.max(0, w.orb.vy) * 0.18 * dt;
      c.x -= c.sp * 16 * dt;
      if (c.x < -c.s) c.x = w.W + c.s;
      if (c.y > w.H + c.s) {
        c.y = -c.s;
        c.x = Math.random() * w.W;
      }
    });
    if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 3);
    if (w.whiff > 0) w.whiff = Math.max(0, w.whiff - dt * 3);
    if (w.flashRevive > 0) w.flashRevive = Math.max(0, w.flashRevive - dt * 1.4);
  }

  function pushTrail(w) {
    w.trail.unshift({ x: w.orbScreen.x, y: w.orbScreen.y });
    if (w.trail.length > 16) w.trail.pop();
  }

  function die(w) {
    if (w.dead) return;
    // Demo autopilot never dies — rescue the orb onto a visible well above and
    // keep climbing. This avoids run-ending remounts that make the cinematic
    // stutter; the climb stays continuous and smooth.
    if (autoRef.current) {
      const safe =
        w.wells.find((wl) => wl.y > w.camTarget - w.H * 0.2 && wl.y < w.camTarget + w.H * 0.4) ||
        w.wells.find((wl) => wl.y > w.orb.y) ||
        w.wells[w.wells.length - 1];
      if (safe) {
        w.orb.x = safe.x;
        w.orb.y = safe.y;
        w.orb.vx = 0;
        w.orb.vy = 0;
        w.holding = false;
        w.orbitWell = null;
        w.autoTarget = null;
      }
      return;
    }
    w.dead = true;
    w.holding = false;
    w.orbitWell = null;
    w.shake = 1;
    sfx('over');
    for (let i = 0; i < (hqRef.current ? 22 : 10); i++)
      w.sparks.push({
        x: w.orbScreen.x,
        y: w.orbScreen.y,
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
        // debug autopilot drives the inputs so a run plays itself (no taps)
        if (autoRef.current && phaseRef.current !== 'dead' && !pausedRef.current) {
          if (!w.started) grab();
          else autopilot(w);
        }
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
  const anchorY = H * ANCHOR;
  const screenYOf = (wy) => anchorY - (wy - w.camY);

  return (
    // Sky-toned background as a safety net behind the canvas.
    <Pressable style={[styles.fill, { backgroundColor: sky.bot }]} onPressIn={grab} onPressOut={release}>
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

          {/* gravity wells */}
          {w.wells.map((wl, i) => {
            const wsy = screenYOf(wl.y);
            if (wsy < -120 || wsy > H + 120) return null;
            return <Well key={`wl${i}`} wl={wl} sx={wl.x} sy={wsy} dark={sky.dark} hq={highQuality} />;
          })}

          {/* active orbit ring + tether while held — brightens as it charges */}
          {w.holding && w.orbitWell && (() => {
            const charge = clamp((w.orbitSpeed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN), 0, 1);
            const wsy = screenYOf(w.orbitWell.y);
            // aim arrow: orb flings along its current travel direction. World +y
            // is up, screen +y is down, so flip vy for screen space.
            const dmag = Math.hypot(w.orb.vx, w.orb.vy) || 1;
            const ux = w.orb.vx / dmag;
            const uy = -w.orb.vy / dmag;
            const ox = w.orbScreen.x;
            const oy = w.orbScreen.y;
            const len = 30 + charge * 48;
            const tx = ox + ux * len;
            const ty = oy + uy * len;
            const a = Math.atan2(uy, ux);
            const hb = 9;
            const aimC = rgba(ASC.gold, 0.92);
            return (
              <Group>
                <Circle
                  cx={w.orbitWell.x}
                  cy={wsy}
                  r={w.orbitR}
                  style="stroke"
                  strokeWidth={1.6 + charge * 3.4}
                  color={rgba(w.orbitWell.tint, (sky.dark ? 0.5 : 0.65) + charge * 0.3)}
                />
                <Line
                  p1={vec(w.orbitWell.x, wsy)}
                  p2={vec(ox, oy)}
                  style="stroke"
                  strokeWidth={2 + charge * 2}
                  color={rgba(w.orbitWell.tint, sky.dark ? 0.6 : 0.8)}
                />
                {/* aim arrow (shaft + two barbs) */}
                <Line p1={vec(ox, oy)} p2={vec(tx, ty)} style="stroke" strokeWidth={3} strokeCap="round" color={aimC} />
                <Line p1={vec(tx, ty)} p2={vec(tx + Math.cos(a + 2.5) * hb, ty + Math.sin(a + 2.5) * hb)} style="stroke" strokeWidth={3} strokeCap="round" color={aimC} />
                <Line p1={vec(tx, ty)} p2={vec(tx + Math.cos(a - 2.5) * hb, ty + Math.sin(a - 2.5) * hb)} style="stroke" strokeWidth={3} strokeCap="round" color={aimC} />
              </Group>
            );
          })()}

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

          {/* orb */}
          <Ball x={w.orbScreen.x} y={w.orbScreen.y} rot={w.rot || 0} skin={sk} r={BALL_R} />

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
          <Text style={[styles.readyTitle, { color: sky.dark ? ASC.inkOn : ASC.ink }]}>Hold to charge orbit</Text>
          <Text style={[styles.readySub, { color: sky.dark ? ASC.inkOn2 : ASC.ink2 }]}>
            The longer you hold, the harder the fling. Release toward the next well.
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---- gravity well (luminous frosted glass) ---------------------------------
function Well({ wl, sx, sy, dark, hq }) {
  const tint = wl.tint;
  const R = wl.r;
  return (
    <Group>
      {/* soft halo */}
      <Circle cx={sx} cy={sy} r={R * 2.4}>
        {hq && <BlurMask blur={10} style="normal" />}
        <RadialGradient
          c={vec(sx, sy)}
          r={R * 2.4}
          positions={[0.2, 1]}
          colors={[rgba(tint, dark ? 0.42 : 0.5), rgba(tint, 0)]}
        />
      </Circle>
      {/* outer capture ring */}
      <Circle cx={sx} cy={sy} r={R} style="stroke" strokeWidth={2} color={rgba(tint, dark ? 0.7 : 0.9)} />
      {/* frosted core */}
      <Circle cx={sx} cy={sy} r={R * 0.62}>
        <RadialGradient
          c={vec(sx - R * 0.18, sy - R * 0.18)}
          r={R * 0.7}
          colors={[rgba('#ffffff', 0.9), rgba(tint, 0.5)]}
        />
      </Circle>
      {/* bright pip */}
      <Circle cx={sx - R * 0.16} cy={sy - R * 0.16} r={R * 0.16} color="rgba(255,255,255,0.92)" />
    </Group>
  );
}

// ---- ball ------------------------------------------------------------------
function Ball({ x, y, rot, skin, r }) {
  // R comes in as a prop: BALL_R is scaled per-device inside GameStage, and this
  // component is top-level so it can't close over that scoped value.
  const R = r;
  const c1 = skin.c1 || skin.core || '#FFFFFF';
  const c2 = skin.c2 || skin.glow || c1;
  const halo = skin.glow || c2;
  const bodyColors = skin.colors && skin.colors.length >= 2 ? skin.colors : [c1, c2];
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot * 0.4 }]}>
      {/* glow (subtle, tight) */}
      <Circle cx={0} cy={0} r={R * 1.5}>
        <RadialGradient c={vec(0, 0)} r={R * 1.5} positions={[0.4, 1]} colors={[rgba(halo, 0.45), rgba(halo, 0)]} />
      </Circle>
      {/* body — multi-color diagonal gradient sweep */}
      <Circle cx={0} cy={0} r={R}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={bodyColors} />
      </Circle>
      {/* glossy sheen */}
      <Circle cx={0} cy={0} r={R}>
        <RadialGradient
          c={vec(-R * 0.34, -R * 0.4)}
          r={R * 1.05}
          positions={[0, 0.6]}
          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
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
    paddingHorizontal: 32,
    zIndex: 5,
  },
  readyTitle: {
    fontFamily: FONT.displaySemi,
    fontSize: 22,
    marginTop: 6,
    textAlign: 'center',
  },
  readySub: {
    fontFamily: FONT.sans,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 320,
  },
});
