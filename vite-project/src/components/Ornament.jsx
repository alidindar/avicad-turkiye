// Bölüm başlığı ✦ süsü (iki altın çizgi + ✦). Section1/Contact ile birebir aynı;
// global .header-ornament/.ornament-line/.ornament-rune stillerini kullanır.
const Ornament = () => (
  <div className="header-ornament" aria-hidden="true">
    <span className="ornament-line" />
    <span className="ornament-rune">✦</span>
    <span className="ornament-line" />
  </div>
)

export default Ornament
