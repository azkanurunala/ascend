// Ascend — menu screens (DOM glass UI). Home, GameOver, Leaderboard, Cosmetics, Settings.

const { useState: _sS, useMemo: _sM } = React;

// Soft static sky behind menus — calm meadow→open-sky with drifting glass blobs.
function MenuSky({ children, scrollKey }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden",
      background: "linear-gradient(180deg, #79C7E8 0%, #BFE3E0 48%, #EAF3E4 100%)" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { c: "#FFFFFF", x: "-12%", y: "8%", s: 280, o: 0.55 },
          { c: "#CFEFFF", x: "62%", y: "2%", s: 320, o: 0.5 },
          { c: "#E8FFE6", x: "30%", y: "64%", s: 300, o: 0.45 },
          { c: "#FFF6D8", x: "78%", y: "52%", s: 220, o: 0.4 },
        ].map((b, i) => (
          <div key={i} style={{ position: "absolute", left: b.x, top: b.y, width: b.s, height: b.s,
            borderRadius: "50%", opacity: b.o, filter: "blur(46px)",
            background: `radial-gradient(circle, ${b.c} 0%, ${b.c}00 68%)`,
            animation: `ascFloat ${7 + i}s ease-in-out infinite` }} />
        ))}
      </div>
      <div className="asc-app" style={{ position: "absolute", inset: 0, overflowY: "auto",
        WebkitOverflowScrolling: "touch" }}>{children}</div>
    </div>
  );
}

