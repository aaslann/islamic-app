import { AdsModule, adsAvailable } from './admob';
import { ADS_ENABLED, INTERSTITIAL_CONFIG, adUnits } from './adConfig';

/**
 * Ölçülü interstitial (tam ekran) reklam yöneticisi.
 *
 * Kullanım: ekran geçişlerinde `maybeShowInterstitial()` çağrılır. Reklam yalnızca
 * hem yeterli sayıda geçiş yapıldıysa HEM DE son reklamdan beri yeterli süre
 * geçtiyse gösterilir. Böylece kullanıcı reklam bombardımanına tutulmaz.
 *
 * Dinî bir uygulama olduğu için kasıtlı olarak seyrek tutulmuştur.
 */

let navigationCount = 0;
let lastShownAt = 0;
let loadedAd: any = null;
let loading = false;

function preload() {
  if (!adsAvailable || loading || loadedAd) return;
  const mod = AdsModule!;
  const InterstitialAd = (mod as any).InterstitialAd;
  const AdEventType = (mod as any).AdEventType;
  if (!InterstitialAd || !AdEventType) return;

  loading = true;
  try {
    const ad = InterstitialAd.createForAdRequest(adUnits.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedAd = ad;
      loading = false;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedAd = null;
      unsubLoaded();
      unsubClosed();
      // Bir sonraki gösterim için önceden yükle.
      preload();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedAd = null;
      loading = false;
      unsubError();
    });

    ad.load();
  } catch {
    loading = false;
  }
}

/** Uygulama açılışında çağrılır — ilk reklamı arka planda hazırlar. */
export function primeInterstitial() {
  if (!ADS_ENABLED || !adsAvailable) return;
  preload();
}

/**
 * Bir ekran geçişinde çağrılır. Sıklık sınırları uygunsa interstitial gösterir.
 * @returns reklam gösterildiyse true.
 */
export function maybeShowInterstitial(): boolean {
  if (!ADS_ENABLED || !adsAvailable) return false;

  navigationCount += 1;
  if (navigationCount < INTERSTITIAL_CONFIG.minNavigationsBetween) {
    preload();
    return false;
  }

  // Date.now() runtime'da güvenli (yalnızca workflow script'lerinde kısıtlı).
  const now = Date.now();
  if (now - lastShownAt < INTERSTITIAL_CONFIG.minMillisBetween) {
    return false;
  }

  if (!loadedAd) {
    preload();
    return false;
  }

  try {
    loadedAd.show();
    lastShownAt = now;
    navigationCount = 0;
    loadedAd = null;
    return true;
  } catch {
    loadedAd = null;
    preload();
    return false;
  }
}
