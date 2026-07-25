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
# Web icin, 2 karede bir keyframe (akici + makul boyut)
ffmpeg -i kaynak.mp4 -c:v libx264 -g 2 -crf 22 -preset medium \
  -pix_fmt yuv420p -an -movflags +faststart public/video/one.mp4
```

Video dosyaları büyük olduğundan repoda tutulmaz; encode edip `vite-project/public/video/one.mp4` olarak koyun.

## Kurulum

```bash
cd vite-project
npm install
# public/video/one.mp4'ü yukarıdaki gibi hazırlayın
npm run dev   # http://localhost:5173/got/
```

## Notlar

- `vite.config.js` → `base: '/got/'` (alt dizinde yayın için). Kök domainde yayınlanacaksa `'/'` yapın.
- Fontlar: IBM Plex Sans + IBM Plex Mono (Google Fonts, CSS `@import`).
