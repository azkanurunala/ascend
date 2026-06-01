// ============ SETTINGS ============
// Sound, Reduced motion, Haptics, Graphics quality, Delete save data (PRD §6).
// Ported from ascend-screens.jsx <SettingsScreen> (+ graphics quality per PRD).

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import { GhostButton } from '../components/Buttons';
import { ScreenHead } from './_ScreenHead';
import { Toggle } from '../components/Controls';
import { ASC, FONT } from '../theme';

function Row({ label, sub, value, onToggle, last }) {
  return (
    <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
        </View>
        <Toggle value={value} onChange={onToggle} />
      </View>
      {!last && <View style={styles.sep} />}
    </>
  );
}

export default function SettingsScreen({ settings, onToggle, onReset, onRestore, restoring, pro, onManage, storeAvailable, width, height, topInset, bottomInset }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <MenuScreen
      width={width}
      height={height}
      contentStyle={{ paddingTop: topInset + 30, paddingBottom: bottomInset + 120, paddingHorizontal: 22 }}
    >
      <ScreenHead eyebrow="NO ACCOUNT · OFFLINE" title="Settings" />

      <Glass tone="hi" pad={0} radius={22} style={{ marginBottom: 16 }} innerStyle={{ padding: 0 }}>
        <Row label="Sound" sub="Taps, chimes, ambience" value={settings.sound} onToggle={() => onToggle('sound')} />
        <Row label="Reduced motion" sub="Calmer trails and shake" value={settings.reduceMotion} onToggle={() => onToggle('reduceMotion')} />
        <Row label="Haptics" sub="Subtle taps on collision" value={settings.haptics} onToggle={() => onToggle('haptics')} />
        <Row label="Graphics quality" sub="Particles, stars and blur" value={settings.highQuality} onToggle={() => onToggle('highQuality')} last />
      </Glass>

      {/* Ascend Pro */}
      <Glass tone="hi" pad={16} radius={22} style={{ marginBottom: 16 }}>
        <View style={styles.proRow}>
          <Text style={styles.proTitle}>Ascend Pro</Text>
          <Text style={[styles.proState, { color: pro ? ASC.mint : ASC.ink3 }]}>
            {pro ? 'ACTIVE' : 'NOT ACTIVE'}
          </Text>
        </View>
        <Text style={styles.aboutBody}>
          {pro
            ? 'Thanks for your support — every orb skin is unlocked and revives are free.'
            : 'Unlock every orb skin and free revives with a one-time purchase.'}
        </Text>
        {storeAvailable && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <GhostButton
              label={restoring ? 'Restoring…' : 'Restore'}
              disabled={restoring}
              onPress={onRestore}
              style={{ flex: 1 }}
            />
            <GhostButton label="Manage purchases" onPress={onManage} style={{ flex: 1 }} />
          </View>
        )}
      </Glass>

      <Glass tone="reg" pad={16} radius={22} style={{ marginBottom: 16 }}>
        <Text style={styles.aboutTitle}>Ascend</Text>
        <Text style={styles.aboutBody}>
          One tap. No account. No internet. Climb through eight altitude bands, from the meadow to orbit.
          Your best stays on this device.
        </Text>
        <Text style={styles.version}>v1.0 · MVP</Text>
      </Glass>

      {!confirm ? (
        <GhostButton
          label="Delete save data"
          color={ASC.danger}
          style={{ borderColor: 'rgba(255,107,94,0.4)', backgroundColor: 'rgba(255,107,94,0.10)' }}
          onPress={() => setConfirm(true)}
        />
      ) : (
        <Glass tone="reg" pad={14} radius={18} innerStyle={{ borderColor: 'rgba(255,107,94,0.4)' }}>
          <Text style={styles.confirmText}>Erase best score, skins and stats?</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <GhostButton label="Keep" style={{ flex: 1 }} onPress={() => setConfirm(false)} />
            <GhostButton
              label="Erase"
              color="#fff"
              style={{ flex: 1, backgroundColor: ASC.danger, borderColor: ASC.danger }}
              onPress={() => {
                onReset();
                setConfirm(false);
              }}
            />
          </View>
        </Glass>
      )}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowLabel: { fontFamily: FONT.sansSemi, fontSize: 14.5, color: ASC.ink },
  rowSub: { fontFamily: FONT.sans, fontSize: 12, color: ASC.ink2, marginTop: 1 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 16 },

  proRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  proTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: ASC.ink },
  proState: { fontFamily: FONT.monoSemi, fontSize: 10.5, letterSpacing: 1 },

  aboutTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: ASC.ink, marginBottom: 4 },
  aboutBody: { fontFamily: FONT.sans, fontSize: 12.5, color: ASC.ink2, lineHeight: 19 },
  version: { fontFamily: FONT.mono, fontSize: 10.5, color: ASC.ink3, marginTop: 10, letterSpacing: 1 },

  confirmText: { fontFamily: FONT.sansSemi, fontSize: 13, color: ASC.ink, textAlign: 'center' },
});
