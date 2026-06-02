// ============ COSMETICS / SKINS ============
// Orb skins (306 total): preview + a virtualized grid so the full set scrolls
// smoothly. Pro unlocks everything; locked skins open the paywall.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import MenuScreen from '../components/MenuScreen';
import Glass from '../components/Glass';
import Orb from '../components/Orb';
import Float from '../components/Float';
import { PrimaryButton } from '../components/Buttons';
import { ScreenHead } from './_ScreenHead';
import { IconCheck, IconLock } from '../components/Icons';
import { ASC, FONT, ASC_SKINS, skinById } from '../theme';

export default function CosmeticsScreen({ owned, equipped, onEquip, onUnlock, pro, proPrice, unlocking, animate, width, height, topInset, bottomInset }) {
  const [sel, setSel] = useState(equipped);
  const skin = skinById(sel);
  const isOwned = owned.includes(skin.id);
  const isEquipped = equipped === skin.id;
  const unlockLabel = unlocking ? 'Opening…' : proPrice ? `Unlock Ascend Pro · ${proPrice}` : 'Unlock Ascend Pro';

  const header = (
    <>
      <ScreenHead eyebrow="COSMETIC · NO EDGE" title="Skins" />

      {/* preview */}
      <View style={{ paddingHorizontal: 18, marginBottom: 16 }}>
        <Glass tone="hi" pad={22} radius={26} innerStyle={{ alignItems: 'center' }}>
          <Float enabled={animate} distance={8} duration={3000} style={{ marginVertical: 8 }}>
            <Orb skin={skin} size={96} />
          </Float>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{skin.name}</Text>
            <Text style={styles.tag}>{skin.tag.toUpperCase()}</Text>
          </View>
          <View style={{ marginTop: 16, width: '100%' }}>
            {isEquipped ? (
              <View style={styles.equipped}>
                <IconCheck size={16} color={ASC.mint} />
                <Text style={styles.equippedText}>Equipped</Text>
              </View>
            ) : isOwned ? (
              <PrimaryButton size="sm" label="Equip" onPress={() => onEquip(skin.id)} />
            ) : (
              <PrimaryButton size="sm" label={unlockLabel} disabled={!!unlocking} onPress={() => onUnlock(skin.id)} />
            )}
          </View>
        </Glass>
      </View>

      <Text style={styles.gridLabel}>{`ALL SKINS · ${ASC_SKINS.length}`}</Text>
    </>
  );

  const renderItem = ({ item: s }) => {
    const own = owned.includes(s.id);
    const eq = equipped === s.id;
    const on = sel === s.id;
    return (
      <Pressable onPress={() => setSel(s.id)} style={[styles.cell, on && styles.cellOn]}>
        <Orb skin={s} size={42} />
        <Text style={styles.cellName} numberOfLines={1}>{s.name}</Text>
        <Text style={[styles.cellState, { color: eq ? ASC.mint : own ? ASC.ink3 : ASC.violet }]}>
          {eq ? 'EQUIPPED' : own ? 'OWNED' : 'PRO'}
        </Text>
        {!own && (
          <View style={styles.lock}>
            <IconLock size={11} color={ASC.ink3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <MenuScreen width={width} height={height} scroll={false}>
      <FlatList
        data={ASC_SKINS}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        numColumns={3}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.rowWrap}
        contentContainerStyle={{ paddingTop: topInset + 30, paddingBottom: bottomInset + 120 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: FONT.display, fontSize: 22, color: ASC.ink },
  tag: {
    fontFamily: FONT.mono,
    fontSize: 9.5,
    color: ASC.ink2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  equipped: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  equippedText: { fontFamily: FONT.sansBold, fontSize: 14, color: ASC.mint },

  gridLabel: { fontFamily: FONT.monoSemi, fontSize: 10, letterSpacing: 1.2, color: ASC.ink3, paddingHorizontal: 20, marginBottom: 10 },
  rowWrap: { gap: 10, paddingHorizontal: 18, marginBottom: 10 },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.44)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cellOn: { backgroundColor: 'rgba(255,255,255,0.66)', borderColor: 'rgba(90,169,242,0.7)' },
  cellName: { fontFamily: FONT.sansSemi, fontSize: 12, color: ASC.ink },
  cellState: { fontFamily: FONT.monoSemi, fontSize: 9.5 },
  lock: { position: 'absolute', top: 9, right: 9 },
});
