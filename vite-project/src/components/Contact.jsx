import { useEffect, useRef, useState } from 'react'
import './Contact.css'
import { submitContact } from '../emailService'
import {
  EPOSTA, ADRES, CALISMA_SAATLERI, whatsappHref,
} from '../siteConfig'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// İletisim bilgi ikonlari — site geneliyle tutarli cizgi-ikon (stroke=currentColor).
const ikon = (paths) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
       strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
)
const ICON = {
  phone: ikon(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.94.36 1.86.7 2.73a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.35-1.27a2 2 0 0 1 2.11-.45c.87.34 1.79.57 2.73.7A2 2 0 0 1 22 16.92z" />),
  chat: ikon(<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />),
  mail: ikon(<><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M21 6l-9 6.5L3 6" /></>),
  pin: ikon(<><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>),
}

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

// Demo indirmesi ARTIK SITEDEN BASLAMIYOR. Kurulum dosyasinin baglantisi
// yalnizca satis@'tan giden oto-yanit mailinde veriliyor; boylece her indirme
// dogrulanmis bir e-posta adresine bagli oluyor. Onceki surumde gizli bir <a>
// tiklamasiyla .exe dogrudan iniyordu.
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
  const [hp, setHp]           = useState('') // honeypot — botlar doldurur, insanlar gormez
  const [telefonHata, setTelefonHata] = useState('')

  // NOT: Burada bir "yurt disina aktarim acik rizasi" state'i vardi. Gonderim
  // kendi sunucumuza tasininca aktarim ortadan kalkti ve riza gereksizlesti
  // (2026-08-17). Aydinlatma metnine baglanti formda duruyor — o yukumluluk
  // rizadan bagimsiz.

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
    // Onceki gonderimin sonuc mesajini HEMEN temizle — guard'lardan ONCE.
    // Eskiden setDurum(null) guard'larin ALTINDAYDI; guard'a takilan gonderim
    // eski mesaji ekranda birakiyordu. Onceki mesaj bir BASARI mesajiysa ekran,
    // hicbir sey gonderilmemisken "Talebiniz alindi" diyordu (yesil basari +
    // kirmizi riza hatasi ayni anda gorunuyordu). Basarili gonderimden sonra
    // rizayi sifirladigimiz icin bu akis nadir bir kenar durum degil: ikinci
    // talebi gonderen kullanici dogrudan buraya dusuyor.
    // gonderiliyor kontrolunden SONRA: ucusta bir gonderim varken mesaji
    // silmek yanlis olurdu.
    setDurum(null)
    // Honeypot dolu → bot. Sessizce basari gibi davran, hicbir sey gonderme.
    if (hp) {
      setDurum({ ok: true, text: 'Talebiniz alındı. En kısa sürede size dönüş yapacağız.' })
      return
    }
    if (!telefonGecerli(telefon)) {
      setTelefonHata('Geçerli bir telefon numarası girin (örn. 0 (532) 123 45 67).')
      return
    }
    const demoTalebi = konu === 'Demo Talebi'
    setGonderiliyor(true)

    // Lead yakalama (satisa bildirim + musteriye oto-yanit). Demo indirmesi
    // buna bagli DEGIL.
    let leadOk = true
    let sunucuMesaji = null
    let sonuc = null
    try {
      sonuc = await submitContact({ ad, soyad, telefon, email, konu, mesaj })
    } catch (err) {
      leadOk = false
      // Dogrulama/hiz siniri mesajlari ziyaretciye AYNEN gosterilir; sunucu
      // ne yapmasi gerektigini zaten soyluyor ("biraz bekleyip tekrar deneyin").
      // Digerlerinde null kalir ve asagidaki genel mesaj devreye girer.
      sunucuMesaji = err.ziyaretciMesaji ?? null
      // Sessizce yutma: tek teshis izi bu. Ziyaretci konsolu gormez ama
      // saha hatasi bildirildiginde sebebi buradan okunur.
      console.error('[iletisim] Lead gönderilemedi:', err)
    }

    // ONEMLI: basari mesaji YALNIZCA lead gercekten gittiyse gosterilir.
    // Eskiden kosul `demoTalebi || leadOk` idi; demo talebinde e-posta
    // basarisiz olsa bile "Talebiniz alindi" yazip formu temizliyordu ->
    // ziyaretci kaydoldugunu saniyor, satisa hicbir sey ulasmiyordu
    // (sitenin en degerli donusumunde sessiz lead kaybi).
    if (leadOk) {
      // Demo indirmesi artik yalnizca oto-yanit mailindeki baglantiyla
      // yapiliyor. O mail gitmediyse ziyaretcinin elinde HICBIR SEY kalmiyor,
      // bu yuzden "gonderdik" demek yerine alternatif kanal veriyoruz.
      const yanitGitti = sonuc?.otoYanit !== false
      setDurum({
        ok: yanitGitti,
        text: demoTalebi
          ? (yanitGitti
              ? 'Talebiniz alındı. Demo indirme bağlantısını e-posta adresinize gönderdik — gelen kutunuzu (gerekirse spam klasörünü) kontrol edin.'
              : `Talebiniz alındı, ancak indirme bağlantısını içeren e-postayı gönderemedik. WhatsApp'tan yazın ya da ${EPOSTA} adresine e-posta atın, bağlantıyı hemen iletelim.`)
          : (yanitGitti
              ? 'Talebiniz alındı. En kısa sürede size dönüş yapacağız.'
              : 'Talebiniz alındı, en kısa sürede size dönüş yapacağız. (Onay e-postası gönderilemedi, talebiniz bize ulaştı.)'),
      })
      // Form yalnizca basarida temizlenir; hatada girilen veri korunur ki
      // ziyaretci bastan yazmak zorunda kalmadan tekrar deneyebilsin.
      setAd(''); setSoyad(''); setEmail(''); setTelefon(''); setKonu(''); setMesaj(''); setTelefonHata('')
    } else {
      // "Telefonla arayın" DEMİYORUZ: telefon numarası 944ecfb ile görünür
      // bloklardan kaldırıldı, sayfada hiçbir yerde yazmıyor. Ziyaretçiyi
      // bulamayacağı bir kanala yönlendirmek çıkmaz sokaktı. WhatsApp ve
      // e-posta iletişim kartlarında duruyor, ikisi de tıklanabilir.
      setDurum({
        ok: false,
        text: sunucuMesaji
          ?? `Gönderilemedi. Lütfen tekrar deneyin ya da WhatsApp'tan veya ${EPOSTA} adresinden bize ulaşın.`,
      })
    }
    setGonderiliyor(false)
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
        {/* Honeypot — gizli; yalnizca botlar doldurur */}
        <input
          type="text" name="website" className="contact-hp" tabIndex={-1}
          autoComplete="off" aria-hidden="true"
          value={hp} onChange={(e) => setHp(e.target.value)}
        />
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

        {/* Acik riza KUTUSU kaldirildi (2026-08-17): gonderim EmailJS'ten
            (ABD) kendi sunucumuza tasindi, yurt disina aktarim ortadan kalkti,
            dolayisiyla KVKK m.9 rizasinin dayanagi kalmadi. Dayanagi olmayan
            riza toplamak hem gereksiz bir donusum engeli hem de yanlis.

            AMA aydinlatma yukumlulugu (m.10) rizadan BAGIMSIZ olarak devam
            ediyor — form hala kisisel veri topluyor. Bu yuzden metne baglanti
            burada KALIYOR; giden yalnizca onay kutusu. Bunu "kabul ediyorum"
            ifadesine cevirmeyin: bilgilendirme rizaya benzemeye baslarsa
            ortuk riza gorunumu dogar. */}
        <div className="contact-field contact-consent">
          <p className="contact-consent-note">
            Kişisel verileriniz yalnızca talebinizin karşılanması amacıyla{' '}
            <button
              type="button" className="contact-consent-link"
              onClick={() => window.dispatchEvent(new CustomEvent('kvkk-ac'))}
            >
              KVKK Aydınlatma Metni
            </button>{' '}
            kapsamında işlenir ve <strong>yurt dışına aktarılmaz</strong>.
          </p>
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
        {/* Telefon kartı kullanıcı isteğiyle kaldırıldı. WhatsApp + E-posta +
            Adres üç öğe kaldı; ızgara kendiliğinden yeniden dizilir. Telefon
            numarası WhatsApp ve tel: linkiyle floating buton üzerinden hâlâ
            erişilebilir, sadece bu blokta görünmüyor. */}
        <a className="contact-info-item" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
          <span className="contact-info-icon" aria-hidden="true">{ICON.chat}</span>
          <span className="contact-info-body">
            <span className="contact-info-label">WhatsApp</span>
            <span className="contact-info-value">Mesaj gönderin</span>
          </span>
        </a>

        <a className="contact-info-item" href={`mailto:${EPOSTA}`}>
          <span className="contact-info-icon" aria-hidden="true">{ICON.mail}</span>
          <span className="contact-info-body">
            <span className="contact-info-label">E-posta</span>
            <span className="contact-info-value">{EPOSTA}</span>
          </span>
        </a>

        <div className="contact-info-item contact-info-static">
          <span className="contact-info-icon" aria-hidden="true">{ICON.pin}</span>
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
