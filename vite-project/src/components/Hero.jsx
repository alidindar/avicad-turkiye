import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

// ─── Tunables ────────────────────────────────────────────────────────────────
// Scroll mesafesi = SCROLL_VIEWPORTS × pencere yuksekligi. Bu tek sabit hem pin
// bitisini hem de container yuksekligini besler (onceden kod 6, container 7,
// README 5 diyordu — uc farkli sayi dolasiyordu).
const SCROLL_VIEWPORTS = 6
const SEEK_THRESHOLD   = 0.04   // s — bundan kucuk fark icin video'yu seek etme
const SCRUB_SMOOTH     = 1.2    // video/metin scrub yumusatmasi
const OVERLAY_SCRUB    = 2      // overlay crossfade yumusatmasi
// Bu sure dolunca video hazir olmasa da site ACILIR (hero poster'la kalir).
// 30sn idi: ziyaretciyi terk suresinin cok otesinde bos ekranda tutuyordu.
// Asil guvence: stall TERMINAL degil — video gec de olsa hazir olunca onReady
// toparlar ve scrub devreye girer (asagidaki setup effect).
const STALL_TIMEOUT_MS = 8000
const RUNE_TICKS       = 80

// ─── Chapter data ────────────────────────────────────────────────────────────
// Bolum araliklari 5 video klibine hizali (M1=5.04s, M2-M5=8.04s / toplam 37.21s):
// M1 0-0.1355 | M2 0.1355-0.3516 | M3 0.3516-0.5678 | M4 0.5678-0.7839 | M5 0.7839-1.0
const CHAPTERS = [
  {
    id: 'intro',
    progress: [0, 0.1355],
    title: 'DWG ile sorunsuz çalışan, tanıdık gelen bir AutoCAD alternatifi mi arıyorsunuz?',
    subtitle: '2010\'dan beri güvenilen AutoCAD® alternatifi',
    body: 'AViCAD, pratik bir AutoCAD alternatifi olarak tasarlanmış DWG tabanlı bir CAD yazılımıdır — tanıdık komutlar, tam dosya uyumluluğu ve sorunsuz çalışan bir iş akışı sunar.',
    sigil: '✦',
  },
  {
    id: 'model',
    progress: [0.1355, 0.3516],
    title: 'Fikirlerinizi hassas 3B modellere dönüştürün',
    subtitle: '2B\'DEN 3B\'YE',
    body: 'AViCAD ile 2B çizimden 3B modele geçin — katmanlar, bloklar ve DWG geometrisi bozulmadan, alıştığınız komutlarla.',
    sigil: '◈',
  },
  {
    id: 'reality',
    progress: [0.3516, 0.5678],
    title: 'Çizim gerçeğe dönüşürken her detay yerli yerinde',
    subtitle: 'MODELLEME',
    body: 'Tel kafesten malzemeye, ölçüden dokuya — AViCAD tasarımınızı milimetrik doğrulukla gerçek bir projeye taşır.',
    sigil: '◫',
  },
  {
    id: 'visualize',
    progress: [0.5678, 0.7839],
    title: 'Tasarımınızı sunuma hazır görsellere taşıyın',
    subtitle: 'GÖRSELLEŞTİRME',
    body: 'Mimariden iç mekana, peyzajdan makineye — projelerinizi müşterinize foto-gerçekçi sunumlarla anlatın.',
    sigil: '▦',
  },
  {
    id: 'delivery',
    progress: [0.7839, 1.0],
    title: 'Fikirden teslime, tek yazılımla',
    subtitle: 'AVİCAD TÜRKİYE',
    body: 'Profesyonel CAD gücünü uygun maliyetle keşfedin. Ücretsiz demo talep edin, projelerinizi AViCAD ile hayata geçirin.',
    sigil: '◆',
  },
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Verilen id'li bolume kaydirir. Agir video decode ana thread'i bogunca smooth
// scroll ilerlemedigi icin 'auto' (aninda) kullaniliyor — her kosulda calisir.
const scrollToId = (id) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' })
}

