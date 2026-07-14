# Throne Saga, scroll ile ilerleyen sinematik deneyim

Game of Thrones temalı, kaydırdıkça videonun kare kare ilerlediği bir hikaye anlatım sayfası.

**Canlı demo:** https://enesayd.in/got/

**Nasıl yapıldığının adım adım anlatımı:** https://enesayd.in/got/nasil-yapildi.html

Orijinal tasarım [divyashrma18/GOT](https://github.com/divyashrma18/GOT) reposundan alındı. Bu repo, o tasarımın performans için optimize edilmiş halidir.

## Teknik: scroll-scrub video nasıl çalışır

1. GSAP ScrollTrigger hero bölümünü ekrana sabitler (`pin: true`) ve 5 ekran boyu scroll alanı açar (`end: '+=500%'`).
2. Her scroll karesinde `progress` değeri (0 ile 1 arası) videonun süresiyle çarpılıp `video.currentTime` değerine yazılır. Video oynamaz, scroll videoyu ileri geri sarar.
3. Sahne metinleri progress aralıklarına bağlıdır, her aralıkta ilgili başlık GSAP timeline ile açılır.

## En kritik detay: video encode

Sıradan bir mp4'te keyframe birkaç saniyede bir gelir. `currentTime` ile gezinirken tarayıcı en yakın keyframe'den itibaren tüm kareleri çözmek zorunda kalır ve scroll fena kasar. Çözüm, videoyu sık keyframe ile yeniden encode etmek:

```bash
# Yerel gelistirme icin, her kare keyframe (buyuk dosya, en akici sonuc)
ffmpeg -i kaynak.mp4 -c:v libx264 -g 1 -crf 19 -preset fast -pix_fmt yuv420p -an -movflags +faststart public/video/one.mp4

# Web icin, 2 karede bir keyframe (daha kucuk dosya, hala akici)
ffmpeg -i kaynak.mp4 -c:v libx264 -g 2 -crf 22 -preset fast -pix_fmt yuv420p -an -movflags +faststart one-web.mp4
```

Video dosyaları GitHub'ın 100MB dosya limitini aştığı için bu repoda yok. Kaynak videoyu [orijinal repodan](https://github.com/divyashrma18/GOT/tree/main/vite-project/public/video) indirip yukarıdaki komutlarla encode edin ve `vite-project/public/video/one.mp4` olarak koyun.

## Kurulum

```bash
git clone https://github.com/Eneslexi/got-scroll-site.git
cd got-scroll-site/vite-project
npm install
# videoyu yukaridaki gibi hazirlayip public/video/one.mp4 olarak ekleyin
npm run dev
```

## Yapılan optimizasyonlar (orijinale göre)

- Video sık keyframe ile yeniden encode edildi, scroll kasması bitti
- `video.seeking` kontrolü eklendi, seek kuyrugu birikmesi engellendi
- Overlay gradient animasyonu yerine iki katmanlı opacity crossfade
- Progress bar `width` yerine `transform: scaleX()` ile animasyonlu (layout tetiklemez)
- `will-change` ipuçları eklendi
- `vite.config.js` içine `base: '/got/'` eklendi (alt dizinde yayın için)

## Deploy

```bash
npm run build
cp ../one-web.mp4 dist/video/one.mp4   # web videosu dist'e
rsync -az --delete dist/ sunucu:/var/www/site/got/
```
