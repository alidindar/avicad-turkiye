import { useEffect, useRef, useState } from 'react'
import './Footer.css'
import {
  TELEFON_GORUNEN, TELEFON_HREF, EPOSTA, ADRES,
  whatsappHref, YASAL_UNVAN, VERBIS_NO,
} from '../siteConfig'

const scrollToId = (id) => {
  if (id === 'top') { window.scrollTo({ top: 0, behavior: 'auto' }); return }
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' })
}

// Yasal metinler — TASLAK. Yasal alanlar siteConfig placeholder'larindan gelir;
// kullanici doldurup bir hukukçuya onaylatmali.
const legalMetinleri = () => ({
  kvkk: {
    baslik: 'KVKK Aydınlatma Metni',
    govde: [
      `Veri Sorumlusu: ${YASAL_UNVAN} ("AviCAD Türkiye"). Adres: ${ADRES}. VERBİS: ${VERBIS_NO}.`,
      'İşlenen Kişisel Veriler: İletişim/demo formu aracılığıyla ilettiğiniz ad-soyad, telefon numarası, e-posta adresi ve mesaj içeriği.',
      'İşleme Amaçları: Fiyat teklifi, demo ve destek taleplerinizin karşılanması; satış, kurulum ve müşteri ilişkileri süreçlerinin yürütülmesi; sizinle iletişime geçilmesi.',
      'Hukuki Sebep: 6698 sayılı KVKK m.5 uyarınca, talebinizi iletmek için formu doldurmanızla verdiğiniz açık rıza ve ilgili meşru menfaat.',
      'Aktarım: Verileriniz, form gönderimlerini iletmek için kullanılan e-posta altyapısı hizmet sağlayıcısı (EmailJS) aracılığıyla işlenir; yasal yükümlülükler dışında üçüncü kişilerle paylaşılmaz.',
      `Haklarınız (KVKK m.11): Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve diğer haklarınız için ${EPOSTA} adresine başvurabilirsiniz.`,
      'Saklama Süresi: Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır.',
    ],
  },
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    govde: [
      'AviCAD Türkiye olarak gizliliğinize önem veriyoruz. Bu politika, web sitemiz üzerinden hangi verileri topladığımızı ve nasıl kullandığımızı açıklar.',
      'Topladığımız Veriler: Yalnızca iletişim/demo formunu doldurduğunuzda ilettiğiniz ad-soyad, telefon, e-posta ve mesaj bilgileri.',
      'Kullanım: Bu bilgiler yalnızca talebinizi karşılamak, size demo/fiyat/destek konusunda dönüş yapmak ve sizinle iletişim kurmak için kullanılır; pazarlama amacıyla üçüncü kişilere satılmaz.',
      'Üçüncü Taraf Hizmetler: Form gönderimleri, e-posta iletimi için EmailJS hizmeti üzerinden iletilir.',
      'Çerezler: Sitemiz yalnızca çalışması için gerekli minimum tarayıcı depolamasını kullanır; üçüncü taraf reklam/takip çerezi kullanılmaz.',
      `İletişim: Verilerinizle ilgili talepleriniz için ${EPOSTA} adresinden bize ulaşabilirsiniz.`,
    ],
  },
})

const Footer = () => {
  const [modal, setModal] = useState(null) // 'kvkk' | 'gizlilik' | null
  const modalRef = useRef(null)
  const oncekiFocus = useRef(null)
  const yil = new Date().getFullYear()
  const LEGAL = legalMetinleri()

  // Modal acikken: arka plan scroll kilidi + focus yonetimi (Esc/Tab trap).
  useEffect(() => {
    if (!modal) return
    oncekiFocus.current = document.activeElement
    const oncekiOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = modalRef.current
    panel?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { setModal(null); return }
      if (e.key === 'Tab' && panel) {
        const odak = panel.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')
        if (odak.length === 0) { e.preventDefault(); return }
        const ilk = odak[0], son = odak[odak.length - 1]
        if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus() }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus() }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = oncekiOverflow
      oncekiFocus.current?.focus?.()
    }
  }, [modal])

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col footer-brand">
          <div className="footer-logo">
            <img className="footer-logo-img" src={`${import.meta.env.BASE_URL}logo.png`} alt="AviCAD Türkiye" />
            <span className="footer-logo-text">AviCAD Türkiye</span>
          </div>
          <p className="footer-blurb">
            DWG uyumlu profesyonel 2B/3B CAD çözümü. AviCAD'in resmi Türkiye distribütörü.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-head">Menü</h4>
          <ul className="footer-links">
            <li><button type="button" onClick={() => scrollToId('top')}>Anasayfa</button></li>
            <li><button type="button" onClick={() => scrollToId('neden-avicad')}>Neden AviCAD?</button></li>
            <li><button type="button" onClick={() => scrollToId('hakkimizda')}>Hakkımızda</button></li>
            <li><button type="button" onClick={() => scrollToId('iletisim')}>İletişim</button></li>
            <li><button type="button" onClick={() => scrollToId('sss')}>SSS</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-head">İletişim</h4>
          <ul className="footer-links">
            <li><a href={TELEFON_HREF}>{TELEFON_GORUNEN}</a></li>
            <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href={`mailto:${EPOSTA}`}>{EPOSTA}</a></li>
            <li className="footer-adres">{ADRES}</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal-links">
          <button type="button" onClick={() => setModal('kvkk')}>KVKK Aydınlatma Metni</button>
          <span className="footer-sep" aria-hidden="true">·</span>
          <button type="button" onClick={() => setModal('gizlilik')}>Gizlilik Politikası</button>
        </div>
        <p className="footer-copy">© {yil} AviCAD Türkiye. Tüm hakları saklıdır.</p>
      </div>

      {modal && (
        <div className="footer-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="footer-modal"
            ref={modalRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label={LEGAL[modal].baslik}
          >
            <button className="footer-modal-close" type="button" onClick={() => setModal(null)} aria-label="Kapat">×</button>
            <h3 className="footer-modal-title">{LEGAL[modal].baslik}</h3>
            <div className="footer-modal-body">
              {LEGAL[modal].govde.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer
