// Ascend — canvas game engine. One-tap rise-against-gravity, dodge frosted-glass
// pillars. All mutable state in refs; React only for the throttled HUD + lifecycle.
// Props:
//   skin       — cosmetic object (core/glow/trail)
//   runKey     — bump to (re)start a fresh run
//   reviveAt   — bump to revive (keep score, clear danger, resume)
//   paused     — freeze loop (e.g. when a menu is over the game)
//   reduceMotion
//   onGameOver(score) — called once when the ball dies
//   onAltitude(score) — fires when band name changes (optional)

const { useRef: _uR, useEffect: _uE, useState: _uS } = React;

// canvas path helpers (shared within this file's scope)
function roundRect(ctx, x, y, w, h, r) {
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = rr;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y); ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br); ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h); ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl); ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
function roundedBlob(ctx, cx, cy, s) {
  // a soft lumpy cloud from overlapping circles
  ctx.beginPath();
  ctx.arc(cx - s * 0.5, cy + s * 0.12, s * 0.42, 0, 7);
  ctx.arc(cx - s * 0.16, cy - s * 0.12, s * 0.5, 0, 7);
  ctx.arc(cx + s * 0.24, cy - s * 0.04, s * 0.46, 0, 7);
  ctx.arc(cx + s * 0.58, cy + s * 0.14, s * 0.38, 0, 7);
  ctx.arc(cx + s * 0.1, cy + s * 0.24, s * 0.5, 0, 7);
  ctx.fill();
}

