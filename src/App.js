// ============ ASCEND — APP SHELL ============
// State machine, persistence, navigation, revive system, fonts.
// Ported from ascend-app.jsx and adapted to a real device (no iOS frame).

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Alert, LogBox } from 'react-native';
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

import { ASC, ASC_BANDS, ASC_SKINS, FONT, skyAt, skinById } from './theme';
import { LS, today } from './storage';
import {
  initIAP,
  getProStatus,
  presentCustomerCenter,
  restorePurchases,
  getOfferingPrice,
  isStoreAvailable,
} from './iap';
import { authenticateGameCenter, submitScore as submitLeaderboard } from './leaderboard';
import { isValidGiftCode } from './giftcodes';
import GameStage from './game/GameStage';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import CosmeticsScreen from './screens/CosmeticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import GameOverOverlay from './screens/GameOverOverlay';
import PaywallModal from './screens/PaywallModal';
import BottomNav from './components/BottomNav';
import { IconClose } from './components/Icons';

// RevenueCat logs verbose store-config errors as console.error (e.g. on the
// Simulator with no products); they're dev-only noise, so keep them out of the
// red LogBox overlay. They still print to the Metro console.
LogBox.ignoreLogs([/\[RevenueCat\]/, /problem with the App Store/, /offerings/i]);

