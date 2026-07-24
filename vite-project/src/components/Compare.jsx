import { useState } from 'react'
import './Compare.css'
import Ornament from './Ornament'
import { PARA_BIRIMI, AVICAD_YILLIK, AUTOCAD_YILLIK } from '../siteConfig'

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n))
const para = (n) => `${PARA_BIRIMI}${fmt(n)}`

// Fiyat karşılaştırması: hesap makinesi + bar grafiği. İkisi de yıllık abonelik
// (resmî liste fiyatları) — elma-elma karşılaştırma; kalıcı lisans ayrıca vurgulanır.
const PriceCompare = () => {
  const [yil, setYil] = useState(3)
  const [kisi, setKisi] = useState(5)

  const avicad = AVICAD_YILLIK * kisi * yil
  const autocad = AUTOCAD_YILLIK * kisi * yil
  const maks = Math.max(avicad, autocad, 1)
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
        <div className="price-chart">
          <div className="price-bar-col">
            <span className="price-amount avicad">{para(avicad)}</span>
            <div className="price-bar avicad" style={{ height: `${(avicad / maks) * 100}%` }} />
            <span className="price-bar-label">AviCAD</span>
          </div>
          <div className="price-bar-col">
            <span className="price-amount autocad">{para(autocad)}</span>
            <div className="price-bar autocad" style={{ height: `${(autocad / maks) * 100}%` }} />
            <span className="price-bar-label">AutoCAD</span>
          </div>
        </div>
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

    <p className="compare-note">
      AutoCAD®, Autodesk, Inc.'in tescilli markasıdır. Bu karşılaştırma genel bilgilendirme amaçlıdır.
    </p>
  </section>
)

export default Compare