// ─── Component ───────────────────────────────────────────────────────────────
const Hero = () => {
  const containerRef  = useRef(null)
  const stickyRef     = useRef(null)
  const videoRef      = useRef(null)
  const overlayRef    = useRef(null)
  const overlayBRef   = useRef(null)
  const titleRef      = useRef(null)
  const subtitleRef   = useRef(null)
  const bodyRef       = useRef(null)
  const sigilRef      = useRef(null)
  const progressRef   = useRef(null)
  const vignetteRef   = useRef(null)
  const chapterLabelRef = useRef(null)
  const runeBarRef    = useRef(null)

  const [activeChapter, setActiveChapter] = useState(0)
  const [videoReady, setVideoReady]       = useState(false)
  const [videoError, setVideoError]       = useState(null)  // terminal: gercek yukleme hatasi
  const [videoSlow, setVideoSlow]         = useState(false)  // gecici: yavas yukleniyor
  const [viewportH, setViewportH]         = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  )
  const [menuOpen, setMenuOpen]           = useState(false)  // mobil hamburger menü

  // Mobilde 25MB'lik masaustu videosu ilk kareyi cozemeden dakikalarca bekletiyor
  // (gercek cihaz testinde 30sn'de bile acilmadi). Mobile ozel 480p/15fps ~5MB
  // surum ayni keyframe yapisina sahip -> scrub birebir calisir, indirme 5 kat az.
  // Karar MOUNT'ta donuyor: resize'da yeniden hesaplansa video ortada yeniden
  // yuklenir ve scrub sifirlanirdi.
  // YALNIZCA GENISLIGE BAKMAK YETMIYOR: yatay tutulan telefon 844px genis
  // oldugu icin masaustu yoluna dusuyor ve 25MB'lik one.mp4'u indiriyordu —
  // yani bu dosyanin varlik sebebi olan hataya geri donuyordu (844x390'da
  // currentSrc = one.mp4 olarak olculdu). Yukseklik kosulu eklendi; `pointer:
  // coarse` ile birlikte, boylece kisa masaustu PENCERELERI (dokunmatik
  // olmayan) etkilenmiyor, yatay telefon/kucuk tablet yakalaniyor.
  const [isMobil] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia(
        '(max-width: 768px), (max-height: 600px) and (pointer: coarse)'
      ).matches
  )

  const chapter = CHAPTERS[activeChapter]

  // Nav link'leri — masaüstü ve mobil menü aynı diziyi paylaşır.
  //
  // Etiket ve hedef id TEK YERDE tutuluyor. Eskiden href etiketten string
  // islemeyle uretiliyordu (`l.toLowerCase().replace(/\s+/g,'-')`), dogru
  // id'ler ise navHandler'da elle yaziliydi — yani esleme iki yerdeydi ve
  // tutarsizdi: "Neden AviCAD?" -> `#neden-avicad?` (soru isareti kaliyordu),
  // "Hakkımızda" -> `#hakkımızda` (Turkce ı, gercek id `hakkimizda`).
  // preventDefault sayesinde tiklama calisiyordu, ama href'ler oluydu:
  // JS calismazsa, link kopyalanip paylasilirsa ya da bir crawler anchor'i
  // takip ederse hicbir yere gitmiyordu. Artik tek kaynak var.
  //
  // id: null -> sayfa basi ("Anasayfa"). href olarak `#` kullaniliyor; JS
  // devre disi olsa bile tarayici bunu sayfa basina goturur.
  const NAV = [
    { etiket: 'Anasayfa',      id: null },
    { etiket: 'Neden AviCAD?', id: 'neden-avicad' },
    { etiket: 'Hakkımızda',    id: 'hakkimizda' },
    { etiket: 'İletişim',      id: 'iletisim' },
    { etiket: 'SSS',           id: 'sss' },
  ]
  const kaydir = (id, top0 = false) => {
    if (top0) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' })
  }
  // Her link ilgili bölüme kaydırır; sonda mobil menüyü kapatır. Eslemeyi
  // NAV'dan aldigi icin if/else zinciri gerekmiyor.
  const navHandler = (id) => (e) => {
    e.preventDefault()
    kaydir(id, id === null)
    setMenuOpen(false)
  }

  // ─── Chapter transition ───────────────────────────────────────────────────
  const prevChapter = useRef(-1)
  const chapterTl   = useRef(null)
  const transitionChapter = (idx) => {
    if (prevChapter.current === idx) return
    prevChapter.current = idx

    // Reduced-motion: fade/kaydirma yok, metni aninda degistir.
    if (prefersReducedMotion()) {
      setActiveChapter(idx)
      return
    }

    // Hizli scroll'da bolumler pes pese degisir. Onceki timeline'i oldurmezsek
    // ayni ref'ler uzerinde iki timeline carpisir ve metin fade-out'un bitis
    // degerlerinde (opacity 0) takili kalir.
    if (chapterTl.current) chapterTl.current.kill()

    const tl = gsap.timeline()
    chapterTl.current = tl

    const textEls = [titleRef.current, subtitleRef.current, bodyRef.current, sigilRef.current]

    // fade out old text → metni React state uzerinden degistir → fade in.
    // Metin artik JSX'ten geliyor; setActiveChapter fade'in ortasinda cagrilinca
    // React yeni metni basar, GSAP yalnizca opacity/transform'u yonetir.
    tl.to(textEls, {
      y: -24, opacity: 0, duration: 0.35, ease: 'power2.in', stagger: 0.04,
    })
    .call(() => setActiveChapter(idx))
    .fromTo(
      [sigilRef.current, subtitleRef.current, titleRef.current, bodyRef.current],
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.07 }
    )

    // chapter label
    if (chapterLabelRef.current) {
      gsap.fromTo(chapterLabelRef.current,
        { opacity: 0, x: 12 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }

  // ─── Setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Reload'da tarayici eski scroll konumunu geri yukluyor. Video gec yuklenip
    // pin kurulunca ScrollTrigger o konumu okuyup progress~1 hesapliyor ve video
    // son kareye atliyor ("donmus" gorunum). Deneyim her zaman Hero'nun tepesinden
    // (kitap kapali, ilk bolum) baslasin diye geri yuklemeyi kapatip basa aliyoruz.
    // NOT: video ref'inden bagimsiz; asagidaki `if (!video) return` guard'inin
    // ONUNDE olmali, yoksa video henuz yoksa hic calismaz.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)

    const video = videoRef.current
    if (!video) return

    let settled = false

    // 'loadeddata'/'canplay' = readyState>=2, ilk kare cozuldu. Onceki hal sabit
    // 1sn bekliyordu; bu hem hizli cihazda gereksiz hem yavas cihazda yetersizdi.
    // Ilk karenin hazir oldugu an tam olarak bu event.
    // NOT: onReady terminal olmayan "yavas" notunu da temizler — video gec de
    // olsa hazir olunca deneyim hatadan otomatik toparlanir.
    const onReady = () => {
      if (settled) return
      settled = true
      setVideoSlow(false)
      setVideoError(null)
      setVideoReady(true)
    }
    // Gercek yukleme hatasi (dosya yok/bozuk). ESKIDEN: yalnizca hata metni
    // yazilirdi, videoReady false kalirdi -> overlay hic kalkmaz, SITE TAMAMEN
    // ERISILEMEZ olurdu. Bu ciddi bir deploy riski: video dosyalari .gitignore'da,
    // sunucuya elle yukleniyor; biri unutulursa (ya da yol yanlissa) tum site
    // olu ekrana donerdi. Artik hatada da siteyi ACIYORUZ — hero poster'la kalir,
    // icerik/CTA/telefon erisilebilir olur. Dekoratif bir arka planin kaybi,
    // sayfanin tamamini feda etmeye degmez.
    const failTerminal = () => {
      if (settled) return
      settled = true
      setVideoError('Görsel deneyim yüklenemedi. Lütfen sayfayı yenilemeyi deneyin.')
      setVideoReady(true)
    }

    // Zaman asimi TERMINAL DEGIL — ama artik BEKLETMEZ de. Onceki hal yalnizca
    // "yavas yukleniyor" notunu gosterip overlay'i acik birakiyordu; video hic
    // gelmezse site SONSUZA DEK loading ekraninda kilitli kaliyordu (icerik, CTA,
    // telefon, WhatsApp — hicbiri gorunmuyordu). Gercek cihaz testinde ziyaretci
    // tam olarak bu ekranda kaldi. Artik sure dolunca SITEYI ACIYORUZ: hero
    // poster.jpg uzerinde durur, tum bolumler ve CTA erisilebilir olur. Video
    // sonradan gelirse asagidaki loadeddata/canplay dinleyicileri scrub'i normal
    // sekilde devreye alir (onReady idempotent degil ama settled zaten true
    // oldugundan zararsiz; scrub effect'i videoReady'ye bagli calisir).
    const stallTimer = setTimeout(() => {
      if (settled) return
      if (video.error || video.networkState === 3 /* NETWORK_NO_SOURCE */) {
        failTerminal()
      } else if (video.readyState < 2) {
        setVideoSlow(true)
        setVideoReady(true)   // <- overlay kalkar, site kullanilabilir olur
      }
    }, STALL_TIMEOUT_MS)

    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    video.addEventListener('error', failTerminal)
    if (video.readyState >= 2) onReady()

    return () => {
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('error', failTerminal)
      clearTimeout(stallTimer)
      if (chapterTl.current) chapterTl.current.kill()
    }
  }, [])

  // ─── iOS kare kilidi (scroll-scrub'ın iPhone'da çalışma şartı) ──────────────
  // iOS Safari, video bir KULLANICI HAREKETİYLE play() edilene kadar
  // currentTime değişimlerinde ekrandaki kareyi yeniden ÇİZMEZ: scroll
  // currentTime'ı içeride ilerletir ama görüntü poster'da donar. Belirti tam
  // olarak buydu (iPhone: "sabit resim vardı, oynamadı"); masaüstünde bu kısıt
  // olmadığı için orada scrub sorunsuz çalışıyor. playsInline + muted gerekli
  // ama YETERLİ DEĞİL — ilk dokunuşta bir kez play()/pause() ile videoyu
  // "etkinleştirmek" kilidi açar, sonraki scrub'lar normal boyanır.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // Yalnızca dokunmatik (coarse pointer): masaüstünde bu kilit sorunu yok ve
    // gereksiz bir play/pause tetiklemeye gerek yok.
    if (!window.matchMedia('(pointer: coarse)').matches) return

    let acildi = false
    const kilidiAc = () => {
      if (acildi) return
      acildi = true
      // muted + playsInline olduğu için bu play() iOS'ta izinli; hemen pause
      // ediyoruz, video oynamaz — yalnızca kare çizimi etkinleşir. Hata
      // (ör. düşük güç modu) sessizce yutulur; en kötü ihtimalle eski davranış.
      const p = video.play()
      if (p && typeof p.then === 'function') {
        p.then(() => video.pause()).catch(() => {})
      } else {
        try { video.pause() } catch { /* yok */ }
      }
    }
    // İlk gerçek kullanıcı hareketinde bir kez çalışır, sonra kendini kaldırır.
    const secenek = { once: true, passive: true }
    window.addEventListener('touchstart', kilidiAc, secenek)
    window.addEventListener('pointerdown', kilidiAc, secenek)
    return () => {
      window.removeEventListener('touchstart', kilidiAc, secenek)
      window.removeEventListener('pointerdown', kilidiAc, secenek)
    }
  }, [])

  // ─── GSAP ScrollTrigger ───────────────────────────────────────────────────
  useEffect(() => {
    if (!videoReady) return

    const video   = videoRef.current
    const reduced = prefersReducedMotion()

    // Pin bitisi fonksiyon olarak veriliyor: ScrollTrigger.refresh() bunu yeniden
    // hesaplar, boylece resize'da pin mesafesi guncel innerHeight'e uyar.
    const endFn = () => '+=' + (window.innerHeight * SCROLL_VIEWPORTS)

    // gsap.context bu blokta olusan her tween ve ScrollTrigger'i kaydeder;
    // ctx.revert() cleanup'ta yalnizca bunlari geri alir. Onceki hal
    // ScrollTrigger.getAll() ile sayfadaki *tum* trigger'lari olduruyordu.
    const ctx = gsap.context(() => {
      // Pin the sticky wrapper
      ScrollTrigger.create({
        trigger: containerRef.current,
        start:   'top top',
        end:     endFn,
        pin:     stickyRef.current,
        pinSpacing: true,
        anticipatePin: 1,
      })

      // Main scrub timeline — drives video time + rune bar
      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start:   'top top',
          end:     endFn,
          scrub:   SCRUB_SMOOTH,
          onUpdate: (self) => {
            // video scrub — duration HER KAREDE okunur, bir kez yakalanmaz.
            // Stall zaman asimi siteyi videosuz acabildigi icin bu effect
            // duration daha NaN'ken kurulabiliyor; video sonradan gelince
            // videoReady zaten true oldugundan effect YENIDEN CALISMAZ. Sabit
            // yakalansaydi duration 1sn'de kalir, tum scroll videonun ilk
            // saniyesine sikisirdi. Canli okuma video gelir gelmez duzeltir.
            const t = self.progress * (video.duration || 1)
            if (!video.seeking && Math.abs(video.currentTime - t) > SEEK_THRESHOLD) {
              if (video.fastSeek) video.fastSeek(t)
              else video.currentTime = t
            }

            // progress bar
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress})`
            }

            // chapter detection
            const p = self.progress
            const idx = CHAPTERS.findIndex(c => p >= c.progress[0] && p < c.progress[1])
            transitionChapter(idx === -1 ? CHAPTERS.length - 1 : idx)

            // vignette intensity
            const vinInt = 0.55 + Math.sin(p * Math.PI) * 0.2
            if (vignetteRef.current) {
              vignetteRef.current.style.opacity = String(vinInt)
            }
          },
        },
      })

      // Subtle overlay colour shift across scroll — crossfade two static
      // gradient layers (opacity is compositor-only; animating `background`
      // repaints the full screen every frame)
      gsap.to(overlayRef.current, {
        opacity: 0,
        scrollTrigger: { trigger: containerRef.current, start: 'top top', end: endFn, scrub: OVERLAY_SCRUB },
      })
      gsap.to(overlayBRef.current, {
        opacity: 1,
        scrollTrigger: { trigger: containerRef.current, start: 'top top', end: endFn, scrub: OVERLAY_SCRUB },
      })

      // Rune bar decorative tick animation (reduced-motion'da atlanir)
      if (runeBarRef.current && !reduced) {
        const ticks = runeBarRef.current.querySelectorAll('.rune-tick')
        gsap.fromTo(ticks,
          { scaleY: 0, opacity: 0 },
          {
            scaleY: 1, opacity: 1, stagger: 0.06, duration: 0.6, ease: 'elastic.out(1,0.5)',
            scrollTrigger: { trigger: containerRef.current, start: 'top 80%' }
          }
        )
      }

      // Entrance animation (reduced-motion'da atlanir)
      if (!reduced) {
        gsap.fromTo(
          [sigilRef.current, subtitleRef.current, titleRef.current, bodyRef.current],
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.1, delay: 0.3 }
        )
      }
    }, containerRef)

    // Resize: pin mesafesini ve container yuksekligini guncel tut. Mobilde adres
    // cubugu inip ciktikca innerHeight surekli oynar; 150ms debounce + 100px esik
    // ile bu gurultuyu suzup gereksiz refresh'i onluyoruz.
    let resizeTimer = null
    let lastH = window.innerHeight
    const onResize = () => {
      if (Math.abs(window.innerHeight - lastH) < 100) return
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        lastH = window.innerHeight
        setViewportH(window.innerHeight)
        ScrollTrigger.refresh()
      }, 150)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
      ctx.revert()
    }
  }, [videoReady])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>

      {/* ── Loading overlay ── */}
      {/* Uc durum: terminal hata (kirmizi), yavas yukleniyor (notlu, cubuk devam),
          normal yukleniyor. Yalnizca terminal hata cubugu gizler. */}
      <div className={`got-loading ${videoReady ? 'hidden' : ''}`}>
        {/* Gerçek logo: giriş ekranı yalnızca yazıyla çok sadeydi. alt boş —
            hemen altındaki metin zaten "AviCAD Türkiye" diyor, ekran okuyucuya
            tekrar okutmayalım (dekoratif). width/height CLS'i önler. */}
        <img className="got-loading-mark" src={`${import.meta.env.BASE_URL}logo.webp`}
             width="144" height="147" alt="" aria-hidden="true" />
        <div className="got-loading-logo">AviCAD Türkiye</div>
        <div className={videoError ? 'got-loading-error' : 'got-loading-sub'}>
          {videoError
            || (videoSlow ? 'Video yükleniyor, bu biraz sürebilir…' : 'DWG Uyumlu CAD Yazılımı')}
        </div>
        {!videoError && (
          <div className="got-loading-bar-wrap">
            <div className="got-loading-bar-fill" />
          </div>
        )}
      </div>

      {/* ── Main scroll container ── */}
      <div
        ref={containerRef}
        className="got-container"
        style={{ height: `${viewportH * (SCROLL_VIEWPORTS + 1)}px` }}
      >
        {/* ── Sticky viewport ── */}
        <div ref={stickyRef} className="got-sticky">

          {/* Video — sesi yok, dekoratif arka plan; ekran okuyuculardan gizli */}
          <video
            ref={videoRef}
            className="got-video"
            src={`${import.meta.env.BASE_URL}video/${isMobil ? 'one-mobile.mp4' : 'one.mp4'}`}
            poster={`${import.meta.env.BASE_URL}video/poster.jpg`}
            playsInline
            muted
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Layers (dekoratif) */}
          <div ref={vignetteRef} className="got-vignette" aria-hidden="true" />
          <div ref={overlayRef}  className="got-overlay" aria-hidden="true" />
          <div ref={overlayBRef} className="got-overlay got-overlay-b" aria-hidden="true" />
          <div className="got-grain" aria-hidden="true" />

          {/* Corner ornaments (dekoratif) */}
          {['tl','tr','bl','br'].map(pos => (
            <div key={pos} className={`got-corner got-corner-${pos}`} aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2 L2 20 M2 2 L20 2" stroke="#0693e3" strokeWidth="1" strokeOpacity="0.5"/>
                <path d="M2 2 L8 8" stroke="#0693e3" strokeWidth="0.5" strokeOpacity="0.4"/>
                <rect x="1" y="1" width="4" height="4" fill="none" stroke="#0693e3" strokeWidth="0.5" strokeOpacity="0.6"/>
              </svg>
            </div>
          ))}

          {/* Nav */}
          <nav className="got-nav" aria-label="Ana menü">
            <div className="got-nav-logo">
              {/* width/height SART: olculdu, uc gorselin hicbirinde yoktu ve
                  tarayici yer ayiramadigi icin gorsel yuklenince duzen
                  ziplyordu (CLS — Core Web Vitals siralama sinyali).
                  Dosya 144px: nav'da en fazla 42px gosteriliyor, DPR 3'te bile
                  yetiyor. Eskiden 576px'lik PNG iniyordu (8 kat fazla veri). */}
              <img className="got-nav-logo-img" src={`${import.meta.env.BASE_URL}logo.webp`}
                   width="144" height="147" alt="AviCAD Türkiye" />
              <span className="got-nav-logo-text">AviCAD Türkiye</span>
            </div>

            {/* Masaüstü linkleri */}
            <ul className="got-nav-links">
              {NAV.map(({ etiket, id }) => (
                <li key={etiket}>
                  <a href={id ? `#${id}` : '#'} onClick={navHandler(id)}>{etiket}</a>
                </li>
              ))}
            </ul>

            {/* Mobil hamburger butonu */}
            <button
              type="button"
              className={`got-nav-toggle ${menuOpen ? 'open' : ''}`}
              aria-label="Menü"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>

            {/* Mobil menü */}
            <ul className={`got-nav-mobile ${menuOpen ? 'open' : ''}`}>
              {NAV.map(({ etiket, id }) => (
                <li key={etiket}>
                  <a href={id ? `#${id}` : '#'} onClick={navHandler(id)}>{etiket}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Rune bar (dekoratif) */}
          <div ref={runeBarRef} className="got-rune-bar" aria-hidden="true">
            {Array.from({ length: RUNE_TICKS }).map((_, i) => (
              <div key={i} className="rune-tick" />
            ))}
          </div>

          {/* Bolum metni scroll-scrub ile degisir. aria-live YOK: her scroll'da
              metni tekrar okuyup ekran okuyucuyu bogmasin (ilk H1 normal okunur). */}
          <div className="got-content">
            <span ref={sigilRef} className="got-sigil" aria-hidden="true">{chapter.sigil}</span>
            <div className="got-divider" aria-hidden="true">
              <div className="got-divider-line" />
              <div className="got-divider-diamond" />
              <div className="got-divider-line right" />
            </div>
            <span ref={subtitleRef} className="got-subtitle">{chapter.subtitle}</span>
            <h1 ref={titleRef} className="got-title">{chapter.title}</h1>
            <p ref={bodyRef} className="got-body">{chapter.body}</p>
            <div className="got-cta-row">
              <button type="button" className="got-cta-btn" onClick={() => { window.dispatchEvent(new CustomEvent('konu-sec', { detail: 'Demo Talebi' })); scrollToId('iletisim') }}>30 Gün Ücretsiz Deneme</button>
              <button type="button" className="got-cta-ghost" onClick={() => scrollToId('neden-avicad')}>Özellikleri Keşfet</button>
            </div>
          </div>

          <div className="got-right-panel">
            <div ref={chapterLabelRef} className="got-chapter-label">
              {String(activeChapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
            </div>
            <div className="got-vert-line" aria-hidden="true" />
            <div className="got-dots" aria-hidden="true">
              {CHAPTERS.map((_, i) => (
                <div
                  key={i}
                  className={`got-dot ${i === activeChapter ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="got-scroll-hint">
            <span>Kaydır</span>
            <div className="arrow" />
          </div>

          {/* Progress bar */}
          <div className="got-progress-bar-wrap">
            <div ref={progressRef} className="got-progress-bar-fill" />
          </div>

        </div>{/* /sticky */}
      </div>{/* /container */}
    </>
  )
}

export default Hero