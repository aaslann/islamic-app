# İslami Asistan — Yayınlama Kılavuzu

## Ön Hazırlık (1 kez yapılır)

### 1. Hesaplar
- [ ] [Apple Developer](https://developer.apple.com) üyeliği — $99/yıl
- [ ] [Google Play Console](https://play.google.com/console) — $25 tek seferlik
- [ ] [Expo](https://expo.dev) ücretsiz hesap + `eas-cli` kurulumu
- [ ] [Google AdMob](https://admob.google.com) ücretsiz hesap (reklam geliri için)

```bash
npm install -g eas-cli
eas login
```

---

## 💰 Reklam (AdMob) Kurulumu — gelir için zorunlu

Reklam altyapısı koda entegre edildi (`src/core/ads/`). Şu an **Google'ın TEST
reklamları** gösteriliyor (güvenli). Gerçek gelir için kendi kimliklerinizi girin:

1. [admob.google.com](https://admob.google.com) → hesap aç.
2. **2 ayrı uygulama** oluştur (Android + iOS). Her biri sana bir **App ID** verir
   (`ca-app-pub-XXXX~YYYY`). Bu ikisini `app.json` → `react-native-google-mobile-ads`
   eklentisindeki `androidAppId` / `iosAppId` alanlarına yaz (şu an test ID'ler var).
3. Her uygulama için **Banner** ve **Interstitial** reklam birimleri oluştur
   (`ca-app-pub-XXXX/ZZZZ`). Bu 4 kimliği `src/core/ads/adConfig.ts` → `PROD_UNITS`
   içine yaz.
4. AdMob panelinde **app-ads.txt** doğrulaması ve **ödeme/vergi bilgileri** (ödeme
   eşiği $100) tamamla.
5. Gerçek kimlikleri yazınca `adConfig.ts` otomatik olarak production build'de gerçek
   reklamlara, geliştirmede test reklamlarına geçer. **Kendi reklamlarına tıklama!**
   (hesap kapatılır — test cihazını AdMob panelinden "test device" olarak ekle.)
6. Reklam SDK'sı native modül olduğu için kod değişikliğinden sonra **mutlaka yeniden
   `eas build`** alınmalı (OTA update yetmez).

### 2. app.json'ı güncelle
```json
"owner": "EXPO_KULLANICI_ADIN",
"extra": { "eas": { "projectId": "eas init komutu ile alınır" } }
```

```bash
eas init   # projectId'yi app.json'a yazar
```

### 3. google-services.json
Android bildirimleri için Firebase Console'dan indir → proje köküne koy.
iOS'ta bu adım atlanabilir (APNs kullanır).

---

## iOS — TestFlight → App Store

### Adım 1: Build al
```bash
# Simulator testi için
eas build --platform ios --profile development

# TestFlight için
eas build --platform ios --profile preview

# App Store için
eas build --platform ios --profile production
```

İlk `production` build sırasında EAS sertifikayı otomatik oluşturur.

### Adım 2: App Store Connect'te uygulama oluştur
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → "Yeni Uygulama"
2. Bundle ID: `com.islamiasistan.app`
3. `store/app-store-metadata.md` içeriğini doldur

### Adım 3: TestFlight'a yükle
```bash
eas submit --platform ios --profile production
# veya build tamamlandıktan sonra EAS Dashboard'dan "Submit" tıkla
```

### Adım 4: App Store incelemesi
- TestFlight review: 1-2 gün
- App Store review: 1-3 gün
- Gizlilik Politikası URL: `store/privacy-policy.html` dosyasını bir yere host et (GitHub Pages, Netlify ücretsiz)

---

## Android — Google Play

### Adım 1: Build al
```bash
eas build --platform android --profile production
# .aab dosyası oluşturur
```

### Adım 2: Play Console'da uygulama oluştur
1. [play.google.com/console](https://play.google.com/console) → "Uygulama Oluştur"
2. Package: `com.islamiasistan.app`
3. `store/app-store-metadata.md` içeriğini doldur

### Adım 3: İç Test'e yükle
```bash
eas submit --platform android --profile production
# veya .aab dosyasını manuel yükle
```

### Adım 4: Üretim yayınına geç
İç Test → Kapalı Test → Açık Test → Üretim
Her aşama 1-2 gün sürer.

---

## Ekran Görüntüleri

App Store için:
- iPhone 6.5" (1242×2688): `design-preview/appstore.html` dosyasındaki 6 ekran
- Simulator'da screenshots al veya browser'da print as PDF → kırp

Gerekli boyutlar:
| Platform | Boyut |
|----------|-------|
| iOS 6.5" | 1242×2688 |
| iOS 5.5" | 1242×2208 |
| Android Phone | 1080×1920 min |
| Android Tablet 7" | 1200×1920 |

---

## Güncellemeler

Yeni versiyon için:
1. `app.json` → `version` artır (örn. "1.0.1")
2. `eas build` → `eas submit`

EAS `autoIncrement: true` sayesinde `buildNumber`/`versionCode` otomatik artar.

---

## Hızlı Komut Referansı

```bash
# Geliştirme
npx expo start

# iOS Simulator build
eas build --platform ios --profile development --local

# Production build (her iki platform)
eas build --platform all --profile production

# Submit (her iki platform)
eas submit --platform all --profile production

# OTA güncelleme (build gerektirmez)
eas update --branch production --message "Bug fix"
```
