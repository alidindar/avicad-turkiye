import { useEffect, useRef, useState } from 'react'
import './Section1.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// AviCAD ozellik/avantaj kartlari. `icon` gecici emoji placeholder (ikonlar
// sonra netlesecek); `sigil` kart altindaki kisa etiket.
const HOUSES = [
  {
    id: 'dwg',
    name: 'DWG UYUMU',
    seat: 'Dönüştürmeden aç & kaydet',
    words: 'Dosyalarınız Olduğu Gibi',
    region: 'DOSYA UYUMLULUĞU',
    sigil: 'DWG · DXF',
    icon: '🗂️',
    accent: '#5b9bd5',
    description:
      'AviCAD, .dwg ve .dxf dosyalarını dönüştürmeden doğrudan açar ve kaydeder. Mevcut projeleriniz ve iş ortaklarınızla paylaşımınız hiç bozulmadan devam eder.',
    bg: 'linear-gradient(135deg, #0d1117 0%, #14202e 60%, #0d1117 100%)',
    borderColor: '#3a5f80',
  },
  {
    id: 'arayuz',
    name: 'TANIDIK ARAYÜZ',
    seat: 'Sıfır öğrenme eğrisi',
    words: 'Alıştığınız Komutlar',
    region: 'KOLAY GEÇİŞ',
    sigil: 'AutoCAD Uyumlu',
    icon: '⌨️',
    accent: '#4fb3a6',
    description:
      'Komut satırı, kısayollar ve menüler AutoCAD’e çok benzer. Ekibiniz yeniden eğitime gerek kalmadan ilk günden tam verimle çalışır.',
    bg: 'linear-gradient(135deg, #0a1413 0%, #10201d 60%, #0a1413 100%)',
    borderColor: '#2f6f68',
  },
  {
    id: 'tasarim',
    name: '2B & 3B TASARIM',
    seat: 'Çizimden modele',
    words: 'Tek Yazılımda',
    region: 'TASARIM GÜCÜ',
    sigil: 'Çizim & Model',
    icon: '📐',
    accent: '#d4a84b',
    description:
      'Teknik çizimden 3B modellemeye kadar mimari, makine ve mühendislik projelerinizi tek bir güçlü ortamda tamamlayın.',
    bg: 'linear-gradient(135deg, #1a1200 0%, #2a1f00 60%, #1a1200 100%)',
    borderColor: '#7a6130',
  },
  {
    id: 'lisans',
    name: 'UYGUN LİSANS',
    seat: 'Kalıcı lisans seçeneği',
    words: 'Bütçenizi Zorlamadan',
    region: 'MALİYET AVANTAJI',
    sigil: 'Kalıcı Lisans',
    icon: '🏷️',
    accent: '#5a9e48',
    description:
      'Profesyonel CAD gücünü abonelik baskısı olmadan, uygun maliyetli lisanslama ile edinin. Küçük ofisten büyük ekibe kadar ölçeklenir.',
    bg: 'linear-gradient(135deg, #030a00 0%, #0c1a06 60%, #030a00 100%)',
    borderColor: '#2f5a28',
  },
  {
    id: 'destek',
    name: 'YEREL DESTEK',
    seat: 'AviCAD Türkiye',
    words: 'Yanınızda, Türkçe',
    region: 'TÜRKİYE DESTEĞİ',
    sigil: 'Türkçe Destek',
    icon: '🎧',
    accent: '#d0564a',
    description:
      'Kurulumdan eğitime, teknik sorundan lisanslamaya kadar Türkiye distribütörü olarak hızlı ve Türkçe destek sağlıyoruz.',
    bg: 'linear-gradient(135deg, #170705 0%, #1f0a08 60%, #170705 100%)',
    borderColor: '#7a2a22',
  },
  {
    id: 'hiz',
    name: 'HIZLI GEÇİŞ',
    seat: 'Dakikalar içinde',
    words: 'Hemen Üretime',
    region: 'HIZLI BAŞLANGIÇ',
    sigil: 'Kolay Geçiş',
    icon: '⚡',
    accent: '#8a7fe0',
    description:
      'Tanıdık arayüz ve DWG uyumu sayesinde AutoCAD’den geçiş sorunsuzdur. Ücretsiz demo ile bugün deneyin, farkı hemen görün.',
    bg: 'linear-gradient(135deg, #0b0916 0%, #141026 60%, #0b0916 100%)',
    borderColor: '#4a4290',
  },
]

