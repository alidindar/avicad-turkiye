import { useEffect, useRef, useState } from 'react'
import './Contact.css'
import { submitContact } from '../emailService'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const Contact = () => {
  const sectionRef = useRef(null)
  const headerRef  = useRef(null)
  const formRef    = useRef(null)

  const [ad, setAd]           = useState('')
  const [soyad, setSoyad]     = useState('')
  const [email, setEmail]     = useState('')
  const [telefon, setTelefon] = useState('')
  const [konu, setKonu]       = useState('')
  const [mesaj, setMesaj]     = useState('')

  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [durum, setDurum]               = useState(null) // { ok: boolean, text: string }

  // Fade-up giris — Section1 ile ayni IntersectionObserver deseni
  useEffect(() => {
    const els = [headerRef.current, formRef.current].filter(Boolean)
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
      { threshold: 0.15 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => { obs.disconnect(); timers.forEach(clearTimeout) }
  }, [])

  // Hero "30 Gün Ücretsiz Deneme" butonu bu event'i gonderir → Konu'yu ayarla.
  useEffect(() => {
    const onKonuSec = (e) => setKonu(e.detail)
    window.addEventListener('konu-sec', onKonuSec)
    return () => window.removeEventListener('konu-sec', onKonuSec)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (gonderiliyor) return
    setGonderiliyor(true)
    setDurum(null)
    try {
      // Gonderim: 1) satisa lead, 2) musteriye konuya ozel otomatik yanit.
      await submitContact({ ad, soyad, telefon, email, konu, mesaj })
      setDurum({ ok: true, text: 'Talebiniz alındı. En kısa sürede size dönüş yapacağız.' })
      setAd(''); setSoyad(''); setEmail(''); setTelefon(''); setKonu(''); setMesaj('')
    } catch (err) {
      setDurum({ ok: false, text: 'Gönderilemedi, lütfen tekrar deneyin veya bizi telefonla arayın.' })
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <section ref={sectionRef} id="iletisim" className="contact">

      {/* Ambient background (Section1 ile ayni) */}
      <div className="contact-bg-texture" aria-hidden="true" />
      <div className="contact-bg-vignette" aria-hidden="true" />

      {/* Header */}
      <header ref={headerRef} className="contact-header fade-up">
        <p className="contact-eyebrow">BİZE ULAŞIN</p>
        <div className="contact-ornament" aria-hidden="true">
          <span className="ornament-line" />
          <span className="ornament-rune">✦</span>
          <span className="ornament-line" />
        </div>
        <h2 className="contact-title">İletişim</h2>
        <p className="contact-subtitle">Fiyat teklifi, demo ya da destek — size nasıl yardımcı olabiliriz?</p>
      </header>

      {/* Form */}
      <form ref={formRef} className="contact-form fade-up" onSubmit={handleSubmit}>
        <div className="contact-row">
          <div className="contact-field">
            <label className="contact-label" htmlFor="c-ad">Ad</label>
            <input
              id="c-ad" className="contact-input" type="text" required
              value={ad} onChange={(e) => setAd(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="contact-field">
            <label className="contact-label" htmlFor="c-soyad">Soyad</label>
            <input
              id="c-soyad" className="contact-input" type="text" required
              value={soyad} onChange={(e) => setSoyad(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="contact-row">
          <div className="contact-field">
            <label className="contact-label" htmlFor="c-email">E-posta</label>
            <input
              id="c-email" className="contact-input" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="contact-field">
            <label className="contact-label" htmlFor="c-telefon">Telefon</label>
            <input
              id="c-telefon" className="contact-input" type="tel" required
              value={telefon} onChange={(e) => setTelefon(e.target.value)}
              autoComplete="tel" placeholder="05__ ___ __ __"
            />
          </div>
        </div>

        <div className="contact-field">
          <label className="contact-label" htmlFor="c-konu">Konu</label>
          <select
            id="c-konu" className="contact-input contact-select" required
            value={konu} onChange={(e) => setKonu(e.target.value)}
          >
            <option value="" disabled>Konu seçin</option>
            <option value="Fiyat Talebi">Fiyat Talebi</option>
            <option value="Demo Talebi">Demo Talebi</option>
            <option value="Destek Talebi">Destek Talebi</option>
          </select>
        </div>

        <div className="contact-field">
          <label className="contact-label" htmlFor="c-mesaj">Mesaj <span className="contact-optional">(isteğe bağlı)</span></label>
          <textarea
            id="c-mesaj" className="contact-textarea" rows={5}
            value={mesaj} onChange={(e) => setMesaj(e.target.value)}
            placeholder="Kısa bir açıklama ekleyebilirsiniz."
          />
        </div>

        <button type="submit" className="contact-submit" disabled={gonderiliyor}>
          {gonderiliyor ? 'Gönderiliyor…' : 'Gönder'}
        </button>

        {durum && (
          <p className={`contact-status ${durum.ok ? 'ok' : 'error'}`} role="status">
            {durum.text}
          </p>
        )}
      </form>

      {/* Footer ornament */}
      <div className="contact-footer-ornament" aria-hidden="true">
        <span className="footer-line" />
        <span className="footer-sigil">✦</span>
        <span className="footer-line" />
      </div>

    </section>
  )
}

export default Contact
