/**
 * Web için no-op AdMob stub'ı.
 *
 * `react-native-google-mobile-ads` native-only bir modüldür (içeride
 * `codegenNativeComponent` gibi native-only RN modüllerini import eder). Metro
 * bunu web bundle'ına dahil etmeyi reddeder ve TÜM web derlemesi kırılır
 * (Chrome'da beyaz ekran).
 *
 * Metro, web platformunda `admob.web.ts`'i; iOS/Android'de ise `admob.ts`'i
 * otomatik seçer. Böylece web'de reklam SDK'sı hiç import edilmez, reklamlar
 * sessizce devre dışı kalır; mobilde reklamlar normal çalışır.
 */
export const AdsModule = null;
export const adsAvailable = false;
