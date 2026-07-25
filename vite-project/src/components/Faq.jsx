import { useState } from 'react'
import './Faq.css'
import Ornament from './Ornament'

// SSS içeriği — TASLAK (AViCAD'in gerçek özelliklerine dayalı; kullanıcı düzenler).
const SORULAR = [
  {
    soru: 'Mevcut AutoCAD (.dwg) dosyalarım AViCAD’de sorunsuz açılır mı?',
    cevap:
      'Evet. AViCAD, .dwg ve .dxf dosyalarını dönüştürmeye gerek kalmadan doğrudan açar ve kaydeder; katmanlarınız, bloklarınız ve çizim geometriniz olduğu gibi korunur. İş ortaklarınızla dosya paylaşımınız kesintisiz devam eder.',
  },
  {
    soru: 'AutoCAD’den geçiş zor mu? Ekibimin yeniden eğitim alması gerekir mi?',
    cevap:
      'Hayır. Komut satırı, kısayollar ve menüler AutoCAD’e çok benzer; ekibiniz çoğu zaman ek eğitime ihtiyaç duymadan ilk günden verimli çalışmaya başlar.',
  },
  {
    soru: 'Lisans modeli nasıl — kalıcı mı, abonelik mi?',
    cevap:
      'İkisi de mevcut. Dilerseniz tek seferlik ödemeyle kalıcı (süresiz) lisans alır, dilerseniz yıllık ya da aylık abonelik seçersiniz. AutoCAD’in aksine abonelik zorunlu değildir.',
  },
  {
    soru: 'Satın almadan önce deneyebilir miyim?',
    cevap:
      'Evet. AViCAD’i 30 gün boyunca ücretsiz ve taahhütsüz deneyebilirsiniz. Sayfadaki “Ücretsiz Deneme” butonundan talep oluşturmanız yeterli; ekibimiz kurulumda size yardımcı olur.',
  },
  {
    soru: 'Destek Türkçe mi ve nereden alıyorum?',
    cevap:
      'Evet. AviCAD Türkiye distribütörü olarak kurulumdan lisanslamaya, teknik sorulardan eğitime kadar tüm süreçlerde yerel ve Türkçe destek sağlıyoruz.',
  },
  {
    soru: 'AViCAD hem 2B çizim hem 3B modelleme yapıyor mu?',
    cevap:
      'Evet. Teknik 2B çizimden 3B modellemeye kadar mimari, makine ve mühendislik projelerinizi tek bir yazılımda tamamlayabilirsiniz.',
  },
]

const Faq = () => {
  const [acik, setAcik] = useState({}) // { index: true }
  const toggle = (i) => setAcik((s) => ({ ...s, [i]: !s[i] }))

  return (
    <section id="sss" className="faq" aria-label="Sıkça sorulan sorular">
      <header className="faq-header">
        <p className="faq-eyebrow">SIK SORULANLAR</p>
        <Ornament />
        <h2 className="faq-title">Sıkça Sorulan Sorular</h2>
      </header>

      <div className="faq-list">
        {SORULAR.map((q, i) => {
          const open = !!acik[i]
          return (
            <div key={i} className={`faq-item ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => toggle(i)}
                aria-expanded={open}
                aria-controls={`faq-a-${i}`}
              >
                <span>{q.soru}</span>
                <span className="faq-icon" aria-hidden="true" />
              </button>
              {open && (
                <div className="faq-answer" id={`faq-a-${i}`} role="region">
                  <p>{q.cevap}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Faq
