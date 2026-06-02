// ============ PAYWALL (custom, on-brand glassmorphism) ============
// A full-screen Ascend Pro paywall built from the app's own design language —
// night-sky gradient, a glowing orb, frosted-glass benefit tiles — wired
// directly to RevenueCat's purchase API (getProOffering / purchasePro). Used
// instead of RevenueCat's hosted paywall so it matches the rest of the app.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Linking, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Glass from '../components/Glass';
import Orb from '../components/Orb';
import Float from '../components/Float';
import { PrimaryButton } from '../components/Buttons';
import { IconClose, IconSkins, IconRevive, IconStar } from '../components/Icons';
import { ASC, FONT, skinById } from '../theme';
import { getProOffering, purchasePro, restorePurchases } from '../iap';
import { PRO_FALLBACK_PRICE } from '../config';

const PRIVACY_URL = 'https://azkanurunala.github.io/ascend/privacy.html';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const BENEFITS = [
  {
    key: 'skins',
    Icon: IconSkins,
    accent: ASC.violet,
    title: 'Every orb skin',
    desc: 'Ember, Neon, Amethyst, Rosegold, and the animated Aurora — all unlocked.',
  },
  {
    key: 'revives',
    Icon: IconRevive,
    accent: ASC.mint,
    title: 'Unlimited revives',
    desc: 'Keep your run alive as often as you like. No daily limit, ever.',
  },
  {
    key: 'once',
    Icon: IconStar,
    accent: ASC.gold,
    title: 'Pay once, keep forever',
    desc: 'A single purchase. No subscription, no renewals, fully offline.',
  },
];

function Tile({ Icon, accent, title, desc }) {
  return (
    <Glass dark tone="hi" radius={20} pad={15} style={{ marginBottom: 11 }}>
      <View style={styles.tileRow}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
          <Icon size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tileTitle}>{title}</Text>
          <Text style={styles.tileDesc}>{desc}</Text>
        </View>
      </View>
    </Glass>
  );
}

export default function PaywallModal({ onClose, onPurchased, onRedeem, topInset = 24, bottomInset = 16, animate = true }) {
  const aurora = skinById('aurora');
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null); // { pkg, priceString }
  const [busy, setBusy] = useState(false); // purchasing | restoring

  useEffect(() => {
    let alive = true;
    (async () => {
      const o = await getProOffering();
      if (!alive) return;
      setOffer(o);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const buy = async () => {
    if (busy) return;
    if (!offer) {
      Alert.alert('Store unavailable', 'Purchases aren’t available right now. Please check your connection and try again in a moment.');
      return;
    }
    setBusy(true);
    const res = await purchasePro(offer);
    setBusy(false);
    if (res.ok) onPurchased();
    // cancelled / error: stay on the paywall (the store sheet shows any error)
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    const isPro = await restorePurchases();
    setBusy(false);
    if (isPro) onPurchased();
  };

  const price = offer?.priceString || PRO_FALLBACK_PRICE;
  const cta = busy ? 'Please wait…' : `Unlock Ascend Pro · ${price}`;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <LinearGradient colors={['#04050F', '#0A1230', '#1A2A6B']} style={StyleSheet.absoluteFill} />
      {/* soft glow bloom behind the orb */}
      <LinearGradient
        colors={['rgba(91,184,255,0.22)', 'rgba(91,184,255,0)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.16 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <Pressable onPress={onClose} style={[styles.close, { top: topInset + 8 }]} hitSlop={10}>
        <IconClose size={16} color="#fff" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 44, paddingBottom: bottomInset + 20, paddingHorizontal: 22 }}
      >
        {/* hero */}
        <View style={styles.hero}>
          <Float enabled={animate} distance={9} duration={3200}>
            <Orb skin={aurora} size={86} />
          </Float>
          <View style={styles.titleRow}>
            <Text style={styles.titleAscend}>Ascend</Text>
            <Text style={styles.titlePro}>Pro</Text>
          </View>
          <Text style={styles.subtitle}>One tap unlocks everything. Forever.</Text>
        </View>

        {/* benefits */}
        <View style={{ marginTop: 22 }}>
          {BENEFITS.map(({ key, ...b }) => (
            <Tile key={key} {...b} />
          ))}
        </View>

        {/* purchase */}
        <View style={{ marginTop: 14 }}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={ASC.sky} />
            </View>
          ) : (
            <PrimaryButton label={cta} disabled={busy} onPress={buy} style={{ width: '100%' }} />
          )}

          {onRedeem && (
            <Pressable onPress={onRedeem} hitSlop={8} style={{ alignSelf: 'center', marginTop: 14 }}>
              <Text style={styles.giftLink}>Have a gift code? Redeem</Text>
            </Pressable>
          )}

          <Text style={styles.fine}>One-time purchase. Restore on any device signed in to the same Apple ID.</Text>

          <View style={styles.links}>
            <Pressable onPress={restore} hitSlop={8}>
              <Text style={styles.link}>Restore</Text>
            </Pressable>
            <Text style={styles.linkDot}>·</Text>
            <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
              <Text style={styles.link}>Terms</Text>
            </Pressable>
            <Text style={styles.linkDot}>·</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text style={styles.link}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: {
    position: 'absolute',
    right: 18,
    zIndex: 110,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  hero: { alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  titleAscend: { fontFamily: FONT.display, fontSize: 38, color: ASC.inkOn, letterSpacing: -0.5 },
  titlePro: { fontFamily: FONT.displaySemi, fontSize: 38, color: ASC.sky, letterSpacing: -0.5, marginLeft: 6 },
  subtitle: { fontFamily: FONT.sans, fontSize: 15, color: ASC.inkOn2, marginTop: 6, textAlign: 'center' },

  tileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tileTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: ASC.inkOn },
  tileDesc: { fontFamily: FONT.sans, fontSize: 12.5, color: ASC.inkOn2, marginTop: 2, lineHeight: 17 },

  loading: { paddingVertical: 18, alignItems: 'center' },
  unavailable: { fontFamily: FONT.sans, fontSize: 13, color: ASC.inkOn2, textAlign: 'center', paddingVertical: 12 },
  fine: { fontFamily: FONT.sans, fontSize: 11.5, color: 'rgba(244,248,255,0.5)', textAlign: 'center', marginTop: 14, lineHeight: 16 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 },
  link: { fontFamily: FONT.sansSemi, fontSize: 13, color: ASC.inkOn2 },
  linkDot: { color: 'rgba(244,248,255,0.4)' },
  giftLink: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: ASC.sky, textDecorationLine: 'underline' },
});
