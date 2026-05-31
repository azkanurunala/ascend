// Ascend — app shell: state, persistence, glass bottom nav, game flow, Tweaks.

const { useState: aS, useEffect: aE, useCallback: aC } = React;

// ── persistence ───────────────────────────────────────────────────
const LS = {
  get(k, d) { try { const v = localStorage.getItem("ascend." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("ascend." + k, JSON.stringify(v)); } catch (e) {} },
};
const today = () => new Date().toISOString().slice(0, 10);

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "difficulty": "normal",
  "menuMotion": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [tab, setTab] = aS("play");
  const [mode, setMode] = aS("menu");        // menu | playing
  const [runKey, setRunKey] = aS(1);
  const [reviveAt, setReviveAt] = aS(0);
  const [over, setOver] = aS(null);          // {score,isBest,band}
  const [statusDark, setStatusDark] = aS(false);

  const [best, setBest] = aS(() => LS.get("best", 0));
  const [games, setGames] = aS(() => LS.get("games", 0));
  const [owned, setOwned] = aS(() => LS.get("owned", ["drift", "ember", "neon"]));
  const [equipped, setEquipped] = aS(() => LS.get("skin", "drift"));
  const [reviveDate, setReviveDate] = aS(() => LS.get("reviveDate", ""));
  const [settings, setSettings] = aS(() => LS.get("settings", { sound: true, reduceMotion: false, haptics: true }));
  const [scale, setScale] = aS(1);

  const skin = ASC_SKINS.find((s) => s.id === equipped) || ASC_SKINS[0];
  const reviveReady = reviveDate !== today();
  const topBand = best > 0 ? skyAt(best).name : "—";
  const reduceMotion = settings.reduceMotion || !t.menuMotion;

  aE(() => LS.set("best", best), [best]);
  aE(() => LS.set("games", games), [games]);
  aE(() => LS.set("owned", owned), [owned]);
  aE(() => LS.set("skin", equipped), [equipped]);
  aE(() => LS.set("reviveDate", reviveDate), [reviveDate]);
  aE(() => LS.set("settings", settings), [settings]);

  // ── game flow ───────────────────────────────────────────────────
  const startGame = aC(() => {
    setOver(null); setStatusDark(false);
    setRunKey((k) => k + 1); setMode("playing");
  }, []);

  const handleGameOver = aC((score) => {
    setGames((g) => g + 1);
    setBest((b) => Math.max(b, score));
    setOver({ score, isBest: score > best, band: skyAt(score).name });
  }, [best]);

  const retry = aC(() => { setOver(null); setStatusDark(false); setRunKey((k) => k + 1); }, []);
  const revive = aC(() => {
    if (reviveReady) { setReviveDate(today()); setOver(null); setReviveAt((r) => r + 1); }
  }, [reviveReady]);
  const goHome = aC(() => { setOver(null); setMode("menu"); setTab("play"); setStatusDark(false); }, []);

  // ── cosmetics ───────────────────────────────────────────────────
  const buy = (id) => { setOwned((o) => o.includes(id) ? o : [...o, id]); setEquipped(id); };
  const equip = (id) => setEquipped(id);

  // ── settings ────────────────────────────────────────────────────
  const toggle = (k) => setSettings((s) => ({ ...s, [k]: !s[k] }));
  const resetAll = () => {
    setBest(0); setGames(0); setOwned(["drift", "ember", "neon"]); setEquipped("drift"); setReviveDate("");
  };

  // ── render screen ───────────────────────────────────────────────
  let screen;
  if (mode === "playing") {
    screen = (
      <div style={{ position: "absolute", inset: 0 }}>
        <GameStage skin={skin} runKey={runKey} reviveAt={reviveAt} paused={!!over}
          reduceMotion={reduceMotion} difficulty={t.difficulty}
          onGameOver={handleGameOver}
          onBand={(b) => setStatusDark(!!ASC_BANDS.find((x) => x.name === b && x.dark))} />
        {/* exit chip */}
        {!over && (
          <button onClick={goHome} aria-label="Exit" style={{ position: "absolute", top: 56, right: 18,
            zIndex: 6, width: 38, height: 38, borderRadius: 999, cursor: "pointer",
            border: `1px solid ${statusDark ? ASC.hairDk : ASC.hair}`,
            background: statusDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.32)",
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke={statusDark ? "#fff" : ASC.ink} strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {over && (
          <GameOverOverlay score={over.score} best={best} isBest={over.isBest} band={over.band}
            reviveReady={reviveReady} onRetry={retry} onRevive={revive} onHome={goHome} />
        )}
      </div>
    );
  } else if (tab === "play") {
    screen = <HomeScreen skin={skin} best={best} games={games} topBand={topBand}
      reviveReady={reviveReady} onPlay={startGame} />;
  } else if (tab === "ranks") {
    screen = <LeaderboardScreen best={best} />;
  } else if (tab === "skins") {
    screen = <CosmeticsScreen owned={owned} equipped={equipped} onEquip={equip} onBuy={buy} />;
  } else {
    screen = <SettingsScreen settings={settings} onToggle={toggle} onReset={resetAll} />;
  }

  const dark = mode === "playing" ? statusDark : false;
  const W = 402, H = 874;

  aE(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 28) / W, (window.innerHeight - 28) / H));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [W, H]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 14, boxSizing: "border-box" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <IOSDevice width={W} height={H} dark={dark} safeAreaTop={0}
        background={dark ? "#070A1B" : "#79C7E8"}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden",
          background: dark ? "#070A1B" : "#79C7E8", transition: "background .4s" }}>
          {screen}
          {mode !== "playing" && <BottomNav tab={tab} setTab={setTab} onPlay={startGame} />}
        </div>
      </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Game feel" />
        <TweakRadio label="Difficulty" value={t.difficulty} options={["chill", "normal", "intense"]}
          onChange={(v) => setTweak("difficulty", v)} />
        <TweakToggle label="Menu motion" value={t.menuMotion} onChange={(v) => setTweak("menuMotion", v)} />
      </TweaksPanel>
    </div>
  );
}

