import { useEffect, useRef, useState } from 'react'
import './Contact.css'

// Formdan gelen mesajlarin gidecegi adres. Degistirmek icin sadece bu satiri
// duzenleyin (or. 'info@avicad.com.tr').
const CONTACT_EMAIL = 'tahagulsn@gmail.com'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const Contact = () => {
  const sectionRef = useRef(null)
  const headerRef  = useRef(null)
  const formRef    = useRef(null)

  const [ad, setAd]         = useState('')
  const [soyad, setSoyad]   = useState('')
  const [email, setEmail]   = useState('')
  const [konu, setKonu]     = useState('')
  const [mesaj, setMesaj]   = useState('')

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

  const handleSubmit = (e) => {
    e.preventDefault()
    // Tarayici zaten required + email formatini dogruluyor. Burada mailto kur.
    const subject = konu || `İletişim — ${ad} ${soyad}`.trim()
    const body =
      `Ad Soyad: ${ad} ${soyad}\n` +
      `E-posta: ${email}\n\n` +
      `${mesaj}\n`
    const mailto =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    window.location.href = mailto
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
        <p className="contact-subtitle">Bir sorunuz mu var? Bize yazın.</p>
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

        <div className="contact-field">
          <label className="contact-label" htmlFor="c-email">E-posta</label>
          <input
            id="c-email" className="contact-input" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="contact-field">
          <label className="contact-label" htmlFor="c-konu">Konu</label>
          <input
            id="c-konu" className="contact-input" type="text" required
            value={konu} onChange={(e) => setKonu(e.target.value)}
          />
        </div>

        <div className="contact-field">
          <label className="contact-label" htmlFor="c-mesaj">Mesaj</label>
          <textarea
            id="c-mesaj" className="contact-textarea" required rows={5}
            value={mesaj} onChange={(e) => setMesaj(e.target.value)}
          />
        </div>

        <button type="submit" className="contact-submit">Gönder</button>
      </form>

      {/* Footer ornament */}
      <div className="contact-footer-ornament" aria-hidden="true">
        <span className="footer-line" />
        <span className="footer-sigil">⚔</span>
        <span className="footer-line" />
      </div>

    </section>
  )
}

export default Contact