const DEFAULT_OWNED = ['drift']; // free skin; the rest unlock with Ascend Pro
const ALL_SKIN_IDS = ASC_SKINS.map((s) => s.id);
const DEFAULT_SETTINGS = { sound: true, reduceMotion: false, haptics: true, highQuality: true };
const DEFAULT_TWEAKS = { difficulty: 'normal', menuMotion: true };
const FREE_REVIVES_PER_DAY = 3; // 3 free revives/day; beyond that, Ascend Pro (Pro = unlimited)

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
  const [equipped, setEquipped] = useState('drift');
  const [revive, setRevive] = useState({ date: '', used: 0 });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tweaks, setTweaks] = useState(DEFAULT_TWEAKS);

  // Ascend Pro entitlement (RevenueCat is the source of truth — not persisted).
  const [entitlementPro, setEntitlementPro] = useState(false); // from RevenueCat
  const [giftPro, setGiftPro] = useState(false); // unlocked via gift code (local)
  const pro = entitlementPro || giftPro;
  const [proPrice, setProPrice] = useState(null); // localized lifetime price
  const [paywall, setPaywall] = useState(null); // null | { intent, equip }
  const [restoring, setRestoring] = useState(false);

  // ---- load persisted state once ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await LS.multiGet([
        ['best', 0],
        ['games', 0],
        ['playtime', 0],
        ['skin', 'drift'],
        ['revive', { date: '', used: 0 }],
        ['settings', DEFAULT_SETTINGS],
        ['tweaks', DEFAULT_TWEAKS],
        ['giftPro', false],
      ]);
      if (!alive) return;
      setBest(s.best);
      setGames(s.games);
      setPlaytime(s.playtime);
      setEquipped(s.skin);
      setGiftPro(!!s.giftPro);
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
  useEffect(() => { if (loaded) LS.set('skin', equipped); }, [equipped, loaded]);
  useEffect(() => { if (loaded) LS.set('revive', revive); }, [revive, loaded]);
  useEffect(() => { if (loaded) LS.set('settings', settings); }, [settings, loaded]);
  useEffect(() => { if (loaded) LS.set('tweaks', tweaks); }, [tweaks, loaded]);

  // ---- monetization init (once) ----
  // Start Game Center, configure RevenueCat with a customer-info listener (the
  // source of truth for Ascend Pro), and fetch the current Pro status + lifetime
  // price. All no-ops until real keys are set in config.js (see
  // MONETIZATION_SETUP.md).
  useEffect(() => {
    let alive = true;
    authenticateGameCenter(); // signs in with the device's Apple ID — no login UI
    initIAP((isPro) => {
      if (alive) setEntitlementPro(isPro);
    });
    (async () => {
      const [proNow, price] = await Promise.all([getProStatus(), getOfferingPrice()]);
      if (!alive) return;
      setEntitlementPro(proNow);
      if (price) setProPrice(price);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- derived ----
  // Ascend Pro unlocks every skin; otherwise just the free default.
  const owned = pro ? ALL_SKIN_IDS : DEFAULT_OWNED;
  const skin = skinById(owned.includes(equipped) ? equipped : 'drift');
  const revivesUsed = revive.date === today() ? revive.used : 0;
  // Pro = unlimited free revives. Free players get one per day, then Ascend Pro.
  const hasFreeRevive = pro || revivesUsed < FREE_REVIVES_PER_DAY;
  const reviveReady = hasFreeRevive; // drives the Home "REVIVE" stat
  const reviveLabel = hasFreeRevive ? 'Revive — free' : 'Revive — Ascend Pro';
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
      // Submit to this run's difficulty board (difficulty can't change mid-run).
      submitLeaderboard(score, tweaks.difficulty);
    },
    [best, tweaks.difficulty]
  );

  const retry = useCallback(() => {
    setOver(null);
    setStatusDark(false);
    setRunKey((k) => k + 1);
  }, []);

  const reviveNow = useCallback(() => {
    const used = revive.date === today() ? revive.used : 0;
    // Pro players revive freely. Free players get one revive/day; beyond that,
    // open the paywall — the run resurrects on a successful purchase.
    if (!pro && used >= FREE_REVIVES_PER_DAY) {
      setPaywall({ intent: 'revive' });
      return;
    }
    if (!pro) setRevive({ date: today(), used: used + 1 });
    setOver(null);
    setReviveAt((x) => x + 1);
  }, [revive, pro]);

  const goHome = useCallback(() => {
    setOver(null);
    setMode('menu');
    setTab('play');
    setStatusDark(false);
  }, []);

  // ---- cosmetics / settings ----
  // Tapping a locked skin (or "Unlock Ascend Pro") opens our custom paywall.
  const unlockPro = useCallback((equipId) => {
    setPaywall({ intent: 'skin', equip: equipId });
  }, []);

  // Paywall reported a successful purchase: flip Pro, then fulfill the intent
  // (resurrect the run, or equip the skin the user was unlocking).
  const onPaywallPurchased = useCallback(() => {
    setEntitlementPro(true);
    if (paywall?.intent === 'revive') {
      setOver(null);
      setReviveAt((x) => x + 1);
    } else if (paywall?.equip) {
      setEquipped(paywall.equip);
    }
    setPaywall(null);
  }, [paywall]);

  const restore = useCallback(async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const isPro = await restorePurchases();
      setEntitlementPro(isPro);
      Alert.alert(
        isPro ? 'Purchases restored' : 'Nothing to restore',
        isPro
          ? 'Ascend Pro is active on this Apple ID.'
          : 'No previous purchases were found for this Apple ID.'
      );
    } finally {
      setRestoring(false);
    }
  }, [restoring]);

  const manageSubscription = useCallback(() => {
    presentCustomerCenter();
  }, []);

  // Gift code → free Ascend Pro (stored locally). Fulfills the paywall intent if
  // the code was entered from the paywall (unlock the skin / resurrect the run).
  const redeemGift = useCallback(
    (code) => {
      if (!isValidGiftCode(code)) {
        Alert.alert('Invalid code', 'That gift code isn’t valid. Double-check it and try again.');
        return;
      }
      setGiftPro(true);
      LS.set('giftPro', true);
      if (paywall?.intent === 'revive') {
        setOver(null);
        setReviveAt((x) => x + 1);
      } else if (paywall?.equip) {
        setEquipped(paywall.equip);
      }
      setPaywall(null);
      Alert.alert('Ascend Pro unlocked! 🎉', 'Every orb skin is yours and revives are unlimited. Thanks for playing!');
    },
    [paywall]
  );

  // iOS text-input dialog to enter a gift code.
  const promptRedeem = useCallback(() => {
    Alert.prompt(
      'Redeem gift code',
      'Enter your Ascend Pro gift code.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Redeem', onPress: (code) => redeemGift(code) },
      ],
      'plain-text'
    );
  }, [redeemGift]);

  // Equip only skins the player owns (all of them once Pro is active).
  const equip = useCallback((id) => {
    if (id === 'drift' || pro) setEquipped(id);
  }, [pro]);
  const toggleSetting = useCallback((k) => setSettings((s) => ({ ...s, [k]: !s[k] })), []);
  const setTweak = useCallback((k, v) => setTweaks((t) => ({ ...t, [k]: v })), []);
  const resetAll = useCallback(() => {
    setBest(0);
    setGames(0);
    setPlaytime(0);
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
      <View style={{ flex: 1 }}>
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
      <LeaderboardScreen
        best={best}
        difficulty={tweaks.difficulty}
        width={width}
        height={height}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );
  } else if (tab === 'skins') {
    screen = (
      <CosmeticsScreen
        owned={owned}
        equipped={equipped}
        onEquip={equip}
        onUnlock={unlockPro}
        pro={pro}
        proPrice={proPrice}
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
        tweaks={tweaks}
        setTweak={setTweak}
        onReset={resetAll}
        onRestore={restore}
        restoring={restoring}
        pro={pro}
        onManage={manageSubscription}
        onRedeem={promptRedeem}
        storeAvailable={isStoreAvailable()}
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
      {mode !== 'playing' && <BottomNav tab={tab} setTab={setTab} bottomInset={bottomInset} />}
      {/* DEV-only: open the paywall on demand for testing/screenshots. __DEV__
          is false in production builds, so this never ships. */}
      {__DEV__ && mode !== 'playing' && !paywall && (
        <Pressable
          onPress={() => setPaywall({ intent: 'skin' })}
          style={[styles.devPaywall, { bottom: bottomInset + 92 }]}
        >
          <Text style={styles.devPaywallText}>PAYWALL</Text>
        </Pressable>
      )}
      {paywall && (
        <PaywallModal
          onClose={() => setPaywall(null)}
          onPurchased={onPaywallPurchased}
          onRedeem={promptRedeem}
          topInset={topInset}
          bottomInset={bottomInset}
          animate={menuAnimate}
        />
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
  devPaywall: {
    position: 'absolute',
    left: 16,
    zIndex: 70,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(90,169,242,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  devPaywallText: { fontFamily: FONT.monoSemi, fontSize: 11, letterSpacing: 1, color: '#fff' },
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
