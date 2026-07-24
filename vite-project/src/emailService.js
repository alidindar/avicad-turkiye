import emailjs from '@emailjs/browser'

// ─── EmailJS ayarlari ─────────────────────────────────────────────────────────
// TODO: Bu 4 degeri EmailJS panelinden alip yapistirin (https://www.emailjs.com).
//   1) Hesap ac -> Email Services'e bir servis ekle (Gmail/SMTP)         -> SERVICE_ID
//   2) Account -> General -> Public Key                                  -> PUBLIC_KEY
//   3) Email Templates -> yeni sablon "Lead" (To: SATIS e-postaniz)      -> TEMPLATE_LEAD
//   4) Email Templates -> yeni sablon "Yanit" (To: {{email}})            -> TEMPLATE_REPLY
// Sablon degiskenleri: {{ad}} {{soyad}} {{ad_soyad}} {{telefon}} {{email}}
//   {{konu}} {{mesaj}}  ve yanit sablonunda ayrica {{oto_yanit}}
export const EMAILJS_PUBLIC_KEY     = 'YOUR_PUBLIC_KEY'
export const EMAILJS_SERVICE_ID     = 'YOUR_SERVICE_ID'
export const EMAILJS_TEMPLATE_LEAD  = 'YOUR_TEMPLATE_LEAD'   // -> satisa bildirim
export const EMAILJS_TEMPLATE_REPLY = 'YOUR_TEMPLATE_REPLY'  // -> musteriye oto-yanit

// Konuya ozel otomatik yanit metinleri (musteriye gider).
const OTO_YANIT = {
  'Fiyat Talebi':
    'Fiyat teklifi talebiniz bize ulaştı. Satış ekibimiz, ihtiyaçlarınıza uygun paket ve fiyat bilgisiyle en kısa sürede sizi arayacak.',
  'Demo Talebi':
    '30 günlük ücretsiz demo talebiniz alındı. Kurulum ve deneme süreci için ekibimiz kısa süre içinde sizinle iletişime geçecek.',
  'Destek Talebi':
    'Destek talebiniz bize ulaştı. Konuyla ilgili ekibimiz en kısa sürede size dönüş yapacak.',
}

// Konfigure edilmemisse (placeholder degerler) gercek istek atmadan hata don.
const yapilandirildi = () =>
  EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' &&
  EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
  EMAILJS_TEMPLATE_LEAD !== 'YOUR_TEMPLATE_LEAD' &&
  EMAILJS_TEMPLATE_REPLY !== 'YOUR_TEMPLATE_REPLY'

// İletisim formu gonderimi:
//   1) satisa lead bildirimi, 2) musteriye konuya ozel otomatik yanit.
export async function submitContact({ ad, soyad, telefon, email, konu, mesaj }) {
  if (!yapilandirildi()) {
    throw new Error('EmailJS henüz yapılandırılmadı (emailService.js içindeki 4 değeri girin).')
  }
  const p = {
    ad,
    soyad,
    ad_soyad: `${ad} ${soyad}`.trim(),
    telefon,
    email,
    konu,
    mesaj: mesaj || '—',
  }
  // 1) Satisa bildirim (To alani panelde satis e-postasina ayarli)
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_LEAD, p, {
    publicKey: EMAILJS_PUBLIC_KEY,
  })
  // 2) Musteriye konuya ozel otomatik yanit (To alani panelde {{email}}'e ayarli)
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_REPLY,
    { ...p, oto_yanit: OTO_YANIT[konu] || '' },
    { publicKey: EMAILJS_PUBLIC_KEY },
  )
}
