import { useState } from 'react'
import './Compare.css'
import Ornament from './Ornament'

// Konu'yu "Demo Talebi" yapip Iletisim formuna kaydir (Hero CTA ile ayni akis).
const scrollToContact = () => {
  const el = document.getElementById('iletisim')
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' })
}

// Ozellik karsilastirmasi — avicad.com/compare-avicad-with-autocad resmi tablosundan
// kurasyonlu; yalnizca dogrulanabilir gercekler. Karsilastirma AutoCAD LT (giris 2B surumu)
// ile (LT'de 3B/AutoLISP/kalici lisans yok — Autodesk resmi tanimi; Mech-Q AViCAD'e ozgu).
const Check = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)
const Cross = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

const FEATURES = [
  { label: 'DWG/DXF (dönüştürmeden aç-kaydet)', lt: true },
  { label: 'Tanıdık komut & arayüz', lt: true },
  { label: '2B çizim & ölçülendirme', lt: true },
  { label: '3B modelleme', lt: false },
  { label: 'AutoLISP / programlama (otomasyon)', lt: false },
  { label: 'Dahili mühendislik araçları (Mech-Q)', lt: false },
  { label: '20.000+ blok kütüphanesi', lt: false },
  { label: 'Kalıcı (süresiz) lisans', lt: false },
]

const FeatureTable = () => (
  <div className="fc-table" role="table">
    <div className="fc-row fc-head" role="row">
      <span className="fc-cell fc-feat" role="columnheader">Özellik</span>
      <span className="fc-cell fc-avicad" role="columnheader">AViCAD</span>
      <span className="fc-cell" role="columnheader">AutoCAD LT</span>
    </div>
    {FEATURES.map((f) => (
      <div className="fc-row" role="row" key={f.label}>
        <span className="fc-cell fc-feat" role="cell">{f.label}</span>
        <span className="fc-cell fc-avicad fc-yes" role="cell" aria-label="var">
          <Check />
        </span>
        <span className={`fc-cell ${f.lt ? 'fc-yes' : 'fc-no'}`} role="cell"
              aria-label={f.lt ? 'var' : 'yok'}>
          {f.lt ? <Check /> : <Cross />}
        </span>
      </div>
    ))}
  </div>
)

const VIDEO_ID = 'NG6p5puX9kY'

// Tikla-oynat facade: player yalniz tiklayinca yuklenir (agir sayfaya on yuk yok).
const DesignVideo = () => {
  const [playing, setPlaying] = useState(false)
  const [thumb, setThumb] = useState(`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`)

  if (playing) {
    return (
      <div className="video-facade playing">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?start=25&autoplay=1&rel=0`}
          title="AViCAD tanıtım videosu"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <button type="button" className="video-facade" onClick={() => setPlaying(true)} aria-label="Videoyu oynat">
      <img
        src={thumb}
        alt="AViCAD tanıtım videosu önizlemesi"
        loading="lazy"
        onError={() => setThumb(`https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`)}
      />
      <span className="video-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </button>
  )
}

const Compare = () => (
  <section className="compare" aria-label="AViCAD ve AutoCAD LT karşılaştırması">
    <header className="compare-header">
      <p className="compare-eyebrow">KARŞILAŞTIRMA</p>
      <Ornament />
      <h2 className="compare-title">AViCAD vs AutoCAD LT</h2>
      <p className="compare-subtitle">
        AutoCAD LT'nin yaptığı her şey — üstüne 3B, otomasyon ve dahili mühendislik araçları.
        Nasıl çalıştığını videoda görün.
      </p>
    </header>

    <div className="cmp-split">
      <div className="cmp-col">
        <p className="cmp-col-label">Özellik karşılaştırması</p>
        <FeatureTable />
        <p className="fc-note">
          Karşılaştırma AutoCAD LT (Autodesk'in giriş seviyesi 2B sürümü) içindir.
        </p>
      </div>

      <div className="cmp-col cmp-col-video">
        <p className="cmp-col-label">İzleyin — AViCAD iş başında</p>
        <DesignVideo />
        <div className="cmp-video-cta">
          <p className="cmp-video-line">AViCAD'i kendi projelerinizde ücretsiz deneyin.</p>
          <button
            type="button"
            className="cmp-cta-btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('konu-sec', { detail: 'Demo Talebi' }))
              scrollToContact()
            }}
          >
            30 Gün Ücretsiz Deneme
          </button>
        </div>
      </div>
    </div>

    <p className="compare-note">
      AutoCAD®, Autodesk, Inc.'in tescilli markasıdır. Bu karşılaştırma genel bilgilendirme amaçlıdır.
    </p>
  </section>
)

export default Compare
