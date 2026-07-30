import emailjs from '@emailjs/browser'

// ─── EmailJS ayarlari ─────────────────────────────────────────────────────────
// TODO: Bu 4 degeri EmailJS panelinden alip yapistirin (https://www.emailjs.com).
//   1) Hesap ac -> Email Services'e bir servis ekle (Gmail/SMTP)         -> SERVICE_ID
//   2) Account -> General -> Public Key                                  -> PUBLIC_KEY
//   3) Email Templates -> yeni sablon "Lead" (To: SATIS e-postaniz)      -> TEMPLATE_LEAD
//   4) Email Templates -> yeni sablon "Yanit" (To: {{email}})            -> TEMPLATE_REPLY
// Sablon degiskenleri: {{ad}} {{soyad}} {{ad_soyad}} {{telefon}} {{email}}
//   {{konu}} {{mesaj}}  ve yanit sablonunda ayrica {{oto_yanit}}
//
// ─── GUVENLIK: anahtarlari girerken BUNLARI DA YAP ───────────────────────────
// EmailJS tarayicidan calisir, yani asagidaki uc deger ZORUNLU OLARAK istemci
// bundle'inda yayinlanir. Bunlar sir degil (tasarim geregi acik) — ama "Yanit"
// sablonunun To alani {{email}}, yani ISTEK ATANIN belirledigi adres. Sunucu
// tarafi dogrulama ve hiz sinirlama da yok; honeypot yalnizca istemcide.
// Sonuc: bundle'dan degerleri okuyan biri API'yi dogrudan cagirip ISTEDIGI
// adrese, {{ad}}/{{soyad}}/{{mesaj}} alanlarini kendi metniyle doldurup
// e-posta gonderebilir. Iki somut zarar: (1) aylik kota tukenir ve gercek
// lead'ler SESSIZCE ulasmaz, (2) sirket adina ucuncu kisilere e-posta gider.
//
//   a) Account -> Security -> Allowed Origins: yalnizca avicadturkiye.com.tr
//      NOT: EmailJS bunu Origin basligindan dogruluyor; tarayici disi bir
//      istemci basligi taklit edebilir. Duvar degil, hiz kesici.
//   b) Sablonda EmailJS'in yerlesik CAPTCHA'sini AC — otomatik suistimale
//      karsi en etkili tekil onlem.
//   c) Panelden hiz siniri (rate limit) tanimla.
//   d) Kota uyarisi kur — kota dolarsa haberin olsun, yoksa lead kaybi
//      sessiz olur (bkz. 835122c'de duzeltilen ayni sinif hata).
//
// KALICI COZUM: Turkiye'de barinan kendi endpoint'in. Kimlik bilgisi sunucuda
// gizli kalir, dogrulama + hiz sinirlama sunucuda yapilir, {{email}}'e serbest
// gonderim ortadan kalkar. submitContact() imzasi ayni kaldigi surece
// Contact.jsx hic degismez.
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
    // Object.hasOwn: duz indeksleme prototip zinciri anahtarlarinda
    // (constructor, toString...) beklenmedik deger dondururdu.
    { ...p, oto_yanit: Object.hasOwn(OTO_YANIT, konu) ? OTO_YANIT[konu] : '' },
    { publicKey: EMAILJS_PUBLIC_KEY },
  )
}