const HouseCard = ({ house, index }) => {
  const cardRef   = useRef(null)
  const sigilRef  = useRef(null)
  const [hovered, setHovered] = useState(false)

  // Staggered entrance via IntersectionObserver
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const stagger = prefersReducedMotion() ? 0 : index * 120
    let timer = null
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => el.classList.add('visible'), stagger)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(timer) }
  }, [index])

  // Sigil tilt on hover
  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 14
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 14
    if (sigilRef.current) {
      sigilRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg) scale(1.06)`
    }
  }
  const handleMouseLeave = () => {
    if (sigilRef.current) sigilRef.current.style.transform = ''
    setHovered(false)
  }

  return (
    <div
      ref={cardRef}
      className={`house-card house-card--${house.id}`}
      style={{ '--accent': house.accent, '--border': house.borderColor, background: house.bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Corner ornaments */}
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />

      {/* Glow pulse on hover */}
      <div className="card-glow" />

      {/* Ikon (gecici emoji placeholder) */}
      <div ref={sigilRef} className="house-sigil-wrap">
        <div className="house-sigil-fallback" aria-hidden="true">{house.icon}</div>
        <div className="sigil-ring" />
      </div>

      {/* Static content */}
      <div className={`house-content ${hovered ? 'content-hidden' : ''}`}>
        <p className="house-region">{house.region}</p>
        <div className="house-divider">
          <span className="divider-line" />
          <span className="divider-diamond" />
          <span className="divider-line" />
        </div>
        <h2 className="house-name">{house.name}</h2>
        <p className="house-seat">{house.seat}</p>
        <p className="house-sigil-label">{house.sigil}</p>
      </div>

      {/* Hover reveal: words + description */}
      <div className={`house-hover-content ${hovered ? 'hover-visible' : ''}`}>
        <p className="hover-words">{house.words}</p>
        <div className="house-divider hover-divider">
          <span className="divider-line" />
          <span className="divider-diamond" />
          <span className="divider-line" />
        </div>
        <h2 className="hover-name">{house.name}</h2>
        <p className="hover-desc">{house.description}</p>
      </div>

      {/* Bottom accent bar */}
      <div className="card-accent-bar" />
    </div>
  )
}

const Section1 = () => {
  const sectionRef   = useRef(null)
  const headingRef   = useRef(null)
  const subRef       = useRef(null)

  useEffect(() => {
    const els = [headingRef.current, subRef.current].filter(Boolean)
    const step = prefersReducedMotion() ? 0 : 150
    const timers = []
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          els.forEach((el, i) =>
            timers.push(setTimeout(() => el.classList.add('visible'), i * step))
          )
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => { obs.disconnect(); timers.forEach(clearTimeout) }
  }, [])

  return (
    <section ref={sectionRef} id="neden-avicad" className="section1">

      {/* Ambient background texture */}
      <div className="section1-bg-texture" />
      <div className="section1-bg-vignette" />

      {/* Section header */}
      <header className="section1-header">
        <p ref={subRef} className="section1-eyebrow fade-up">NEDEN AVİCAD?</p>
        <div className="header-ornament">
          <span className="ornament-line" />
          <span className="ornament-rune">✦</span>
          <span className="ornament-line" />
        </div>
        <h1 ref={headingRef} className="section1-title fade-up">
          Öne Çıkan<br />
          <em>Özellikler</em>
        </h1>
        <p className="section1-subtitle fade-up">
          DWG uyumlu, tanıdık arayüzlü, uygun maliyetli profesyonel CAD çözümü.
        </p>
      </header>

      {/* Houses grid */}
      <div className="houses-grid">
        {HOUSES.map((house, i) => (
          <HouseCard key={house.id} house={house} index={i} />
        ))}
      </div>

      {/* Section footer ornament */}
      <div className="section1-footer-ornament">
        <span className="footer-line" />
        <span className="footer-sigil">✦</span>
        <span className="footer-line" />
      </div>

    </section>
  )
}

export default Section1