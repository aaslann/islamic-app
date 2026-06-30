import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AdsModule, adsAvailable } from '../../core/ads/admob';
import { ADS_ENABLED, adUnits } from '../../core/ads/adConfig';

type Props = {
  /** Banner çevresine ekstra boşluk/stil. */
  style?: ViewStyle;
};

/**
 * Uyarlanır (adaptive) banner reklam.
 *
 * Native SDK yoksa veya reklamlar kapalıysa hiçbir şey render etmez (null) —
 * böylece layout'ta boşluk bırakmaz ve Expo Go'da çökmez.
 *
 * NOT: Bu bileşeni Kur'an ayet okuma ekranı, namaz/kıble ve aktif zikir sayımı
 * gibi "kutsal içerik" ekranlarına KOYMAYIN. Yalnızca liste/araç ekranlarında
 * kullanın (Ana Sayfa, sure listesi, dualar, cami bulucu vb.).
 */
export function AdBanner({ style }: Props) {
  if (!ADS_ENABLED || !adsAvailable) return null;

  const mod = AdsModule!;
  const BannerAd = mod.BannerAd;
  const BannerAdSize = mod.BannerAdSize;
  if (!BannerAd || !BannerAdSize) return null;

  return (
    <View style={[styles.wrap, style]}>
      <BannerAd
        unitId={adUnits.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
