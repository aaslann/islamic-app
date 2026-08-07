# App Store Metadata — İslami Asistan

> Uygulama **reklamsız**dır. Reklam SDK'sı, reklam kimliği (AAID/IDFA) ve
> analitik/çökme raporlama aracı içermez. Aşağıdaki beyanlar buna göre yazılmıştır.

## Ortak Bilgiler

- **Gizlilik Politikası URL:** https://aaslann.github.io/islamic-app/
  (kaynak: `docs/index.html`, GitHub Pages — `main` dalı `/docs` klasörü)
- **İletişim / destek e-postası:** abdurrahman.aslan@roscatech.com
- **Web sitesi:** https://roscatech.com
- **Telefon:** +905527927962

---

## Google Play (Android)

### Uygulama adı (30 karakter)
```
İslami Asistan
```

### Kısa açıklama (80 karakter) — 75 karakter
```
Namaz vakitleri, Kur'an-ı Kerim, kıble, zikir ve Ramazan takibi. Reklamsız.
```

### Tam açıklama (4000 karakter) — 1909 karakter
```
İslami Asistan; namaz vakitlerinden Kur'an-ı Kerim okumaya, zikirden Ramazan takibine kadar günlük ibadetlerinizi tek uygulamada toplar. Reklam yok, üyelik yok, hesap açmanıza gerek yok — tamamen ücretsiz.

🕌 NAMAZ VAKİTLERİ
• Konumunuza göre otomatik hesaplanan vakitler
• Sonraki namaza kalan süre geri sayımı
• Namaz vakti bildirimleri
• Ezan sesi (iki farklı müezzin arasından seçim)
• Kıldığınız vakitleri işaretleyip günlük takip
• Adım adım namaz kılma rehberi

📖 KUR'AN-I KERİM
• 114 sure, 6236 ayet
• Arapça metin ve Diyanet Türkçe meali
• Elmalılı Hamdi Yazır — Hak Dini Kur'an Dili tefsiri
• Mishary Rashid Alafasy ile sesli okuma
• Ayet favorileme, not alma ve hızlı arama
• Hatim takibi

🧭 KIBLE
• Gerçek zamanlı pusula ile kıble yönü
• Mekke'ye olan uzaklık

📿 ZİKİR SAYACI
• Özelleştirilebilir zikir hedefleri
• Oturum ve ilerleme istatistikleri

🌙 RAMAZAN
• İmsak ve iftar saatleri
• Oruç, teravih ve Kur'an okuma takibi
• 30 günlük Ramazan takvimi

📊 İLERLEME VE ANALİZ
• Günlük ve haftalık namaz istatistikleri
• Seri takibi ve ısı haritası görünümü
• Günlük ibadet hedefleri belirleme

📚 DİNİ İÇERİK
• Esmaü'l-Hüsnâ — Allah'ın 99 ismi, anlam ve açıklamalarıyla
• İmam Nevevî'nin Kırk Hadis derlemesi
• Sabah, akşam ve günlük hayat duaları (Arapça metin + Türkçe anlam)
• Risale-i Nur'dan seçmeler
• Hicri takvim; kandiller ve mübarek günler

🕌 CAMİ BULUCU
• Bulunduğunuz yerin 5 km çevresindeki camiler
• Tek dokunuşla haritada açma

🤍 İYİLİK DEFTERİ
• Günlük sadaka ve iyiliklerinizi kaydedin

🔒 GİZLİLİK
Uygulama reklam içermez ve sizi takip etmez. Namaz günlükleriniz, zikir sayaçlarınız, notlarınız ve favorileriniz yalnızca cihazınızda saklanır; sunucularımıza gönderilmez. Konumunuz sadece namaz vakti, kıble ve cami bulucu özelliklerini çalıştırmak için kullanılır ve kaydedilmez.

Gizlilik politikası: https://aaslann.github.io/islamic-app/
İletişim: abdurrahman.aslan@roscatech.com
```

### Kategori
Yaşam Tarzı (Lifestyle)

### Etiketler / anahtar kelimeler
namaz, kıble, Kur'an, zikir, Ramazan, dua, ibadet, ezan, hadis, esmaül hüsna

### "Uygulamanız reklam içeriyor mu?"
**HAYIR** — reklam SDK'sı bulunmuyor (`0d1bffc Remove all ad code — ship ad-free`).

