import { Platform } from 'react-native';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  REKLAM YAPILANDIRMASI
 * ───────────────────────────────────────────────────────────────────────────
 *
 *  ŞU AN: Google'ın resmî TEST reklam birimleri kullanılıyor. Bunlar her zaman
 *  "Test Ad" etiketli reklam gösterir ve tıklanması güvenlidir.
 *
 *  YAYINA ÇIKMADAN ÖNCE YAPMANIZ GEREKENLER:
 *  1) https://admob.google.com adresinden ücretsiz AdMob hesabı açın.
 *  2) Bir "App" oluşturun (Android ve iOS için ayrı ayrı) → App ID'leri alın.
 *     Bu App ID'leri app.json içindeki "react-native-google-mobile-ads"
 *     eklentisine yazın (androidAppId / iosAppId).
 *  3) Her platform için Banner ve Interstitial reklam birimleri oluşturun →
 *     ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY biçimindeki kimlikleri aşağıdaki
 *     PROD_UNITS içine yapıştırın.
 *  4) USE_TEST_ADS değerini `__DEV__` yapın (aşağıda zaten öyle). Böylece
 *     geliştirmede test, mağaza build'inde gerçek reklamlar gösterilir.
 *
 *  ÖNEMLİ: Gerçek kimlikleri yazmadan yayınlarsanız reklam GÖSTERİLMEZ ama
 *  uygulama çökmez — güvenli şekilde test reklamlarına geri düşer.
 */

// Geliştirmede (Expo dev / simülatör) her zaman test reklamı göster.
// Mağaza (production) build'inde gerçek reklamlar gösterilir.
export const USE_TEST_ADS = __DEV__;

// Google'ın resmî test reklam birimi kimlikleri (değiştirmeyin)
const TEST_UNITS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  })!,
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  })!,
};

// 🔴 BURAYA AdMob panelinden aldığınız GERÇEK reklam birimi kimliklerini yazın.
const PROD_UNITS = {
  banner: Platform.select({
    ios: 'ca-app-pub-0000000000000000/0000000000', // TODO: iOS banner birimi
    android: 'ca-app-pub-0000000000000000/0000000000', // TODO: Android banner birimi
  })!,
  interstitial: Platform.select({
    ios: 'ca-app-pub-0000000000000000/0000000000', // TODO: iOS interstitial birimi
    android: 'ca-app-pub-0000000000000000/0000000000', // TODO: Android interstitial birimi
  })!,
};

// Gerçek kimlikler henüz doldurulmadıysa (placeholder), kazara geçersiz birim
// göstermemek için otomatik olarak test reklamlarına düş.
const prodLooksUnset = PROD_UNITS.banner.includes('0000000000000000');

export const adUnits = USE_TEST_ADS || prodLooksUnset ? TEST_UNITS : PROD_UNITS;

/** Tüm reklamları tek noktadan kapatmak için ana anahtar. */
export const ADS_ENABLED = true;

/**
 * Interstitial (tam ekran) reklam sıklık sınırları.
 * Dinî bir uygulama olduğu için agresif değil, ölçülü tutuldu.
 */
export const INTERSTITIAL_CONFIG = {
  // Bir interstitial göstermek için en az kaç ekran geçişi yapılmış olmalı.
  minNavigationsBetween: 5,
  // İki interstitial arasında geçmesi gereken en az süre (ms).
  minMillisBetween: 3 * 60 * 1000, // 3 dakika
};
