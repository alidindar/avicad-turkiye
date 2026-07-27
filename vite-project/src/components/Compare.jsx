import { useState } from 'react'
import './Compare.css'
import Ornament from './Ornament'
import { PARA_BIRIMI, AVICAD_YILLIK, AUTOCAD_YILLIK } from '../siteConfig'

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n))
const para = (n) => `${PARA_BIRIMI}${fmt(n)}`

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

const FeatureCompare = () => (
  <div className="feature-compare">
    <h3 className="fc-title">Özellik karşılaştırması: AViCAD vs AutoCAD LT</h3>
    <p className="fc-subtitle">
      AutoCAD LT'nin yaptığı her şey — üstüne 3B, otomasyon ve dahili mühendislik araçları.
    </p>
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
    <p className="fc-note">
      Karşılaştırma AutoCAD LT (Autodesk'in giriş seviyesi 2B sürümü) içindir; tam AutoCAD ile
      fiyat karşılaştırması yukarıdadır.
    </p>
  </div>
)

// Kumulatif maliyet-yil cizgi/alan grafigi (ZWCAD tarzi; ama sure degil GERCEK maliyet).
// Yillar ilerledikce AutoCAD tirmanir, AViCAD dusuk kalir. Kutuphane yok — inline SVG.
const CostChart = ({ yil, kisi }) => {
  const W = 460, H = 258
  const PL = 56, PR = 18, PT = 16, PB = 30
  const plotW = W - PL - PR
  const plotH = H - PT - PB
  const aviAt = (y) => AVICAD_YILLIK * kisi * y
  const autoAt = (y) => AUTOCAD_YILLIK * kisi * y
  const maxVal = Math.max(autoAt(yil), 1)
  const xAt = (y) => PL + (yil ? y / yil : 0) * plotW
  const yAt = (v) => PT + plotH * (1 - v / maxVal)
  const years = Array.from({ length: yil + 1 }, (_, i) => i)
  const linePts = (fn) => years.map((y) => `${xAt(y).toFixed(1)},${yAt(fn(y)).toFixed(1)}`).join(' ')
  const areaPts = (fn) => `${linePts(fn)} ${xAt(yil).toFixed(1)},${yAt(0).toFixed(1)} ${xAt(0).toFixed(1)},${yAt(0).toFixed(1)}`
  const grid = [0.25, 0.5, 0.75, 1].map((f) => f * maxVal)
  const xStep = yil > 6 ? 2 : 1
  const xTicks = years.filter((y) => y % xStep === 0 || y === yil)

  return (
    <svg className="price-line-chart" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label="AViCAD ve AutoCAD kümülatif maliyet karşılaştırması (yıllara göre)">
      <line className="pc-axis-line" x1={PL} y1={yAt(0)} x2={W - PR} y2={yAt(0)} />
      {grid.map((v, i) => (
        <g key={i}>
          <line className="pc-grid" x1={PL} y1={yAt(v)} x2={W - PR} y2={yAt(v)} />
          <text className="pc-axis" x={PL - 8} y={yAt(v) + 3.5} textAnchor="end">{para(Math.round(v))}</text>
        </g>
      ))}
      {xTicks.map((y) => (
        <text key={y} className="pc-axis" x={xAt(y)} y={H - PB + 17} textAnchor="middle">{y}</text>
      ))}
      <text className="pc-axis-title" x={PL + plotW / 2} y={H - 3} textAnchor="middle">Yıl →</text>

      <polygon className="pc-area autocad" points={areaPts(autoAt)} />
      <polygon className="pc-area avicad" points={areaPts(aviAt)} />
      <polyline className="pc-line autocad" points={linePts(autoAt)} />
      <polyline className="pc-line avicad" points={linePts(aviAt)} />

      <circle className="pc-dot autocad" cx={xAt(yil)} cy={yAt(autoAt(yil))} r="4" />
      <circle className="pc-dot avicad" cx={xAt(yil)} cy={yAt(aviAt(yil))} r="4" />
      <text className="pc-val autocad" x={xAt(yil) - 8} y={yAt(autoAt(yil)) - 9} textAnchor="end">{para(autoAt(yil))}</text>
      <text className="pc-val avicad" x={xAt(yil) - 8} y={yAt(aviAt(yil)) - 9} textAnchor="end">{para(aviAt(yil))}</text>
    </svg>
  )
}

const PriceCompare = () => {
  const [yil, setYil] = useState(3)
  const [kisi, setKisi] = useState(5)

  const avicad = AVICAD_YILLIK * kisi * yil
  const autocad = AUTOCAD_YILLIK * kisi * yil
  const tasarruf = autocad - avicad

  return (
    <div className="price-compare">
      <div className="price-left">
        <p className="compare-eyebrow">MALİYET</p>
        <h3 className="price-title">Neden aynı iş için daha fazla ödeyesiniz?</h3>
        <p className="price-desc">
          AViCAD, AutoCAD'in yaptığını çok daha uygun maliyetle yapar. Yıl ve
          kullanıcı sayısını değiştirin, farkı görün.
        </p>

        <div className="price-controls">
          <div className="price-control">
            <span className="price-control-label">Yıl</span>
            <div className="stepper">
              <button type="button" onClick={() => setYil((y) => Math.max(1, y - 1))} aria-label="Yıl azalt">−</button>
              <span className="stepper-val">{yil}</span>
              <button type="button" onClick={() => setYil((y) => Math.min(10, y + 1))} aria-label="Yıl arttır">+</button>
            </div>
          </div>
          <div className="price-control price-control-slider">
            <span className="price-control-label">Kullanıcı / Lisans: <strong>{kisi}</strong></span>
            <input type="range" min="1" max="20" value={kisi}
                   onChange={(e) => setKisi(Number(e.target.value))} aria-label="Kullanıcı sayısı" />
          </div>
        </div>
      </div>

      <div className="price-right">
        <div className="pc-legend" aria-hidden="true">
          <span className="pc-leg avicad">AViCAD</span>
          <span className="pc-leg autocad">AutoCAD</span>
        </div>
        <CostChart yil={yil} kisi={kisi} />
        {tasarruf > 0 && (
          <p className="price-savings">
            {yil} yıl · {kisi} kullanıcı → <strong>{para(tasarruf)}</strong> tasarruf
          </p>
        )}
      </div>

      <div className="price-footnote">
        <p className="price-perpetual">
          <span className="price-perpetual-badge">Kalıcı lisans</span>
          AViCAD ayrıca kalıcı (süresiz) lisans sunar; AutoCAD yalnızca aboneliktir.
        </p>
        <p className="price-note">Liste fiyatları (USD); bölge ve vergiye göre değişebilir.</p>
      </div>
    </div>
  )
}

const Compare = () => (
  <section className="compare" aria-label="AviCAD ve AutoCAD maliyet karşılaştırması">
    <header className="compare-header">
      <p className="compare-eyebrow">KARŞILAŞTIRMA</p>
      <Ornament />
      <h2 className="compare-title">AviCAD vs AutoCAD</h2>
      <p className="compare-subtitle">
        Aynı temel yetenekler; daha esnek lisans, çok daha uygun maliyet ve yerel Türkçe destek.
      </p>
    </header>

    <PriceCompare />

    <FeatureCompare />

    <p className="compare-note">
      AutoCAD®, Autodesk, Inc.'in tescilli markasıdır. Bu karşılaştırma genel bilgilendirme amaçlıdır.
    </p>
  </section>
)

export default Compare