function ScreenHead({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      padding: "0 22px", marginBottom: 18 }}>
      <div>
        <div className="asc-eyebrow" style={{ color: ASC.ink2, marginBottom: 5 }}>{eyebrow}</div>
        <div className="asc-display" style={{ color: ASC.ink, fontSize: 30, fontWeight: 700 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// ── HOME / PLAY ───────────────────────────────────────────────────
function HomeScreen({ skin, best, games, topBand, reviveReady, onPlay }) {
  return (
    <MenuSky>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
        padding: "84px 22px 132px", boxSizing: "border-box" }}>
        {/* wordmark */}
        <div style={{ textAlign: "center" }}>
          <div className="asc-eyebrow" style={{ color: ASC.ink2, letterSpacing: 4 }}>Offline · One tap</div>
          <div className="asc-display" style={{ color: ASC.ink, fontSize: 60, fontWeight: 700,
            lineHeight: 0.92, marginTop: 8 }}>Ascend</div>
          <div className="asc-sans" style={{ color: ASC.ink2, fontSize: 14.5, marginTop: 10 }}>
            Tap to rise. Dodge to survive.</div>
        </div>

        {/* hero orb */}
        <div style={{ display: "flex", justifyContent: "center", margin: "30px 0 26px",
          position: "relative" }}>
          <div style={{ animation: "ascFloat 3.4s ease-in-out infinite" }}>
            <Orb skin={skin} size={104} />
          </div>
          <div style={{ position: "absolute", bottom: -6, width: 120, height: 16, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,50,80,0.18), transparent 70%)" }} />
        </div>

        {/* best card */}
        <Glass tone="hi" pad={18} radius={24} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="asc-eyebrow" style={{ color: ASC.ink2 }}>Personal best</div>
              <div className="asc-mono asc-num" style={{ color: ASC.ink, fontSize: 40, fontWeight: 600,
                lineHeight: 1.05 }}>{best.toLocaleString()}</div>
            </div>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l8 9h-4.5v8h-7v-8H4l8-9z" fill={ASC.gold} opacity="0.92" />
            </svg>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <MiniStat label="Runs" value={games} />
            <MiniStat label="Ceiling" value={topBand} mono={false} />
            <MiniStat label="Revive" value={reviveReady ? "Ready" : "Used"} mono={false}
              accent={reviveReady ? ASC.mint : ASC.ink3} />
          </div>
        </Glass>

        <div style={{ flex: 1 }} />

        {/* play button */}
        <button onClick={onPlay} style={{
          appearance: "none", border: "none", cursor: "pointer", width: "100%", padding: "18px",
          borderRadius: 22, color: "#08233C", fontWeight: 700, fontSize: 19,
          fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em",
          background: "linear-gradient(135deg, #FFFFFF 0%, #CFEFFF 100%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 14px 34px rgba(30,90,150,0.32)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          position: "relative", overflow: "hidden",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4l7 8h-4v7H9v-7H5l7-8z" fill="#08233C" />
          </svg>
          Play
        </button>
      </div>
    </MenuSky>
  );
}

function MiniStat({ label, value, mono = true, accent }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,0.4)", borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.6)", padding: "9px 11px" }}>
      <div className="asc-eyebrow" style={{ color: ASC.ink3, fontSize: 9, letterSpacing: 1.6 }}>{label}</div>
      <div className={mono ? "asc-mono asc-num" : "asc-sans"} style={{ color: accent || ASC.ink,
        fontSize: mono ? 18 : 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── GAME OVER overlay ─────────────────────────────────────────────
function GameOverOverlay({ score, best, isBest, band, reviveReady, onRetry, onRevive, onHome }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, background: "rgba(8,18,32,0.32)", animation: "ascRise 0.26s ease both" }}>
      <Glass tone="hi" pad={24} radius={28} style={{ width: "100%", maxWidth: 320, textAlign: "center",
        animation: "ascPop 0.3s cubic-bezier(.2,1.1,.4,1) both" }}>
        {isBest && (
          <div className="asc-eyebrow" style={{ color: ASC.gold, marginBottom: 8,
            display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1 3-6z" fill={ASC.gold}/></svg>
            New personal best
          </div>
        )}
        {!isBest && <div className="asc-eyebrow" style={{ color: ASC.ink2, marginBottom: 8 }}>Run ended · {band}</div>}
        <div className="asc-mono asc-num" style={{ color: ASC.ink, fontSize: 56, fontWeight: 600, lineHeight: 1 }}>
          {score.toLocaleString()}</div>
        <div className="asc-sans" style={{ color: ASC.ink2, fontSize: 13, marginTop: 6 }}>
          Best {best.toLocaleString()}</div>

        <button onClick={onRetry} style={primaryBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4l7 8h-4v7H9v-7H5l7-8z" fill="#08233C"/></svg>
          Play again
        </button>

        <button onClick={reviveReady ? onRevive : undefined} disabled={!reviveReady} style={{
          ...ghostBtn, opacity: reviveReady ? 1 : 0.45, marginTop: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 11h4l2-5 4 12 2-7h6" stroke={ASC.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {reviveReady ? "Revive — watch ad" : "Revive used today"}
        </button>

        <button onClick={onHome} style={{ ...textBtn, marginTop: 8 }}>Home</button>
      </Glass>
    </div>
  );
}

const primaryBtn = {
  appearance: "none", border: "none", cursor: "pointer", width: "100%", marginTop: 20, padding: "15px",
  borderRadius: 18, color: "#08233C", fontWeight: 700, fontSize: 16,
  fontFamily: "'Space Grotesk', sans-serif",
  background: "linear-gradient(135deg, #FFFFFF, #CFEFFF)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 10px 24px rgba(30,90,150,0.3)",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
};
const ghostBtn = {
  appearance: "none", cursor: "pointer", width: "100%", padding: "13px", borderRadius: 16,
  background: "rgba(255,255,255,0.34)", border: "1px solid rgba(255,255,255,0.6)",
  color: ASC.ink, fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const textBtn = {
  appearance: "none", border: "none", background: "transparent", cursor: "pointer", width: "100%",
  padding: "8px", color: ASC.ink2, fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
};

// ── LEADERBOARD ───────────────────────────────────────────────────
const LB_SEED = [
  { name: "Kestrel", s: 14820, f: false }, { name: "Alex", s: 12390, f: true },
  { name: "nova_77", s: 11540, f: false }, { name: "Mira", s: 10110, f: true },
  { name: "drift.io", s: 9460, f: false }, { name: "Pavel", s: 8730, f: false },
  { name: "Lune", s: 7980, f: true }, { name: "qwerty", s: 7240, f: false },
  { name: "Sol", s: 6610, f: false }, { name: "echo", s: 6080, f: false },
  { name: "Tariq", s: 5520, f: false }, { name: "wisp", s: 5010, f: false },
  { name: "June", s: 4540, f: true }, { name: "k.", s: 4120, f: false },
  { name: "halo", s: 3680, f: false }, { name: "Ona", s: 3210, f: false },
];
function LeaderboardScreen({ best }) {
  const rows = _sM(() => {
    const list = [...LB_SEED, { name: "You", s: best, f: false, me: true }]
      .sort((a, b) => b.s - a.s);
    return list.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [best]);
  const me = rows.find((r) => r.me);
  return (
    <MenuSky>
      <div style={{ padding: "96px 0 120px" }}>
        <ScreenHead eyebrow="This week · local" title="Leaderboard"
          right={<span className="asc-mono" style={{ color: ASC.ink2, fontSize: 11,
            background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.6)",
            padding: "5px 9px", borderRadius: 999, marginBottom: 4 }}>Resets Sun</span>} />

        {/* your rank */}
        <div style={{ padding: "0 18px", marginBottom: 14 }}>
          <Glass tone="hi" pad={14} radius={20} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="asc-mono asc-num" style={{ color: ASC.sky, fontSize: 26, fontWeight: 600,
              width: 52, textAlign: "center" }}>#{me.rank}</div>
            <div style={{ flex: 1 }}>
              <div className="asc-sans" style={{ color: ASC.ink, fontWeight: 700, fontSize: 15 }}>You</div>
              <div className="asc-sans" style={{ color: ASC.ink2, fontSize: 12 }}>
                {me.rank > 1 ? `${(rows[me.rank-2].s - me.s).toLocaleString()} to climb a rank` : "Top of the sky"}</div>
            </div>
            <div className="asc-mono asc-num" style={{ color: ASC.ink, fontSize: 19, fontWeight: 600 }}>
              {me.s.toLocaleString()}</div>
          </Glass>
        </div>

        {/* list */}
        <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 7 }}>
          {rows.map((r) => (
            <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 16,
              background: r.me ? "rgba(120,185,245,0.42)" : "rgba(255,255,255,0.52)",
              border: `1px solid ${r.me ? "rgba(90,169,242,0.6)" : "rgba(255,255,255,0.7)"}`,
              boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
              <div className="asc-mono asc-num" style={{ width: 30, textAlign: "center",
                color: r.rank <= 3 ? ASC.gold : ASC.ink3, fontSize: 14, fontWeight: 600 }}>{r.rank}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="asc-sans" style={{ color: ASC.ink, fontWeight: r.me ? 700 : 600,
                  fontSize: 14.5 }}>{r.name}</span>
                {r.f && <span className="asc-mono" style={{ fontSize: 9, color: ASC.violet,
                  background: "rgba(169,140,245,0.16)", padding: "2px 6px", borderRadius: 999,
                  letterSpacing: 0.6 }}>FRIEND</span>}
              </div>
              <div className="asc-mono asc-num" style={{ color: ASC.ink2, fontSize: 14, fontWeight: 600 }}>
                {r.s.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </MenuSky>
  );
}

// ── COSMETICS / SKINS ─────────────────────────────────────────────
function CosmeticsScreen({ owned, equipped, onEquip, onBuy }) {
  const [sel, setSel] = _sS(equipped);
  const skin = ASC_SKINS.find((s) => s.id === sel) || ASC_SKINS[0];
  const isOwned = owned.includes(skin.id);
  const isEquipped = equipped === skin.id;
  return (
    <MenuSky>
      <div style={{ padding: "96px 0 120px" }}>
        <ScreenHead eyebrow="Cosmetic · no edge" title="Skins" />

        {/* preview */}
        <div style={{ padding: "0 18px", marginBottom: 16 }}>
          <Glass tone="hi" pad={22} radius={26} style={{ display: "flex", flexDirection: "column",
            alignItems: "center" }}>
            <div style={{ animation: "ascFloat 3s ease-in-out infinite", margin: "6px 0 16px" }}>
              <Orb skin={skin} size={96} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="asc-display" style={{ color: ASC.ink, fontSize: 22, fontWeight: 700 }}>{skin.name}</div>
              <span className="asc-mono" style={{ fontSize: 9.5, color: ASC.ink2,
                background: "rgba(255,255,255,0.5)", padding: "3px 8px", borderRadius: 999,
                letterSpacing: 1 }}>{skin.tag.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 16, width: "100%" }}>
              {isEquipped ? (
                <div style={{ ...ghostBtn, justifyContent: "center", color: ASC.mint, fontWeight: 700 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke={ASC.mint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Equipped
                </div>
              ) : isOwned ? (
                <button onClick={() => onEquip(skin.id)} style={{ ...primaryBtn, marginTop: 0 }}>Equip</button>
              ) : (
                <button onClick={() => { onBuy(skin.id); }} style={{ ...primaryBtn, marginTop: 0 }}>
                  Unlock · ${skin.price.toFixed(2)}</button>
              )}
            </div>
          </Glass>
        </div>

        {/* grid */}
        <div style={{ padding: "0 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {ASC_SKINS.map((s) => {
            const own = owned.includes(s.id);
            const eq = equipped === s.id;
            const on = sel === s.id;
            return (
              <button key={s.id} onClick={() => setSel(s.id)} style={{
                appearance: "none", cursor: "pointer", padding: "14px 8px 10px", borderRadius: 18,
                background: on ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.44)",
                border: `1.5px solid ${on ? "rgba(90,169,242,0.7)" : "rgba(255,255,255,0.7)"}`,
                boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                position: "relative" }}>
                <Orb skin={s} size={42} animate={false} />
                <div className="asc-sans" style={{ color: ASC.ink, fontWeight: 600, fontSize: 12 }}>{s.name}</div>
                <div className="asc-mono" style={{ fontSize: 9.5, fontWeight: 600,
                  color: eq ? ASC.mint : own ? ASC.ink3 : ASC.sky }}>
                  {eq ? "EQUIPPED" : own ? "OWNED" : "$" + s.price.toFixed(2)}</div>
                {!own && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", top: 9, right: 9 }}>
                    <rect x="5" y="11" width="14" height="9" rx="2" fill={ASC.ink3}/>
                    <path d="M8 11V8a4 4 0 018 0v3" stroke={ASC.ink3} strokeWidth="2" fill="none"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </MenuSky>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────
function SettingsScreen({ settings, onToggle, onReset }) {
  const [confirm, setConfirm] = _sS(false);
  const Row = ({ label, sub, k }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
      <div style={{ flex: 1 }}>
        <div className="asc-sans" style={{ color: ASC.ink, fontWeight: 600, fontSize: 14.5 }}>{label}</div>
        {sub && <div className="asc-sans" style={{ color: ASC.ink2, fontSize: 12, marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={() => onToggle(k)} style={{ position: "relative", width: 46, height: 28,
        borderRadius: 999, border: "none", cursor: "pointer", padding: 0,
        background: settings[k] ? "linear-gradient(135deg,#5AA9F2,#4FE0B0)" : "rgba(20,40,70,0.18)",
        transition: "background .2s" }}>
        <span style={{ position: "absolute", top: 3, left: 3, width: 22, height: 22, borderRadius: "50%",
          background: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
          transform: settings[k] ? "translateX(18px)" : "translateX(0)", transition: "transform .2s" }} />
      </button>
    </div>
  );
  const sep = <div style={{ height: 1, background: "rgba(255,255,255,0.5)", margin: "0 16px" }} />;
  return (
    <MenuSky>
      <div style={{ padding: "96px 22px 120px" }}>
        <ScreenHead eyebrow="No account · offline" title="Settings" />
        <Glass tone="hi" pad={0} radius={22} style={{ overflow: "hidden", marginBottom: 16 }}>
          <Row label="Sound" sub="Taps, chimes, ambience" k="sound" />
          {sep}
          <Row label="Reduced motion" sub="Calmer trails and shake" k="reduceMotion" />
          {sep}
          <Row label="Haptics" sub="Subtle taps on collision" k="haptics" />
        </Glass>

        <Glass tone="reg" pad={16} radius={22} style={{ marginBottom: 16 }}>
          <div className="asc-sans" style={{ color: ASC.ink, fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>
            Ascend</div>
          <div className="asc-sans" style={{ color: ASC.ink2, fontSize: 12.5, lineHeight: 1.5 }}>
            One tap. No account. No internet. Climb through eight altitude bands, from the meadow to
            orbit. Your best stays on this device.</div>
          <div className="asc-mono" style={{ color: ASC.ink3, fontSize: 10.5, marginTop: 10, letterSpacing: 1 }}>
            v1.0 · MVP</div>
        </Glass>

        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ ...ghostBtn, color: ASC.danger,
            borderColor: "rgba(255,107,94,0.4)", background: "rgba(255,107,94,0.10)" }}>
            Delete save data</button>
        ) : (
          <Glass tone="reg" pad={14} radius={18} style={{ border: "1px solid rgba(255,107,94,0.4)" }}>
            <div className="asc-sans" style={{ color: ASC.ink, fontSize: 13, fontWeight: 600, textAlign: "center" }}>
              Erase best score, skins and stats?</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setConfirm(false)} style={{ ...ghostBtn, flex: 1 }}>Keep</button>
              <button onClick={() => { onReset(); setConfirm(false); }} style={{ ...ghostBtn, flex: 1,
                color: "#fff", background: ASC.danger, border: "none" }}>Erase</button>
            </div>
          </Glass>
        )}
      </div>
    </MenuSky>
  );
}

Object.assign(window, {
  HomeScreen, GameOverOverlay, LeaderboardScreen, CosmeticsScreen, SettingsScreen, MenuSky,
});
