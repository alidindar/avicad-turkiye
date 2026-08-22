// ─── İletişim formu gönderimi ────────────────────────────────────────────────
// Gönderim artık kendi sunucumuzdaki `public/iletisim.php` üzerinden yapılıyor.
//
// Önceki kurulum EmailJS'ti ve üç değeri (public key, service id, template id)
// ZORUNLU olarak istemci bundle'ında yayınlıyordu. Bunlar tasarım gereği açık
// olsa da "Yanıt" şablonunun To alanı {{email}} — yani isteği atanın belirlediği
// adres — olduğu için bundle'ı okuyan biri şirket adına istediği kişiye e-posta
// gönderebiliyordu; üstelik sunucu tarafı doğrulama ve hız sınırı da yoktu.
//
// Kendi endpoint'imizde: kimlik bilgisi istemciye hiç inmiyor, doğrulama ve
// hız sınırı sunucuda, gönderim domainin kendi MTA'sı üzerinden (SPF uyumlu),
// veri Türkiye'de kalıyor. CSP'den de api.emailjs.com çıkarıldı.
//
// `submitContact` imzası BİLEREK korundu — Contact.jsx yalnızca bu fonksiyonu
// tanıyor, form/doğrulama/KVKK akışının hiçbiri değişmedi.

import { olcumFormOlayi } from './olcum.js'

// BASE_URL ile kuruluyor: vite.config.js `base` değeri değişirse (alt dizinde
// yayın) yol kendiliğinden doğru kalır.
const ENDPOINT = `${import.meta.env.BASE_URL}iletisim.php`

/**
 * İletişim formunu gönderir: satışa lead bildirimi + müşteriye konuya özel
 * otomatik yanıt (ikisini de sunucu yollar).
 * Başarısızlıkta Error fırlatır — Contact.jsx bunu yakalayıp ziyaretçiye
 * alternatif iletişim kanallarını gösteriyor.
 */
export async function submitContact({ ad, soyad, telefon, email, konu, mesaj }) {
  let yanit
  try {
    yanit = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad, soyad, telefon, email, konu, mesaj: mesaj || '—' }),
    })
  } catch (err) {
    // Ağ katmanı hatası (çevrimdışı, DNS, CORS). fetch yalnızca burada reject
    // eder; HTTP hata kodları aşağıda ele alınıyor.
    throw new Error(`Sunucuya ulaşılamadı: ${err.message}`, { cause: err })
  }

  // Gövde JSON olmayabilir (sunucu hata sayfası döndürdüyse) — patlamasın.
  let govde = null
  try {
    govde = await yanit.json()
  } catch {
    // JSON çözülemedi; govde null kalır ve aşağıdaki kontrol bunu ele alır.
  }

  if (!yanit.ok || !govde?.ok) {
    // Başarısız gönderimler de sayılıyor: sessiz lead kaybı bu projede daha
    // önce yaşandı (835122c). Sayaçta hata birikiyorsa haberimiz olmalı.
    olcumFormOlayi('hata')
    const hata = new Error(govde?.hata ?? `Gönderim başarısız (HTTP ${yanit.status}).`)

    // 422 (doğrulama) ve 429 (hız sınırı) metinleri ziyaretçi için yazıldı ve
    // EYLEME DÖNÜŞTÜRÜLEBİLİR: "Geçersiz e-posta adresi", "Çok sık gönderim,
    // biraz bekleyip tekrar deneyin". Bunları genel mesajın altında yutmak
    // ziyaretçiyi çıkmaza sokuyordu — hız sınırına takılan kişi "tekrar
    // deneyin" görüp tekrar deniyor ve yine sınıra çarpıyordu.
    // Diğer kodlarda (500/502/JSON gelmedi) sunucu metni teknik olabilir ya da
    // hiç olmayabilir; orada Contact.jsx kendi genel mesajını gösterir.
    if (yanit.status === 422 || yanit.status === 429) {
      hata.ziyaretciMesaji = govde?.hata ?? null
    }
    throw hata
  }

  olcumFormOlayi('basarili')
}
