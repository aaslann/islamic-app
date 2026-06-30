# 📊 İslami Asistan — Reklam Entegrasyonu & Yayın Raporu

**Tarih:** 30 Haziran 2026
**Durum:** Reklam altyapısı entegre edildi (test reklamlarıyla çalışır durumda). Yayın için aşağıdaki eksikler tamamlanmalı.

---

## 1. Özet — Ne Yapıldı?

Uygulamanı analiz ettim. **Çok kapsamlı, kaliteli ve neredeyse yayına hazır** bir İslami uygulama:
namaz vakitleri, tam Kur'an (ses dahil), kıble, zikir, 99 esmâ, 40 hadis, Risale-i Nur, Elmalılı
tefsiri, Ramazan/hatim/namaz takibi, cami bulucu, İslami takvim ve daha fazlası. Mimari temiz
(feature-based), TypeScript kullanıyor, koyu tema ve özel font ile profesyonel görünüyor.

Reklam gelirini başlatmak için **Google AdMob** entegrasyonunu kurdum:

- `react-native-google-mobile-ads` + `expo-tracking-transparency` kuruldu.
- Tekrar kullanılabilir, **çökmeye dayanıklı** bir reklam altyapısı oluşturuldu (`src/core/ads/`).
- Banner reklamlar **dinî açıdan uygun** ekranlara yerleştirildi (Kur'an okuma, kıble, namaz ekranlarına KONULMADI).
- Ölçülü (seyrek) bir interstitial (tam ekran) reklam akışı eklendi.
- GDPR/UMP rıza akışı ve iOS ATT izni eklendi.
- Gizlilik politikası, store metadata ve yayın kılavuzu reklamlara göre güncellendi.

> ⚠️ Şu an **test reklamları** gösteriliyor (gerçek para kazanmaz, güvenli). Gerçek gelir için
> AdMob hesabı açıp kendi reklam kimliklerini girmen gerekiyor (bkz. Bölüm 5).

---

## 2. Reklam Yerleşim Haritası

Dinî bir uygulamada reklam yerleşimi **hassas bir konu**. Hem AdMob politikası hem de kullanıcı
saygısı açısından şu prensibi uyguladım: **kutsal içeriğin okunduğu/ibadetin yapıldığı ekranlara
reklam koyma; yalnızca liste ve araç ekranlarına koy.**

### ✅ Reklam KONULAN ekranlar (banner)
| Ekran | Yerleşim | Neden uygun |
|-------|----------|-------------|
| Ana Sayfa | Sayfanın en altı (kaydırma sonu) | En çok görüntülenen ekran, içeriği bölmez |
| Kur'an Sure Listesi | Liste alt bilgisi (footer) | Navigasyon ekranı, ayet okuma değil |
| Günlük Dualar | Sayfa sonu | Liste/araç ekranı |
| Cami Bulucu | Sayfa sonu | Yardımcı araç ekranı |
| 40 Hadis Listesi | Liste footer | Navigasyon ekranı |
| Esmâ-ül Hüsnâ Listesi | Liste footer | Navigasyon ekranı |

### 🚫 Reklam KONULMAYAN ekranlar (bilinçli tercih)
- **Kur'an ayet okuma ekranı** (QuranSurahDetail) — ayetlerin yanında reklam göstermek hem politika
  riski hem de kullanıcıyı rahatsız eder.
- **Elmalılı Tefsiri, Favori Ayetler** — kutsal metin okuma.
- **Kıble pusulası** — ibadet anı, tam ekran odak gerekir.
- **Zikir Sayacı (aktif sayım)** — ibadet anı.
- **Namaz Kılavuzu / Login / Onboarding** — ilk izlenim ve rehber ekranları.

### Interstitial (tam ekran) reklam
Ana sayfadan bir bölüme geçerken **seyrek** olarak gösterilir. Sıklık sınırları (`adConfig.ts`):
- En az **5 ekran geçişi** yapılmış olmalı,
- İki reklam arasında en az **3 dakika** geçmeli,
- Kutsal ekranlardan (Kur'an, kıble, tefsir) önce **asla** gösterilmez.

Bu ayarları `src/core/ads/adConfig.ts` → `INTERSTITIAL_CONFIG` ile kolayca değiştirebilirsin.

---

## 3. Eklenen / Değiştirilen Dosyalar

**Yeni reklam altyapısı:**
- `src/core/ads/admob.ts` — native modülü güvenli yükleyici (yoksa no-op, çökmez)
- `src/core/ads/adConfig.ts` — reklam birimi kimlikleri + test/prod anahtarı + sıklık ayarı
- `src/core/ads/initAds.ts` — SDK başlatma + GDPR rıza + iOS ATT + içerik derecesi (G)
- `src/core/ads/interstitial.ts` — sıklık sınırlı tam ekran reklam yöneticisi
- `src/shared/components/AdBanner.tsx` — tekrar kullanılabilir banner bileşeni

**Değiştirilen dosyalar:**
- `App.tsx` — açılışta `initAds()` çağrısı
- `HomeScreen.tsx`, `QuranSurahListScreen.tsx`, `DuasScreen.tsx`, `MosqueFinderScreen.tsx`,
  `HadithListScreen.tsx`, `EsmaulHusnaListScreen.tsx` — banner yerleşimi
- `app.json` — AdMob config plugin (test App ID'leri + ATT açıklaması)
- `store/privacy-policy.html` — reklam/veri bölümü eklendi, "reklam toplamıyoruz" ifadesi kaldırıldı
- `store/app-store-metadata.md` — Veri Güvenliği / App Privacy beyanları eklendi
- `store/YAYINLAMA-KILAVUZU.md` — AdMob kurulum adımları eklendi

---

## 4. 🔴 KRİTİK EKSİKLER (yayından önce mutlaka)

### 4.1. Sahte Giriş Ekranı — ✅ ÇÖZÜLDÜ
`LoginScreen.tsx` içindeki işlevsiz **Google / Apple / Misafir** butonları (hepsi doğrulama
yapmadan giriyordu — Apple Guideline 2.3 red riski) kaldırıldı. Yerine tek bir temiz **"Başla"**
butonu ve "Hesap gerekmez · Verileriniz yalnızca cihazınızda saklanır" güven notu kondu. Uygulama
zaten tüm veriyi cihazda tuttuğu için hesaba gerek yok; bu hem red riskini ortadan kaldırır hem de
gizlilik hikâyesini güçlendirir.

### 4.2. Gizlilik Politikasını İnternette Yayınla
`store/privacy-policy.html` güncel ama bir URL'de **yayınlanmış** olmalı. Metadata'da
`https://aaslann.github.io/islami-asistan/` yazıyor — bu adresin gerçekten yayında olduğunu doğrula
(GitHub Pages ücretsiz). Hem Apple hem Google bu URL'yi zorunlu tutar.

### 4.3. Veri Güvenliği Beyanlarını Güncelle
Reklam eklendiği için **her iki mağazada da** veri toplama formu güncellenmeli (ayrıntılar
`store/app-store-metadata.md` içinde):
- Google Play → "Reklam içerir: **Evet**" + Reklam kimliği (AAID) beyanı
- Apple → IDFA / "Used for Tracking" + ATT izni beyanı

Yanlış beyan = inceleme reddi veya sonradan askıya alma.

### 4.4. Gerçek AdMob Kimlikleri (gelir için)
Şu an test reklamı var, **gerçek para kazanmıyor**. Bölüm 5'teki adımları tamamla.

---

## 5. 💰 Gerçek Reklam Gelirini Açma Adımları

1. [admob.google.com](https://admob.google.com) → ücretsiz hesap aç.
2. **Android** ve **iOS** için ayrı uygulama oluştur → 2 adet **App ID** al
   (`ca-app-pub-XXXX~YYYY`).
3. Bu App ID'leri `app.json` içindeki `react-native-google-mobile-ads` eklentisine yaz
   (`androidAppId`, `iosAppId` — şu an test ID'ler duruyor).
4. Her platform için **Banner** ve **Interstitial** birimleri oluştur → 4 kimliği
   `src/core/ads/adConfig.ts` → `PROD_UNITS` içine yapıştır.
5. AdMob'da ödeme/vergi bilgilerini ve `app-ads.txt` doğrulamasını tamamla (ödeme eşiği $100).
6. Kod değiştiği için **yeni bir `eas build` al** (reklam SDK'sı native, OTA update yetmez).
7. **Kendi reklamına asla tıklama** — AdMob hesabını kapatır. Test cihazını panelden "test device"
   olarak ekle.

---

## 6. Diğer Eksikler & İyileştirme Önerileri

### Yayın için gerekli (reklamla ilgisiz)
- [ ] **Ekran görüntüleri**: App Store (6.5") ve Play Store için min. 2-8 adet. `design-preview/`
      klasöründe hazır şablonlar var.
- [ ] **Mağaza ikonu / feature graphic**: Play için 1024×500 feature graphic gerekiyor.
- [ ] **eas.json submit bilgileri**: `appleId`, `ascAppId`, `appleTeamId` hâlâ `YOUR_...`
      placeholder. Doldur.
- [ ] **Destek e-postası**: Gizlilik politikasında `destek@islamiasistan.app` yazıyor ama bu
      adresin gerçekten çalıştığından emin ol (Apple test eder).
- [ ] **`google-services.json`**: Android push bildirimleri için gerekiyorsa Firebase'den indir.

### Sağlamlık / kalite (önerilir)
- **Çevrimdışı namaz vakitleri**: ✅ ÇÖZÜLDÜ — Namaz vakitleri artık başarılı her çekimde cihazda
  önbelleğe alınıyor; internet yoksa son kaydedilen vakitler "📴 Çevrimdışı gösterim · son
  güncelleme ..." banner'ı ile gösteriliyor. Eski güne aitse ayrıca "güncel olmayabilir" uyarısı
  çıkar. İzin reddinde ise (bağlantı sorunu değil) eylemli izin mesajı korunur.
- **Kur'an çevrimdışı**: Hâlâ tamamen internete bağlı (api.alquran.cloud). İstenirse sık okunan
  surelerin de aynı şekilde cache'lenmesi eklenebilir.
- **API bağımlılığı riski**: Ücretsiz halka açık API'ler (aladhan, alquran.cloud, Overpass) ani
  kapanabilir veya hız sınırı koyabilir. Kritik içerik (en azından namaz vakti hesabı) için yerel
  bir hesaplama kütüphanesi (`adhan` npm paketi) yedek olarak düşünülebilir.
- **"Reklamsız" satın alma (opsiyonel gelir modeli)**: İleride tek seferlik küçük bir ücretle
  reklamları kaldırma seçeneği (in-app purchase) ekleyebilirsin — dindar kullanıcı kitlesi bunu
  sıklıkla tercih eder ve banner gelirinden daha yüksek olabilir.

---

## 7. Gelir Beklentisi (Gerçekçi)

Banner + ölçülü interstitial ile, dinî/yaşam tarzı kategorisinde Türkiye trafiği için kaba tahmin:

| Günlük Aktif Kullanıcı | Aylık tahmini gelir (kaba) |
|------------------------|----------------------------|
| 1.000 | ~$30 – $80 |
| 10.000 | ~$300 – $800 |
| 50.000 | ~$1.500 – $4.000 |

> Rakamlar eCPM'e, ülkeye ve interstitial sıklığına göre çok değişir. Ramazan'da İslami uygulama
> trafiği 2-4 kat artar — lansman için ideal dönem Ramazan öncesidir.

---

## 8. Önerilen Yayın Yol Haritası (sıralı)

1. **Sahte login'i düzelt** (Bölüm 4.1) — en kritik red sebebi.
2. AdMob hesabı aç, gerçek kimlikleri gir (Bölüm 5).
3. Gizlilik politikasını URL'de yayınla, çalıştığını doğrula.
4. `eas.json` submit bilgilerini ve veri güvenliği beyanlarını doldur.
5. Ekran görüntüleri + feature graphic hazırla.
6. `eas build --profile production --platform all` → test (TestFlight + Play Internal).
7. Veri güvenliği formlarını mağazalarda doldur.
8. Önce **iç test → kapalı test → üretim** sırasıyla yayınla.

---

*Bu rapor `store/REKLAM-VE-YAYIN-RAPORU.md` olarak kaydedildi.*
