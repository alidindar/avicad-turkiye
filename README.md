# AviCAD Türkiye — CAD satış / lead sitesi

AviCAD'in (DWG uyumlu, AutoCAD alternatifi profesyonel CAD yazılımı) **Türkiye distribütörü** için satış ve demo-talebi hunisi. Scroll-scrub sinematik hero + özellikler + AviCAD↔AutoCAD maliyet karşılaştırması + SSS + iletişim/demo formu + KVKK'lı footer.

Teknik altyapı, orijinal scroll-scrub şablonu [divyashrma18/GOT](https://github.com/divyashrma18/GOT) üzerine kuruludur.

## Bölümler (akış)

Hero (scroll-scrub video) → **Neden AviCAD?** (6 özellik kartı) → **AviCAD vs AutoCAD** (interaktif fiyat grafiği) → **SSS** → CTA bandı → **İletişim** (form + demo indirme) → Footer (KVKK / Gizlilik).

## Yayına çıkmadan doldurulacaklar

Tümü tek yerde — `vite-project/src/`:

- **`siteConfig.js`** — telefon/WhatsApp/e-posta/adres, demo indirme URL'si, karşılaştırma fiyatları (`AVICAD_YILLIK`/`AUTOCAD_YILLIK`/`PARA_BIRIMI`), KVKK için `[YASAL ÜNVAN]`/`[VERBİS NO]`.
- **`emailService.js`** — EmailJS `PUBLIC_KEY` / `SERVICE_ID` / `TEMPLATE_LEAD` / `TEMPLATE_REPLY` (form gönderimi + otomatik yanıt için).
- **KVKK/Gizlilik metinleri** taslaktır (`Footer.jsx`); yasal onay önerilir.

## Scroll-scrub video nasıl çalışır

1. GSAP ScrollTrigger hero'yu ekrana sabitler (`pin`) ve birkaç ekran boyu scroll alanı açar.
2. Her scroll karesinde `progress` (0–1) video süresiyle çarpılıp `video.currentTime`'a yazılır — video oynamaz, scroll onu ileri/geri sarar.
3. Bölüm metinleri progress aralıklarına bağlı olarak GSAP ile açılır.

### Kritik: video encode

`currentTime` ile gezinirken tarayıcı en yakın keyframe'den başlayıp kareleri çözer; seyrek keyframe'de scroll kasar. Sık keyframe ile yeniden encode şart:

```bash
# Masaustu: 720p, 2 karede bir keyframe (akici + makul boyut) — ~25MB
ffmpeg -i kaynak.mp4 -vf scale=1280:720 -c:v libx264 -g 2 -keyint_min 2 \
  -sc_threshold 0 -crf 22 -preset medium -pix_fmt yuv420p -an \
  -movflags +faststart public/video/one.mp4
```

**Mobil sürüm zorunlu.** Hero, `max-width: 768px` altında `one-mobile.mp4` yükler; dosya yoksa mobilde hero videosuz kalır. 25MB'lık masaüstü sürümü telefonda ilk kareyi 30 sn'de bile çözemiyordu — 480p/15fps sürüm ~5MB'a iniyor, keyframe yapısı aynı kaldığı için **scrub birebir çalışır**:

```bash
# Mobil: 480p / 15fps, keyframe yine 2 karede — ~5MB
ffmpeg -i public/video/one.mp4 -vf scale=854:480 -r 15 -c:v libx264 -g 2 \
  -keyint_min 2 -sc_threshold 0 -crf 29 -preset medium -pix_fmt yuv420p -an \
  -movflags +faststart public/video/one-mobile.mp4
```

`-g 2 -keyint_min 2 -sc_threshold 0` üçlüsü scrub'ın çalışma şartıdır; keyframe'i seyrekleştirmeyin.

Video dosyaları büyük olduğundan repoda tutulmaz (`.gitignore`). **Her iki dosyayı da** encode edip `vite-project/public/video/` altına koyun — yayına çıkarken sunucuya elle yüklenmeleri gerekir.

## Kurulum

```bash
cd vite-project
npm install
# public/video/one.mp4'ü yukarıdaki gibi hazırlayın
npm run dev   # http://localhost:5173/got/
```

## Notlar

- `vite.config.js` → `base: '/got/'` (alt dizinde yayın için). Kök domainde yayınlanacaksa `'/'` yapın.
- **Fontlar kendi sunucumuzda barındırılıyor** — Google Fonts'a hiçbir istek atılmıyor. Sebep KVKK: `<link>` ile yüklendiğinde her sayfa açılışında Google'a 7 istek gidiyor ve ziyaretçinin IP'si onay olmadan oraya ulaşıyordu. Yerelde ayrıca daha hızlı (çapraz-origin CSS → woff2 zinciri kalkıyor).
  - `@font-face` tanımları `vite-project/src/index.css`, woff2 dosyaları `vite-project/src/assets/fonts/` (10 dosya, ~264 KB). `public/` değil `src/assets/` çünkü Vite oradaki `url()`'leri hash'leyip `base` değişse bile doğru yolu üretir.
  - Alınan yüzler: **IBM Plex Sans** değişken (tek dosya 400–700), normal + *italic*; **IBM Plex Mono** statik 400/600/700 (bu ailenin değişken sürümü yok). Altkümeler yalnızca `latin` + `latin-ext` — Türkçe karakterler latin-ext'te.
  - `unicode-range` değerleri Google Fonts CSS'inden birebir alınmıştır; **silmeyin**, yoksa tarayıcı tüm altkümeleri indirir.
  - Yeni ağırlık gerekirse: Google Fonts CSS'inden woff2 URL'sini `src/assets/fonts/` altına indirip `index.css`'e aynı biçimde `@font-face` ekleyin.