---

## Google Play — Veri güvenliği (Data safety) formu

| Soru | Cevap |
|---|---|
| Veri topluyor/paylaşıyor musunuz? | Evet — yalnızca **konum** paylaşılıyor |
| Konum → Yaklaşık/Kesin konum | **Paylaşılır** (toplanmaz/saklanmaz). Amaç: *Uygulama işlevselliği*. Üçüncü taraf API'lere anlık istek olarak gönderilir. |
| Kullanıcı isteğe bağlı mı? | Evet — izin verilmezse yalnızca namaz/kıble/cami özellikleri devre dışı kalır |
| Reklam kimliği (AAID) | Hayır |
| Kişisel bilgi (ad, e-posta), ödeme, kişiler, fotoğraf, mesaj | Hayır |
| Uygulama etkinliği / analitik | Hayır |
| Veriler aktarım sırasında şifreleniyor mu? | Evet (tüm istekler HTTPS) |
| Kullanıcı veri silme talep edebilir mi? | Sunucuda veri tutulmuyor; uygulamayı kaldırmak veya uygulama verilerini temizlemek yeterli |

Not: Namaz günlüğü, zikir sayacı, hatim, notlar ve favoriler **cihazdan çıkmaz**;
Play'in tanımına göre "toplanan veri" sayılmaz.

---

## Kullanılan üçüncü taraf servisler (gizlilik politikasıyla birebir aynı olmalı)

| Servis | Amaç | Gönderilen veri |
|---|---|---|
| AlAdhan API (aladhan.com) | Namaz vakitleri | Enlem/boylam, IP |
| AlQuran Cloud (alquran.cloud) | Kur'an metni ve Diyanet meali | Yok |
| Islamic Network CDN (islamic.network) | Kur'an ses dosyaları (ar.alafasy) | Yok |
| Overpass API / OpenStreetMap | Yakındaki camiler | Enlem/boylam |
| Wikimedia Commons (upload.wikimedia.org) | Ezan sesi kayıtları | Yok |

Ezan kayıtları: *Sabah Fakhry* (Kamu Malı) ve *Aaqib Azeez* (CC BY-SA 4.0).
Dosyalar doğrudan Wikimedia'dan akışla çalınır, uygulamaya gömülmez veya yeniden dağıtılmaz.

---

## App Store Connect (iOS)

### Uygulama adı
İslami Asistan - Namaz & Kur'an

### Alt başlık (30 karakter)
Namaz, Kur'an, Zikir, Ramazan

### Açıklama
Google Play "Tam açıklama" metniyle aynı.

### Anahtar kelimeler (100 karakter)
namaz,kıble,kur'an,zikir,ramazan,dua,ibadet,müslüman,ezan,hadis

### Kategori
Birincil: Yaşam Tarzı · İkincil: Eğitim

### Yaş sınırı
4+ (Play tarafında konum kullanımı nedeniyle hedef kitle 13+)

### App Privacy (Nutrition Label)
- **Location → Coarse/Precise Location** → *Not Linked to You*, *Not Used for Tracking*.
  Amaç: **App Functionality**
- Başka hiçbir veri kategorisi işaretlenmez
- App Tracking Transparency (ATT) izni **istenmez** — IDFA kullanılmıyor

---

## Sürüm Notları (v1.0.0)

### TR
```
İslami Asistan'a hoş geldiniz! İlk sürümde:
• Konum bazlı namaz vakitleri, bildirim ve ezan sesi
• Kur'an-ı Kerim: meal, Elmalılı tefsiri ve sesli okuma
• Kıble pusulası ve cami bulucu
• Zikir sayacı, hatim ve Ramazan takibi
• Esmaü'l-Hüsnâ, Kırk Hadis, dualar ve Risale-i Nur seçmeleri
• Reklamsız ve tamamen ücretsiz
```

### EN
```
Welcome to Islamic Assistant! In this first release:
• Location-based prayer times with notifications and adhan audio
• Quran with Turkish translation, tafsir and audio recitation
• Qibla compass and nearby mosque finder
• Dhikr counter, khatm and Ramadan tracking
• 99 Names of Allah, Forty Hadith, daily duas
• Ad-free and completely free
```
