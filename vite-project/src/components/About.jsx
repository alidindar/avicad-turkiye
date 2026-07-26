import './About.css'
import Ornament from './Ornament'

const HIGHLIGHTS = [
  'Resmi Türkiye Distribütörü',
  'Yerel & Türkçe Destek',
  'Kurulumdan Eğitime Yanınızda',
]

const About = () => (
  <section id="hakkimizda" className="about" aria-label="Hakkımızda">
    <div className="about-inner">
      <header className="about-header">
        <p className="about-eyebrow">HAKKIMIZDA</p>
        <Ornament />
        <h2 className="about-title">AviCAD Türkiye</h2>
      </header>

      <div className="about-body">
        <p className="about-lead">
          2026'da kurulan AviCAD Türkiye, DWG uyumlu profesyonel CAD yazılımı AViCAD'in
          resmi Türkiye distribütörüdür. Amacımız; mühendis, mimar ve tasarımcılara pahalı
          lisans yükü olmadan güçlü ve tanıdık bir CAD çözümü sunmak.
        </p>
        <p>
          AViCAD, AutoCAD'e alternatif olarak tasarlanmış, .dwg ve .dxf dosyalarını
          dönüştürmeden açan, tanıdık komut ve arayüze sahip bir 2B/3B CAD yazılımıdır.
          Kalıcı lisans seçeneğiyle sonu gelmeyen abonelik yükünü ortadan kaldırır.
        </p>
        <p>
          2010'dan beri dünya genelinde güvenilen AViCAD'i Türkiye'ye getiriyoruz. 10 kişilik
          yerel satış ve destek ekibimizle kurulumdan lisanslamaya, eğitimden teknik desteğe
          kadar tüm süreçlerde — her aşamada yerel ve Türkçe — yanınızdayız.
        </p>
      </div>

      <ul className="about-stats" aria-label="AviCAD Türkiye rakamlarla">
        <li className="about-stat">
          <span className="about-stat-num">2026</span>
          <span className="about-stat-label">Kuruluş</span>
        </li>
        <li className="about-stat">
          <span className="about-stat-num">10</span>
          <span className="about-stat-label">Kişilik Türkiye Ekibi</span>
        </li>
        <li className="about-stat">
          <span className="about-stat-num">2010</span>
          <span className="about-stat-label">'dan beri AViCAD</span>
        </li>
      </ul>

      <ul className="about-highlights">
        {HIGHLIGHTS.map((h) => (
          <li key={h} className="about-hl">
            <span className="about-hl-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </span>
            {h}
          </li>
        ))}
      </ul>
    </div>
  </section>
)

export default About
