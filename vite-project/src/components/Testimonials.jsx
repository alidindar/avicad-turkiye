import './Testimonials.css'
import Ornament from './Ornament'

// avicad.com'daki gerçek kullanıcı yorumları — Türkçeye çevrildi (isim/konum korunur).
// Bunlar AViCAD ürününün DÜNYA GENELİNDEKİ kullanıcı yorumlarıdır (AviCAD Türkiye'nin
// kendi müşterileri değil) — bölüm buna göre çerçevelenmiştir.
const YORUMLAR = [
  {
    baslik: 'Tıpkı AutoCAD gibi',
    metin:
      'Projelerim bittiğinde dosyayı kaydediyorum ve tıpkı AutoCAD’deki gibi danışmanlarımla paylaşabiliyorum. Bayıldım.',
    isim: 'Pete S',
    konum: 'GA, ABD',
  },
  {
    baslik: 'Gerçekten etkilendim!',
    metin:
      '50 yılı aşkın süredir CAD satıyor, eğitimini veriyor ve kullanıyorum. Intergraph, MicroStation, AutoCAD, Dassault derken… gerçekten etkilendim!',
    isim: 'John Murray',
    konum: '',
  },
  {
    baslik: 'Harika bir mühendislik yazılımı',
    metin:
      'Mühendislik projelerimi bitirmek için ihtiyacım olan tüm araçlar burada. Bu harika mühendislik yazılımı için teşekkürler.',
    isim: 'R Goodman',
    konum: 'PA, ABD',
  },
  {
    baslik: 'AutoCAD’den daha temiz',
    metin:
      'Bu yazılıma bayılıyorum. Hızlı açılıyor, AutoCAD’den daha hızlı ve temiz, gerçek işler için daha faydalı eklentileri var.',
    isim: 'Dan M',
    konum: 'GA, ABD',
  },
  {
    baslik: 'Her anından keyif alıyoruz',
    metin:
      'AViCAD’i ilk çıktığında aldık, o zamandan beri kullanıyoruz. “Koca A”nın pahalı güncellemelerinden kurtulduk, her anından keyif alıyoruz.',
    isim: 'Mark Simmons',
    konum: 'Verona, WI',
  },
  {
    baslik: 'Yine de tasarruf ediyorum',
    metin:
      'AViCAD’e geçerek biriktirdiğim parayla yeni bir CAD laptopu alıyorum — üstelik AutoCAD aboneliğine kıyasla hâlâ tasarruf ediyorum!',
    isim: 'Ralph S',
    konum: 'CA, ABD',
  },
]

// Yerel guven sinyalleri. Yorumlar dunya genelinden geldigi icin bolum Turk
// ziyaretciye uzak kaliyordu; buradaki uc madde o boslugu YEREL ve
// DOGRULANABILIR bilgiyle kapatir — ucu de sitenin baska yerlerinde (About,
// schema.org, tm-intro) zaten yazili olan iddialar. Musteri sayisi, pazar payi
// ya da hiz/benchmark gibi olculemeyen hicbir rakam BILEREK yok.
const GUVEN = [
  {
    id: 'distributor',
    baslik: 'Resmi Türkiye distribütörü',
    alt: 'Lisanslama ve faturalandırma doğrudan Türkiye’den yürür.',
  },
  {
    id: 'destek',
    baslik: 'Türkçe kurulum ve destek',
    alt: 'Kurulumdan eğitime, lisanslamadan teknik soruna kadar kendi dilinizde.',
  },
  {
    id: 'gecmis',
    baslik: '2010’dan beri AViCAD',
    alt: 'Dünya genelinde on yılı aşkın süredir kullanılan bir CAD çözümü.',
  },
]

// Section1'deki ikon setiyle ayni dil: 24x24, stroke=currentColor, dis istek yok.
const GUVEN_IKON = {
  distributor: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  destek: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
    </>
  ),
  gecmis: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}

const GuvenIkon = ({ id }) => (
  <svg
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false"
  >
    {GUVEN_IKON[id]}
  </svg>
)

const Testimonials = () => (
  <section id="referanslar" className="testimonials" aria-label="Kullanıcı yorumları">
    <header className="tm-header">
      <p className="tm-eyebrow">REFERANSLAR</p>
      <Ornament />
      <h2 className="tm-title">Kullanıcılar Ne Diyor?</h2>
      <p className="tm-intro">
        Dünya genelinde AViCAD kullanan mühendis, mimar ve tasarımcıların yorumları —
        2010’dan beri güvenilen AutoCAD alternatifi.
      </p>
    </header>

    <ul className="tm-grid">
      {YORUMLAR.map((y) => (
        <li key={y.isim} className="tm-card">
          <figure className="tm-fig">
            <span className="tm-quote-mark" aria-hidden="true">“</span>
            <blockquote className="tm-quote">
              <p className="tm-card-title">{y.baslik}</p>
              <p className="tm-text">{y.metin}</p>
            </blockquote>
            <figcaption className="tm-author">
              <span className="tm-name">{y.isim}</span>
              {y.konum && <span className="tm-loc">{y.konum}</span>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>

    <ul className="tm-guven">
      {GUVEN.map((g) => (
        <li key={g.id} className="tm-guven-oge">
          <span className="tm-guven-ikon"><GuvenIkon id={g.id} /></span>
          <div>
            <p className="tm-guven-baslik">{g.baslik}</p>
            <p className="tm-guven-alt">{g.alt}</p>
          </div>
        </li>
      ))}
    </ul>

    <p className="tm-note">AViCAD kullanıcı yorumları · avicad.com’dan çevrilmiştir.</p>
  </section>
)

export default Testimonials
