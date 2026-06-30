/**
 * Güvenli AdMob modül yükleyici.
 *
 * `react-native-google-mobile-ads` bir NATIVE modüldür. Expo Go'da veya henüz
 * yeniden derlenmemiş bir dev-client'ta yüklü olmayabilir. Bu durumda doğrudan
 * `import` etmek uygulamayı çökertir. Bu yüzden modülü try/catch ile yüklüyoruz;
 * bulunamazsa reklam bileşenleri sessizce hiçbir şey göstermez (no-op).
 *
 * Böylece reklam SDK'sı native build'e girmeden de uygulama normal çalışır.
 */
let mod: typeof import('react-native-google-mobile-ads') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('react-native-google-mobile-ads');
} catch {
  mod = null;
}

export const AdsModule = mod;

/** Native SDK gerçekten yüklü ve kullanılabilir mi? */
export const adsAvailable = mod != null && typeof mod.default === 'function';
