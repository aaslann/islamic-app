import { Platform } from 'react-native';
import { AdsModule, adsAvailable } from './admob';
import { ADS_ENABLED } from './adConfig';

let initialized = false;

/**
 * Reklam SDK'sını başlatır. Şunları yapar:
 *  1) GDPR/UMP rıza akışını çalıştırır (Avrupa kullanıcıları için zorunlu).
 *  2) iOS'ta App Tracking Transparency (ATT) iznini ister.
 *  3) İçerik derecesini "G" (herkese uygun) olarak ayarlar — dinî uygulamaya uygun.
 *  4) Mobile Ads SDK'sını initialize eder.
 *
 * Native modül yoksa veya reklamlar kapalıysa sessizce çıkar (no-op).
 * Tek seferlik çalışır; tekrar çağrılırsa hiçbir şey yapmaz.
 */
export async function initAds(): Promise<void> {
  if (!ADS_ENABLED || !adsAvailable || initialized) return;
  initialized = true;

  try {
    const mod = AdsModule!;
    const mobileAds = mod.default;
    const { MaxAdContentRating, AdsConsent } = mod as any;

    // 1) GDPR / UMP rıza akışı — Avrupa Ekonomik Alanı kullanıcıları için gerekli.
    try {
      if (AdsConsent?.gatherConsent) {
        await AdsConsent.gatherConsent();
      } else if (AdsConsent?.requestInfoUpdate) {
        const info = await AdsConsent.requestInfoUpdate();
        if (info?.isConsentFormAvailable && AdsConsent.showForm) {
          await AdsConsent.showForm();
        }
      }
    } catch {
      // Rıza akışı başarısız olsa bile reklamları (kişiselleştirilmemiş) göstermeye devam et.
    }

    // 2) iOS App Tracking Transparency izni.
    if (Platform.OS === 'ios') {
      try {
        const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
        await requestTrackingPermissionsAsync();
      } catch {
        // ATT modülü yoksa veya kullanıcı reddederse devam et.
      }
    }

    // 3) İçerik derecesi: yalnızca herkese uygun (G) reklamlar.
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating?.G ?? 'G',
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
    } catch {
      // Yapılandırma başarısız olursa varsayılanlarla devam et.
    }

    // 4) SDK'yı başlat.
    await mobileAds().initialize();
  } catch {
    // Reklam başlatma asla uygulamayı çökertmemeli.
  }
}
