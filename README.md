# AviCAD Türkiye — CAD satış / lead sitesi

AviCAD'in (DWG uyumlu, AutoCAD alternatifi profesyonel CAD yazılımı) **Türkiye distribütörü** için satış ve demo-talebi hunisi. Scroll-scrub sinematik hero + özellikler + AviCAD↔AutoCAD maliyet karşılaştırması + SSS + iletişim/demo formu + KVKK'lı footer.

Teknik altyapı, orijinal scroll-scrub şablonu [divyashrma18/GOT](https://github.com/divyashrma18/GOT) üzerine kuruludur.

## Bölümler (akış)

Hero (scroll-scrub video) → **Neden AviCAD?** (6 özellik kartı) → **Hakkımızda** → **AViCAD vs AutoCAD LT** (özellik karşılaştırma tablosu + tanıtım videosu) → **Kullanıcılar Ne Diyor?** (referanslar) → **İletişim** (form + demo indirme) → **SSS** → Footer (KVKK / Gizlilik).

> Fiyat sitede **yayınlanmıyor** — müşteriye telefonda veriliyor. Karşılaştırma bölümü eskiden interaktif bir maliyet grafiği içeriyordu, `4661da5`'te kaldırıldı.

## Yayına çıkmadan doldurulacaklar

Tümü tek yerde — `vite-project/src/`:

- **`siteConfig.js`** — `[YASAL ÜNVAN]` (ticaret sicilinde kayıtlı tam ünvan; marka adı değil). Telefon/WhatsApp/e-posta/adres ve demo indirme URL'si doludur, gerekirse güncellenir.
  - **VERBİS numarası aranmıyor** — şirket kayıt yükümlülüğünden istisna, gerekçe `siteConfig.js` içinde yazılı (`681a64d`).
  - **Fiyat sabiti aranmıyor** — fiyat sitede yayınlanmıyor (`4661da5`).
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

## Güvenlik — deploy'da yapılacaklar

`index.html`'de bir **CSP meta etiketi** var; `script-src`/`connect-src`/`frame-src` gibi kaynak direktiflerini host'tan bağımsız uyguluyor ve test edildi (`api.emailjs.com` geçiyor, başka her yer engelleniyor).

Ama bazı başlıklar **meta ile çalışmaz, sunucudan verilmek zorunda.** Bunlar verilmezse site clickjacking'e ve HTTP'ye düşürmeye açık kalır. Hosting seçilince aşağıdaki bloklardan uygunu kopyalanacak:

**Netlify / Cloudflare Pages** — `vite-project/public/_headers`:
```
/*
  X-Frame-Options: DENY
  Content-Security-Policy: frame-ancestors 'none'
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**cPanel / Apache** — `.htaccess`:
```apache
<IfModule mod_headers.c>
  Header always set X-Frame-Options "DENY"
  Header always set Content-Security-Policy "frame-ancestors 'none'"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
```

**Nginx** — `server { … }` içine:
```nginx
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

> Sunucudan verilen CSP, meta'dakini **ezmez** — ikisi birlikte uygulanır ve en kısıtlayıcısı kazanır. Bu yüzden yukarıdaki bloklarda yalnızca `frame-ancestors` var; kaynak direktifleri meta'da kalıyor.

Ayrıca:
- **HTTPS zorunlu**, HTTP → HTTPS yönlendirmesi açık olmalı (HSTS ancak öyle anlamlı).
- Deploy edilen dizinde `.git/`, `node_modules/`, `src/` **bulunmamalı** — yalnızca `dist/` içeriği yüklenir.
- **`npm audit`** deploy öncesi çalıştırılmalı (bağımlılık açığı taraması).
- **EmailJS anahtarları girilirken** `emailService.js`'in başındaki güvenlik maddeleri uygulanmalı: alan adı kısıtı, CAPTCHA, hız sınırı, kota uyarısı. Anahtarlar bundle'da açık yayınlandığı için bu ayarlar suistimalin tek engeli.

## Notlar

- `vite.config.js` → `base: '/got/'` (alt dizinde yayın için). Kök domainde yayınlanacaksa `'/'` yapın.
- **Fontlar kendi sunucumuzda barındırılıyor** — Google Fonts'a hiçbir istek atılmıyor. Sebep KVKK: `<link>` ile yüklendiğinde her sayfa açılışında Google'a 7 istek gidiyor ve ziyaretçinin IP'si onay olmadan oraya ulaşıyordu. Yerelde ayrıca daha hızlı (çapraz-origin CSS → woff2 zinciri kalkıyor).
  - `@font-face` tanımları `vite-project/src/index.css`, woff2 dosyaları `vite-project/src/assets/fonts/` (10 dosya, ~264 KB). `public/` değil `src/assets/` çünkü Vite oradaki `url()`'leri hash'leyip `base` değişse bile doğru yolu üretir.
  - Alınan yüzler: **IBM Plex Sans** değişken (tek dosya 400–700), normal + *italic*; **IBM Plex Mono** statik 400/600/700 (bu ailenin değişken sürümü yok). Altkümeler yalnızca `latin` + `latin-ext` — Türkçe karakterler latin-ext'te.
  - `unicode-range` değerleri Google Fonts CSS'inden birebir alınmıştır; **silmeyin**, yoksa tarayıcı tüm altkümeleri indirir.
  - Yeni ağırlık gerekirse: Google Fonts CSS'inden woff2 URL'sini `src/assets/fonts/` altına indirip `index.css`'e aynı biçimde `@font-face` ekleyin.