function GameStage({ skin, runKey, reviveAt, paused, reduceMotion, difficulty, onGameOver, onBand }) {
  const wrapRef = _uR(null);
  const canvasRef = _uR(null);
  const g = _uR(null);            // mutable game world
  const [phase, setPhase] = _uS("ready");   // ready | run | dead
  const [hud, setHud] = _uS({ score: 0, band: "Meadow", best: bestScore() });
  const skinRef = _uR(skin); skinRef.current = skin;
  const pausedRef = _uR(paused); pausedRef.current = paused;
  const rmRef = _uR(reduceMotion); rmRef.current = reduceMotion;
  const difRef = _uR(difficulty); difRef.current = difficulty;

  // ── world factory ──────────────────────────────────────────────
  function freshWorld(W, H) {
    return {
      W, H,
      ballX: W * 0.32, ballY: H * 0.42, vel: 0, rot: 0,
      gravity: 2000, flap: 560,
      obstacles: [],            // { x, gapY, gapH, w, passed }
      spawnX: W + 60,
      scoreF: 0, score: 0, dist: 0,
      trail: [], sparks: [],
      clouds: seedClouds(W, H),
      stars: seedStars(W, H),
      pops: [],                 // floating +score
      shake: 0,
      band: "Meadow",
      started: false,
      dead: false,
      t: 0, acc: 0, last: 0,
      flashRevive: 0,
    };
  }
  function seedClouds(W, H) {
    const arr = [];
    for (let i = 0; i < 5; i++) arr.push({
      x: Math.random() * W * 1.4, y: Math.random() * H * 0.8 + 30,
      s: 50 + Math.random() * 90, sp: 0.18 + Math.random() * 0.16, o: 0.5 + Math.random() * 0.4,
    });
    return arr;
  }
  function seedStars(W, H) {
    const arr = [];
    for (let i = 0; i < 60; i++) arr.push({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3,
      tw: Math.random() * Math.PI * 2, sp: 0.6 + Math.random(),
    });
    return arr;
  }

  // ── difficulty from score (PRD formulas, tuned to px) ──────────
  function diff(score) {
    const D = { chill: { sp: 0.82, gap: 1.12 }, normal: { sp: 1, gap: 1 }, intense: { sp: 1.22, gap: 0.84 } }[difRef.current || "normal"];
    return {
      speed: Math.min(360 * D.sp, (156 + score * 0.020) * D.sp),
      gapH:  Math.max(146 * D.gap, (248 - score * 0.0135) * D.gap),
      spacingX: Math.max(196, 320 - score * 0.012),
    };
  }

  function spawnObstacle(w) {
    const W = w.W, H = w.H;
    const d = diff(w.score);
    const margin = 64;
    const gapH = d.gapH;
    const gapY = margin + gapH / 2 + Math.random() * (H - 2 * margin - gapH - 70);
    w.obstacles.push({ x: w.spawnX, gapY, gapH, w: 62, passed: false });
    w.spawnX += d.spacingX;
  }

  // ── lifecycle: build world on runKey ───────────────────────────
  _uE(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    g.current = freshWorld(W, H);
    setPhase("ready");
    setHud({ score: 0, band: "Meadow", best: bestScore() });
  }, [runKey]);

  // ── revive ─────────────────────────────────────────────────────
  _uE(() => {
    if (!reviveAt) return;
    const w = g.current; if (!w) return;
    w.dead = false; w.vel = -w.flap * 0.4;
    w.ballY = w.H * 0.42;
    // clear obstacles near the ball so revive is fair
    w.obstacles = w.obstacles.filter((o) => o.x > w.ballX + 220 || o.x < w.ballX - 80);
    w.flashRevive = 1;
    setPhase("run");
  }, [reviveAt]);

  // ── input ──────────────────────────────────────────────────────
  function tap() {
    const w = g.current; if (!w || pausedRef.current) return;
    if (phase === "dead") return;
    if (!w.started) {
      w.started = true;
      setPhase("run");
      spawnObstacle(w);
    }
    w.vel = -w.flap;
    // burst of trail sparks on flap
    for (let i = 0; i < 5; i++) w.sparks.push({
      x: w.ballX - 6, y: w.ballY + 10, vx: -40 - Math.random() * 60, vy: (Math.random() - 0.5) * 80,
      life: 1, r: 1.5 + Math.random() * 2.2,
    });
  }

  // ── main loop ──────────────────────────────────────────────────
  _uE(() => {
    let raf;
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    function fit() {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.current && (g.current.W !== W || g.current.H !== H)) { g.current.W = W; g.current.H = H; }
    }
    fit();
    const ro = new ResizeObserver(fit); ro.observe(wrap);

    let hudTick = 0;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const w = g.current; if (!w) return;
      if (!w.last) w.last = ts;
      let dt = (ts - w.last) / 1000; w.last = ts;
      if (dt > 0.05) dt = 0.05;
      const running = phase === "run" && w.started && !w.dead && !pausedRef.current;

      if (running) step(w, dt);
      else if (!w.started && !pausedRef.current) idle(w, dt);

      draw(ctx, w);

      // throttle HUD react updates ~12fps
      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        if (w.band !== hud.band || Math.abs(w.score - hud.score) >= 1) {
          setHud((h) => ({ score: w.score, band: w.band, best: h.best }));
        }
      }
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line
  }, [phase]);

  // gentle bobbing before start
  function idle(w, dt) {
    w.t += dt;
    w.ballY = w.H * 0.42 + Math.sin(w.t * 2) * 10;
    w.clouds.forEach((c) => { c.x -= c.sp * 18 * dt; if (c.x < -c.s) { c.x = w.W + c.s; c.y = Math.random() * w.H * 0.8 + 30; } });
    pushTrail(w);
  }

  function step(w, dt) {
    w.t += dt;
    const d = diff(w.score);
    // physics
    w.vel += w.gravity * dt;
    w.ballY += w.vel * dt;
    w.rot = Math.max(-0.5, Math.min(0.9, w.vel / 900));

    // scroll + score
    const dx = d.speed * dt;
    w.dist += dx;
    w.scoreF += dt * d.speed * 0.42;
    w.score = Math.floor(w.scoreF);

    // band
    const sky = skyAt(w.score);
    if (sky.name !== w.band) { w.band = sky.name; if (onBand) onBand(sky.name); }

    // obstacles
    w.spawnX -= dx;
    w.obstacles.forEach((o) => { o.x -= dx; });
    while (w.spawnX < w.W + 40) spawnObstacle(w);
    w.obstacles = w.obstacles.filter((o) => o.x + o.w > -20);

    // scoring + collision
    const bx = w.ballX, by = w.ballY, br = 15;
    for (const o of w.obstacles) {
      if (!o.passed && o.x + o.w < bx) {
        o.passed = true;
        w.scoreF += 50; w.score = Math.floor(w.scoreF);
        w.pops.push({ x: bx + 18, y: by - 26, life: 1, val: 50 });
      }
      // collision: ball overlaps pillar columns outside the gap
      const withinX = bx + br > o.x && bx - br < o.x + o.w;
      if (withinX) {
        const top = o.gapY - o.gapH / 2, bot = o.gapY + o.gapH / 2;
        if (by - br < top || by + br > bot) die(w);
      }
    }
    // floor / ceiling
    if (by + br > w.H - 4 || by - br < 2) die(w);

    // trail + sparks
    pushTrail(w);
    w.sparks.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 1.6; });
    w.sparks = w.sparks.filter((s) => s.life > 0);
    // pops
    w.pops.forEach((p) => { p.y -= 34 * dt; p.life -= dt * 1.1; });
    w.pops = w.pops.filter((p) => p.life > 0);
    // clouds + stars parallax
    w.clouds.forEach((c) => { c.x -= (c.sp * d.speed * 0.5) * dt; if (c.x < -c.s) { c.x = w.W + c.s; c.y = Math.random() * w.H * 0.8 + 30; } });
    if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 3);
    if (w.flashRevive > 0) w.flashRevive = Math.max(0, w.flashRevive - dt * 1.4);
  }

  function pushTrail(w) {
    w.trail.unshift({ x: w.ballX, y: w.ballY });
    if (w.trail.length > 16) w.trail.pop();
  }

  function die(w) {
    if (w.dead) return;
    w.dead = true; w.shake = 1;
    for (let i = 0; i < 22; i++) w.sparks.push({
      x: w.ballX, y: w.ballY, vx: (Math.random() - 0.5) * 320, vy: (Math.random() - 0.5) * 320,
      life: 1, r: 1.5 + Math.random() * 3,
    });
    setPhase("dead");
    const fin = w.score;
    setHud((h) => ({ ...h, score: fin }));
    setTimeout(() => onGameOver && onGameOver(fin), 90);
  }

  // ── render ─────────────────────────────────────────────────────
  function draw(ctx, w) {
    const W = w.W, H = w.H;
    const sky = skyAt(w.score);
    ctx.save();
    if (w.shake > 0 && !rmRef.current) {
      const m = w.shake * 7;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    // sky gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, sky.top); grd.addColorStop(1, sky.bot);
    ctx.fillStyle = grd; ctx.fillRect(-20, -20, W + 40, H + 40);

    // stars (fade in on dark bands)
    if (sky.dark) {
      const a = Math.min(1, (w.score - 3600) / 1800);
      w.stars.forEach((s) => {
        const tw = 0.5 + 0.5 * Math.sin(w.t * s.sp * 2 + s.tw);
        ctx.globalAlpha = Math.max(0, a) * tw * 0.9;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // glass clouds
    w.clouds.forEach((c) => {
      ctx.save();
      ctx.globalAlpha = c.o * (sky.dark ? 0.4 : 0.85);
      ctx.fillStyle = sky.fog;
      ctx.shadowColor = sky.fog; ctx.shadowBlur = 26;
      roundedBlob(ctx, c.x, c.y, c.s);
      ctx.restore();
    });

    // pillars (frosted glass)
    w.obstacles.forEach((o) => {
      const top = o.gapY - o.gapH / 2, bot = o.gapY + o.gapH / 2;
      drawPillar(ctx, o.x, 0, o.w, top, sky, true);
      drawPillar(ctx, o.x, bot, o.w, H - bot, sky, false);
    });

    // trail
    const sk = skinRef.current || ASC_SKINS[0];
    for (let i = w.trail.length - 1; i >= 0; i--) {
      const p = w.trail[i];
      const f = 1 - i / w.trail.length;
      ctx.globalAlpha = f * 0.45;
      ctx.fillStyle = sk.trail;
      ctx.beginPath(); ctx.arc(p.x, p.y, 13 * f * 0.9, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // sparks
    w.sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life) * 0.8;
      ctx.fillStyle = sk.trail;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ball
    drawBall(ctx, w, sk);

    // +score pops
    w.pops.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = sky.dark ? "#fff" : "#0F1A2B";
      ctx.font = "600 16px 'Geist Mono', monospace";
      ctx.fillText("+" + p.val, p.x, p.y);
    });
    ctx.globalAlpha = 1;

    // revive flash
    if (w.flashRevive > 0) {
      ctx.fillStyle = `rgba(255,255,255,${w.flashRevive * 0.5})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.restore();
  }

  function drawPillar(ctx, x, y, w, h, sky, isTop) {
    if (h <= 0) return;
    const r = 16;
    ctx.save();
    const grd = ctx.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0, "rgba(255,255,255,0.10)");
    grd.addColorStop(0.5, sky.dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.34)");
    grd.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = grd;
    ctx.shadowColor = "rgba(30,60,110,0.18)"; ctx.shadowBlur = 16; ctx.shadowOffsetX = 2;
    roundRect(ctx, x, y, w, h, isTop ? [0,0,r,r] : [r,r,0,0]); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0;
    // glossy edge
    ctx.strokeStyle = sky.dark ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.4;
    roundRect(ctx, x + 0.7, y + 0.7, w - 1.4, h - 1.4, isTop ? [0,0,r,r] : [r,r,0,0]); ctx.stroke();
    // inner light streak
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x + w * 0.22, y + (isTop ? 0 : 6), 3, h - 6);
    // lip cap at the gap end
    ctx.fillStyle = sky.dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.5)";
    const capY = isTop ? y + h - 10 : y;
    roundRect(ctx, x - 4, capY, w + 8, 10, 5); ctx.fill();
    ctx.restore();
  }

  function drawBall(ctx, w, sk) {
    const x = w.ballX, y = w.ballY, R = 16;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(w.rot * 0.4);
    // glow
    const gl = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 2.4);
    gl.addColorStop(0, sk.glow + "cc"); gl.addColorStop(1, sk.glow + "00");
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, 0, R * 2.4, 0, 7); ctx.fill();
    // body
    const bd = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.2, 0, 0, R);
    bd.addColorStop(0, "#ffffff");
    bd.addColorStop(0.5, sk.core);
    bd.addColorStop(1, ascMixHex(sk.core, sk.glow, 0.6));
    ctx.fillStyle = bd;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    // rim
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, R - 0.6, 0, 7); ctx.stroke();
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath(); ctx.ellipse(-R * 0.32, -R * 0.36, R * 0.26, R * 0.18, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  }

  return (
    <div ref={wrapRef} onPointerDown={tap} style={{
      position: "absolute", inset: 0, touchAction: "none", cursor: "pointer", overflow: "hidden",
    }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <GameHUD hud={hud} phase={phase} dark={skyAt(hud.score).dark} />
      {phase === "ready" && <ReadyOverlay dark={skyAt(0).dark} />}
    </div>
  );
}

// ── HUD: altitude + band, top of screen ──────────────────────────
function GameHUD({ hud, phase, dark }) {
  const c = dark ? ASC.inkOn : ASC.ink;
  const c2 = dark ? ASC.inkOn2 : ASC.ink2;
  if (phase === "ready") return null;
  return (
    <div style={{ position: "absolute", top: 58, left: 0, right: 0, display: "flex",
      flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 4 }}>
      <div className="asc-eyebrow" style={{ color: c2, marginBottom: 2 }}>▲ {hud.band}</div>
      <div className="asc-mono asc-num" style={{ color: c, fontSize: 52, fontWeight: 600,
        lineHeight: 1, textShadow: dark ? "0 2px 18px rgba(0,0,0,0.4)" : "0 2px 16px rgba(255,255,255,0.6)" }}>
        {hud.score.toLocaleString()}
      </div>
    </div>
  );
}

function ReadyOverlay({ dark }) {
  const c = dark ? ASC.inkOn : ASC.ink;
  const c2 = dark ? ASC.inkOn2 : ASC.ink2;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end", paddingBottom: 150, pointerEvents: "none", zIndex: 5 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        animation: "ascFloat 2.6s ease-in-out infinite" }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.9 }}>
          <path d="M12 4l7 8h-4v7H9v-7H5l7-8z" fill={c} opacity="0.85" />
        </svg>
        <div className="asc-display" style={{ color: c, fontSize: 22, fontWeight: 600 }}>Tap to rise</div>
        <div className="asc-sans" style={{ color: c2, fontSize: 13 }}>Keep tapping. Thread the glass. Climb.</div>
      </div>
    </div>
  );
}

// ── score persistence helpers ────────────────────────────────────
function bestScore() {
  try { return parseInt(localStorage.getItem("ascend.best") || "0", 10) || 0; } catch (e) { return 0; }
}

Object.assign(window, { GameStage, bestScore });
