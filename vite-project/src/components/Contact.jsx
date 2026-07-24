import { useEffect, useRef, useState } from 'react'
import './Contact.css'
import { submitContact } from '../emailService'
import {
  TELEFON_GORUNEN, TELEFON_HREF, EPOSTA,
  ADRES, CALISMA_SAATLERI, whatsappHref,
} from '../siteConfig'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Telefon numarasini yazilirken "0 (5XX) XXX XX XX" bicimine maskele.
const telefonFormatla = (val) => {
  let d = val.replace(/\D/g, '')
  if (d.startsWith('90')) d = d.slice(2)   // +90 / 90 onekini at
  if (d.startsWith('0')) d = d.slice(1)    // bastaki 0'i ayikla (grup basinda tekrar eklenir)
  d = d.slice(0, 10)
  let out = '0'
  if (d.length > 0) out += ' (' + d.slice(0, 3)
  if (d.length >= 3) out += ')'
  if (d.length > 3) out += ' ' + d.slice(3, 6)
  if (d.length > 6) out += ' ' + d.slice(6, 8)
  if (d.length > 8) out += ' ' + d.slice(8, 10)
  return out
}

// Gecerli TR numara: 0 ile baslayan 11 hane (cep + sabit hat).
const telefonGecerli = (val) => /^0\d{10}$/.test(val.replace(/\D/g, ''))

const Contact = () => {
  const sectionRef = useRef(null)
  const headerRef  = useRef(null)
  const infoRef    = useRef(null)
  const formRef    = useRef(null)

  const [ad, setAd]           = useState('')
  const [soyad, setSoyad]     = useState('')
  const [email, setEmail]     = useState('')
  const [telefon, setTelefon] = useState('')
  const [konu, setKonu]       = useState('')
  const [mesaj, setMesaj]     = useState('')
  const [telefonHata, setTelefonHata] = useState('')

  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [durum, setDurum]               = useState(null) // { ok: boolean, text: string }

  // Fade-up giris — header + bilgi kartlari + form ayni ritimde belirir.
  // Guvenlik agi: gozlemci herhangi bir sebeple tetiklenmezse form ASLA gizli
  // kalmasin (form sitenin ana donusum araci).
  useEffect(() => {
    const els = [headerRef.current, infoRef.current, formRef.current].filter(Boolean)
    const step = prefersReducedMotion() ? 0 : 110
    const timers = []
    const reveal = () =>
      els.forEach((el, i) => timers.push(setTimeout(() => el.classList.add('visible'), i * step)))
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { reveal(); obs.disconnect() }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    // Observer aksarsa 1.5s icinde her sey mutlaka gorunur olsun.
    const safety = setTimeout(() => {
      obs.disconnect()
      els.forEach((el) => el.classList.add('visible'))
    }, 1500)
    return () => { obs.disconnect(); clearTimeout(safety); timers.forEach(clearTimeout) }
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
    if (!telefonGecerli(telefon)) {
      setTelefonHata('Geçerli bir telefon numarası girin (örn. 0 (532) 123 45 67).')
      return
    }
    setGonderiliyor(true)
    setDurum(null)
    try {
      // Gonderim: 1) satisa lead, 2) musteriye konuya ozel otomatik yanit.
      await submitContact({ ad, soyad, telefon, email, konu, mesaj })
      setDurum({ ok: true, text: 'Talebiniz alındı. En kısa sürede size dönüş yapacağız.' })
      setAd(''); setSoyad(''); setEmail(''); setTelefon(''); setKonu(''); setMesaj(''); setTelefonHata('')
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
              id="c-telefon" className={`contact-input ${telefonHata ? 'hata' : ''}`}
              type="tel" required inputMode="tel" maxLength={19}
              value={telefon}
              onChange={(e) => { setTelefon(telefonFormatla(e.target.value)); if (telefonHata) setTelefonHata('') }}
              onBlur={() => setTelefonHata(telefon && !telefonGecerli(telefon) ? 'Geçerli bir telefon numarası girin (örn. 0 (532) 123 45 67).' : '')}
              autoComplete="tel" placeholder="0 (5__) ___ __ __"
            />
            {telefonHata && <span className="contact-field-error">{telefonHata}</span>}
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

      {/* İletişim bilgileri — degerler siteConfig.js'ten gelir (✦ süsünden sonra) */}
      <div ref={infoRef} className="contact-info fade-up">
        <a className="contact-info-item" href={TELEFON_HREF}>
          <span className="contact-info-icon" aria-hidden="true">📞</span>
          <span className="contact-info-body">
            <span className="contact-info-label">Telefon</span>
            <span className="contact-info-value">{TELEFON_GORUNEN}</span>
          </span>
        </a>

        <a className="contact-info-item" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
          <span className="contact-info-icon" aria-hidden="true">💬</span>
          <span className="contact-info-body">
            <span className="contact-info-label">WhatsApp</span>
            <span className="contact-info-value">Mesaj gönderin</span>
          </span>
        </a>

        <a className="contact-info-item" href={`mailto:${EPOSTA}`}>
          <span className="contact-info-icon" aria-hidden="true">✉️</span>
          <span className="contact-info-body">
            <span className="contact-info-label">E-posta</span>
            <span className="contact-info-value">{EPOSTA}</span>
          </span>
        </a>

        <div className="contact-info-item contact-info-static">
          <span className="contact-info-icon" aria-hidden="true">📍</span>
          <span className="contact-info-body">
            <span className="contact-info-label">Adres</span>
            <span className="contact-info-value">{ADRES}</span>
            <span className="contact-info-sub">{CALISMA_SAATLERI}</span>
          </span>
        </div>
      </div>

    </section>
  )
}

export default Contact
