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

    <p className="tm-note">AViCAD kullanıcı yorumları · avicad.com’dan çevrilmiştir.</p>
  </section>
)

export default Testimonials
