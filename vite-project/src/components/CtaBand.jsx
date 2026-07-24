import './CtaBand.css'
import Ornament from './Ornament'

// Section1 (ozellikler) ile Contact arasinda dönüşüm bandi. Butona basinca
// Konu'yu "Demo Talebi" yapip Iletisim formuna kaydirir (Hero deseniyle ayni).
const scrollToContact = () => {
  const el = document.getElementById('iletisim')
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' })
}

const CtaBand = () => (
  <section className="cta-band">
    <div className="cta-band-inner">
      <p className="cta-band-eyebrow">ÜCRETSİZ 30 GÜN</p>
      <Ornament />
      <h2 className="cta-band-title">Bugün denemeye başlayın</h2>
      <p className="cta-band-text">
        AviCAD'i kendi projelerinizde ücretsiz deneyin. Kurulumdan lisanslamaya
        kadar ekibimiz her adımda yanınızda.
      </p>
      <button
        type="button"
        className="cta-band-btn"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('konu-sec', { detail: 'Demo Talebi' }))
          scrollToContact()
        }}
      >
        30 Gün Ücretsiz Deneme
      </button>
    </div>
  </section>
)

export default CtaBand