// ── bottom nav (glass) ──────────────────────────────────────────────
function BottomNav({ tab, setTab, onPlay }) {
  const items = [
    { id: "play", label: "Play", icon: (c) => <path d="M12 4l7 8h-4v7H9v-7H5l7-8z" fill={c} /> },
    { id: "ranks", label: "Ranks", icon: (c) => <g><rect x="4" y="12" width="4" height="7" rx="1" fill={c}/><rect x="10" y="7" width="4" height="12" rx="1" fill={c}/><rect x="16" y="10" width="4" height="9" rx="1" fill={c}/></g> },
    { id: "skins", label: "Skins", icon: (c) => <g><circle cx="12" cy="12" r="7" fill={c}/><circle cx="9.6" cy="9.6" r="2" fill="#fff" opacity="0.8"/></g> },
    { id: "settings", label: "Settings", icon: (c) => <g><circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2" stroke={c} strokeWidth="2" strokeLinecap="round"/></g> },
  ];
  return (
    <div style={{ position: "absolute", left: 14, right: 14, bottom: 22, zIndex: 20 }}>
      <div className="asc-glass" style={{ display: "flex", alignItems: "center",
        background: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 26, padding: 7,
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 34px rgba(20,50,90,0.22)" }}>
        {items.map((it) => {
          const active = tab === it.id;
          const c = active ? "#0F1A2B" : "rgba(15,26,43,0.5)";
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{
              flex: 1, appearance: "none", border: "none", cursor: "pointer", background: "transparent",
              padding: "7px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              position: "relative" }}>
              <div style={{ width: 44, height: 30, borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center",
                background: active ? "rgba(255,255,255,0.85)" : "transparent",
                boxShadow: active ? "0 3px 10px rgba(20,50,90,0.18)" : "none", transition: "all .2s" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none">{it.icon(c)}</svg>
              </div>
              <span className="asc-sans" style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: c }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

Object.assign(window, { App, BottomNav });
