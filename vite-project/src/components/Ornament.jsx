import './Ornament.css'

// Bölüm başlığı ✦ süsü (iki mavi çizgi + ✦). Stilleri kendi CSS'inden gelir.
const Ornament = () => (
  <div className="header-ornament" aria-hidden="true">
    <span className="ornament-line" />
    <span className="ornament-rune">✦</span>
    <span className="ornament-line" />
  </div>
)

export default Ornament
