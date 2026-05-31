// ============ ASCEND — APP SHELL ============
// State machine, persistence, navigation, revive system, fonts.
// Ported from ascend-app.jsx and adapted to a real device (no iOS frame).

import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

import { ASC, ASC_BANDS, skyAt, skinById } from './theme';
import { LS, today } from './storage';
import GameStage from './game/GameStage';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import CosmeticsScreen from './screens/CosmeticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import GameOverOverlay from './screens/GameOverOverlay';
import BottomNav from './components/BottomNav';
import TweaksPanel from './components/TweaksPanel';
import { IconClose } from './components/Icons';

const DEFAULT_OWNED = ['drift', 'ember', 'neon'];
const DEFAULT_SETTINGS = { sound: true, reduceMotion: false, haptics: true, highQuality: true };
const DEFAULT_TWEAKS = { difficulty: 'normal', menuMotion: true };
const REVIVE_CAP = 2; // PRD §15: 1 free + 1 ad per day

function Game() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 10);

  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('play');
  const [mode, setMode] = useState('menu'); // menu | playing
  const [runKey, setRunKey] = useState(1);
  const [reviveAt, setReviveAt] = useState(0);
  const [over, setOver] = useState(null); // { score, isBest, band }
  const [statusDark, setStatusDark] = useState(false);

  const [best, setBest] = useState(0);
  const [games, setGames] = useState(0);
  const [playtime, setPlaytime] = useState(0);
  const [owned, setOwned] = useState(DEFAULT_OWNED);
  const [equipped, setEquipped] = useState('drift');
  const [revive, setRevive] = useState({ date: '', used: 0 });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tweaks, setTweaks] = useState(DEFAULT_TWEAKS);

  // ---- load persisted state once ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await LS.multiGet([
        ['best', 0],
        ['games', 0],
        ['playtime', 0],
        ['owned', DEFAULT_OWNED],
        ['skin', 'drift'],
        ['revive', { date: '', used: 0 }],
        ['settings', DEFAULT_SETTINGS],
        ['tweaks', DEFAULT_TWEAKS],
      ]);
      if (!alive) return;
      setBest(s.best);
      setGames(s.games);
      setPlaytime(s.playtime);
      setOwned(s.owned);
      setEquipped(s.skin);
      setRevive(s.revive);
      setSettings({ ...DEFAULT_SETTINGS, ...s.settings });
      setTweaks({ ...DEFAULT_TWEAKS, ...s.tweaks });
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- persist on change (after load) ----
  useEffect(() => { if (loaded) LS.set('best', best); }, [best, loaded]);
  useEffect(() => { if (loaded) LS.set('games', games); }, [games, loaded]);
  useEffect(() => { if (loaded) LS.set('playtime', playtime); }, [playtime, loaded]);
  useEffect(() => { if (loaded) LS.set('owned', owned); }, [owned, loaded]);
  useEffect(() => { if (loaded) LS.set('skin', equipped); }, [equipped, loaded]);
  useEffect(() => { if (loaded) LS.set('revive', revive); }, [revive, loaded]);
  useEffect(() => { if (loaded) LS.set('settings', settings); }, [settings, loaded]);
  useEffect(() => { if (loaded) LS.set('tweaks', tweaks); }, [tweaks, loaded]);

  // ---- derived ----
  const skin = skinById(equipped);
  const revivesUsed = revive.date === today() ? revive.used : 0;
  const reviveReady = revivesUsed < REVIVE_CAP;
  const reviveLabel = !reviveReady
    ? 'Revive used today'
    : revivesUsed === 0
    ? 'Revive — free'
    : 'Revive — watch ad';
  const topBand = best > 0 ? skyAt(best).name : '—';
  const menuAnimate = tweaks.menuMotion && !settings.reduceMotion;

  // ---- game flow ----
  const startGame = useCallback(() => {
    setOver(null);
    setStatusDark(false);
    setRunKey((k) => k + 1);
    setMode('playing');
  }, []);

  const handleGameOver = useCallback(
    (score, secs) => {
      setGames((g) => g + 1);
      setPlaytime((p) => p + (secs || 0));
      setBest((b) => Math.max(b, score));
      setOver({ score, isBest: score > best, band: skyAt(score).name });
    },
    [best]
  );

  const retry = useCallback(() => {
    setOver(null);
    setStatusDark(false);
    setRunKey((k) => k + 1);
  }, []);

  const reviveNow = useCallback(() => {
    const used = revive.date === today() ? revive.used : 0;
    if (used >= REVIVE_CAP) return;
    setRevive({ date: today(), used: used + 1 });
    setOver(null);
    setReviveAt((x) => x + 1);
  }, [revive]);

  const goHome = useCallback(() => {
    setOver(null);
    setMode('menu');
    setTab('play');
    setStatusDark(false);
  }, []);

  // ---- cosmetics / settings ----
  const buy = useCallback((id) => {
    setOwned((o) => (o.includes(id) ? o : [...o, id]));
    setEquipped(id);
  }, []);
  const equip = useCallback((id) => setEquipped(id), []);
  const toggleSetting = useCallback((k) => setSettings((s) => ({ ...s, [k]: !s[k] })), []);
  const setTweak = useCallback((k, v) => setTweaks((t) => ({ ...t, [k]: v })), []);
  const resetAll = useCallback(() => {
    setBest(0);
    setGames(0);
    setPlaytime(0);
    setOwned(DEFAULT_OWNED);
    setEquipped('drift');
    setRevive({ date: '', used: 0 });
  }, []);

  const onBand = useCallback((name) => {
    setStatusDark(!!ASC_BANDS.find((x) => x.name === name && x.dark));
  }, []);

  // ---- render ----
  let screen = null;
  if (mode === 'playing') {
    screen = (
      <View style={StyleSheet.absoluteFill}>
        <GameStage
          key={runKey}
          skin={skin}
          runKey={runKey}
          reviveAt={reviveAt}
          paused={!!over}
          reduceMotion={settings.reduceMotion}
          highQuality={settings.highQuality}
          difficulty={tweaks.difficulty}
          onGameOver={handleGameOver}
          onBand={onBand}
          width={width}
          height={height}
          topInset={topInset}
        />
        {!over && (
          <Pressable
            onPress={goHome}
            style={[
              styles.exit,
              {
                top: topInset + 12,
                borderColor: statusDark ? ASC.hairDk : ASC.hair,
                backgroundColor: statusDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.32)',
              },
            ]}
          >
            <IconClose size={16} color={statusDark ? '#fff' : ASC.ink} />
          </Pressable>
        )}
        {over && (
          <GameOverOverlay
            score={over.score}
            best={best}
            isBest={over.isBest}
            band={over.band}
            reviveReady={reviveReady}
            reviveLabel={reviveLabel}
            onRetry={retry}
            onRevive={reviveNow}
            onHome={goHome}
            animate={menuAnimate}
          />
        )}
      </View>
    );
  } else if (tab === 'play') {
    screen = (
      <HomeScreen
        skin={skin}
        best={best}
        games={games}
        playtime={playtime}
        topBand={topBand}
        reviveReady={reviveReady}
        animate={menuAnimate}
        onPlay={startGame}
        width={width}
        height={height}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );
  } else if (tab === 'ranks') {
    screen = (
      <LeaderboardScreen best={best} width={width} height={height} topInset={topInset} bottomInset={bottomInset} />
    );
  } else if (tab === 'skins') {
    screen = (
      <CosmeticsScreen
        owned={owned}
        equipped={equipped}
        onEquip={equip}
        onBuy={buy}
        animate={menuAnimate}
        width={width}
        height={height}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );
  } else {
    screen = (
      <SettingsScreen
        settings={settings}
        onToggle={toggleSetting}
        onReset={resetAll}
        width={width}
        height={height}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );
  }

  const dark = mode === 'playing' ? statusDark : false;

  return (
    <View style={[styles.root, { backgroundColor: dark ? '#070A1B' : '#79C7E8' }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {screen}
      {mode !== 'playing' && (
        <>
          <BottomNav tab={tab} setTab={setTab} bottomInset={bottomInset} />
          <TweaksPanel tweaks={tweaks} setTweak={setTweak} bottomInset={bottomInset} />
        </>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={[styles.root, { backgroundColor: '#79C7E8' }]} />;
  }

  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  exit: {
    position: 'absolute',
    right: 18,
    zIndex: 6,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
