import { useEffect, useRef, useState } from 'react'
import './Footer.css'
import {
  TELEFON_GORUNEN, TELEFON_HREF, EPOSTA, ADRES,
  whatsappHref, YASAL_UNVAN,
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
      // Madde sirasi "Aydinlatma Yukumlulugunun Yerine Getirilmesinde Uyulacak
      // Usul ve Esaslar Hakkinda Teblig" (RG 10.03.2018/30356) m.4'un asgari
      // unsurlarina gore kuruldu: (a) veri sorumlusunun kimligi, (b) isleme
      // amaci, (c) kimlere/hangi amacla aktarilabilecegi, (c-cedil) toplama
      // YONTEMI ve hukuki sebebi, (d) m.11 haklari.
      //
      // VERBIS satiri bilerek yok — sirket kayit yukumlulugunden istisna
      // (gerekce: siteConfig.js). Eksik saniip geri eklemeyin.
      `Veri Sorumlusu: ${YASAL_UNVAN} ("AviCAD Türkiye"). Adres: ${ADRES}. E-posta: ${EPOSTA}. Telefon: ${TELEFON_GORUNEN}.`,
      'İşlenen Kişisel Veriler: İletişim/demo formu aracılığıyla ilettiğiniz ad-soyad, telefon numarası, e-posta adresi ve mesaj içeriği.',
      'İşleme Amaçları: Fiyat teklifi, demo ve destek taleplerinizin karşılanması; satış, kurulum ve müşteri ilişkileri süreçlerinin yürütülmesi; sizinle iletişime geçilmesi.',
      // Teblig m.4/(c-cedil): TOPLAMA YONTEMI onceki metinde hic yoktu.
      // Hukuki sebep de duzeltildi: eskiden "formu doldurmanizla verdiginiz
      // acik riza VE ilgili mesru menfaat" deniyordu — hem ayni isleme icin iki
      // sebep birden gosteriyordu, hem de acik rizayi aydinlatma metninin
      // ICINE gomuyordu. Teblig m.5 ve Kurul 2018/90 karari ikisinin AYRI AYRI
      // yerine getirilmesini zorunlu kiliyor. Yurt ici isleme artik rizaya
      // DEGIL, m.5/2-(c) ve m.5/2-(f)'ye dayaniyor; boylece hizmet acik riza
      // sartina baglanmis olmuyor (bkz. Kurul 2023/1041).
      'Toplama Yöntemi ve Hukuki Sebep: Kişisel verileriniz, internet sitemizdeki iletişim/demo formunu doldurmanız yoluyla, tamamen otomatik olmayan yollarla ve elektronik ortamda toplanır. Hukuki sebep, 6698 sayılı KVKK m.5/2-(c) uyarınca talebinizle kurulacak sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması ile m.5/2-(f) uyarınca meşru menfaatimizdir; bu işleme açık rızanıza dayanmaz.',
      // Teblig m.4/(c): "kimlere VE hangi amacla" ayrik yaziliyor.
      //
      // 2026-08-17: Form gonderimi EmailJS'ten (ABD) kendi sunucumuza tasindi.
      // Yurt disina aktarim ORTADAN KALKTI; dolayisiyla KVKK m.9 acik rizasi
      // da gereksizlesti ve formdaki riza kutusu kaldirildi. Bu maddeyi eski
      // haline dondurmeyin — metin gercek altyapiyi anlatmali.
      'Aktarım: Kişisel verileriniz yurt dışına aktarılmaz. Form gönderimleriniz doğrudan Türkiye’de bulunan kendi sunucumuza iletilir ve yalnızca satış ekibimize ulaştırılır. Barındırma hizmeti aldığımız yurt içi hizmet sağlayıcımız verilere, yalnızca altyapı hizmetinin gerektirdiği ölçüde ve veri işleyen sıfatıyla erişebilir. Bunun dışında verileriniz, yasal yükümlülükler saklı kalmak üzere üçüncü kişilerle paylaşılmaz.',
      `Haklarınız (KVKK m.11): Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işleme amacını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini veya yok edilmesini isteme, işleme faaliyetine itiraz etme ve zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı ${EPOSTA} adresine iletebilirsiniz.`,
      'Saklama Süresi: Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır; bu sürelerin sonunda silinir, yok edilir veya anonim hâle getirilir.',
    ],
  },
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    govde: [
      'AviCAD Türkiye olarak gizliliğinize önem veriyoruz. Bu politika, web sitemiz üzerinden hangi verileri topladığımızı ve nasıl kullandığımızı açıklar.',
      'Topladığımız Veriler: Yalnızca iletişim/demo formunu doldurduğunuzda ilettiğiniz ad-soyad, telefon, e-posta ve mesaj bilgileri.',
      'Kullanım: Bu bilgiler yalnızca talebinizi karşılamak, size demo/fiyat/destek konusunda dönüş yapmak ve sizinle iletişim kurmak için kullanılır; pazarlama amacıyla üçüncü kişilere satılmaz.',
      // KVKK metnindeki "Aktarim" maddesiyle AYNI bilgiyi vermeli; iki metin
      // celismesin. Ikisi de 2026-08-17'de kendi sunucumuza gecise gore
      // guncellendi.
      'Üçüncü Taraf Hizmetler: Form gönderimleri üçüncü taraf bir servise değil, doğrudan Türkiye’de bulunan kendi sunucumuza iletilir; verileriniz yurt dışına aktarılmaz. Sitede reklam veya takip amaçlı üçüncü taraf hizmeti kullanılmaz.',
      'Çerezler: Sitemiz yalnızca çalışması için gerekli minimum tarayıcı depolamasını kullanır; üçüncü taraf reklam/takip çerezi kullanılmaz.',
      // Onizleme gorseli artik kendi sunucumuzda, dolayisiyla sayfa acilisinda
      // ucuncu taraf istegi yok. Ancak oynat'a basilinca YouTube devreye
      // giriyor; metinde hic gecmiyordu, eklendi.
      'Video İçeriği: Tanıtım videosunun önizleme görseli kendi sunucumuzdan yüklenir; sayfayı açtığınızda YouTube ile herhangi bir bağlantı kurulmaz. Videoyu oynatmak için tıkladığınızda, gelişmiş gizlilik modundaki YouTube oynatıcısı (youtube-nocookie.com) yüklenir ve bu noktadan sonra YouTube kendi koşullarını uygular.',
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

  // Iletisim formundaki acik riza onay kutusunun etiketi buradan KVKK metnini
  // acar. Bilesenler arasi dogrudan bag kurmamak icin Hero -> Contact'ta
  // kullanilan ayni CustomEvent deseni ('konu-sec') izleniyor.
  useEffect(() => {
    const ac = () => setModal('kvkk')
    window.addEventListener('kvkk-ac', ac)
    return () => window.removeEventListener('kvkk-ac', ac)
  }, [])

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
            <img className="footer-logo-img" src={`${import.meta.env.BASE_URL}logo.webp`}
                 width="144" height="147" alt="AviCAD Türkiye" />
            <span className="footer-logo-text">AviCAD Türkiye</span>
          </div>
          <p className="footer-blurb">
            DWG uyumlu profesyonel 2B/3B CAD çözümü. AviCAD'in resmi Türkiye distribütörü.
          </p>
        </div>

        <div className="footer-col">
          {/* h4 -> h3: sayfadaki son baslik h2 idi, h4'e atlamak hiyerarsiyi
              kiriyordu (2 -> 4). Stil sinif tabanli, etiket degisimi guvenli. */}
          <h3 className="footer-head">Menü</h3>
          <ul className="footer-links">
            <li><button type="button" onClick={() => scrollToId('top')}>Anasayfa</button></li>
            <li><button type="button" onClick={() => scrollToId('neden-avicad')}>Neden AviCAD?</button></li>
            <li><button type="button" onClick={() => scrollToId('hakkimizda')}>Hakkımızda</button></li>
            <li><button type="button" onClick={() => scrollToId('iletisim')}>İletişim</button></li>
            <li><button type="button" onClick={() => scrollToId('sss')}>SSS</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-head">İletişim</h3>
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
            role="dialog" aria-modal="true" aria-labelledby="footer-modal-baslik"
          >
            {/* Baslik + kapatma KAYDIRMAYAN satirda: × her kaydirma
                konumunda erisilebilir kalir (bkz. Footer.css). */}
            <div className="footer-modal-head">
              <h3 className="footer-modal-title" id="footer-modal-baslik">{LEGAL[modal].baslik}</h3>
              <button className="footer-modal-close" type="button" onClick={() => setModal(null)} aria-label="Kapat">×</button>
            </div>
            <div className="footer-modal-scroll">
              <div className="footer-modal-body">
                {LEGAL[modal].govde.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer
