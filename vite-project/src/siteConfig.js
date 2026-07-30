// ─── AviCAD Türkiye — iletişim bilgileri (tek kaynak) ────────────────────────
// TODO: Placeholder degerleri gercekleriyle degistirin. Hem yuzen WhatsApp
//   butonu (WhatsAppFab) hem Contact bilgi blogu buradan okur.
//   - TELEFON_HREF ve WHATSAPP_NUMARA yalnizca rakam/+ icermeli (link icin).
//   - TELEFON_GORUNEN ekranda gosterilen bicim (bosluk/parantez serbest).

export const TELEFON_GORUNEN   = '+90 (536) 928 00 59'
export const TELEFON_HREF      = 'tel:+905369280059'   // sadece + ve rakam
export const WHATSAPP_NUMARA   = '905369280059'        // wa.me icin sadece rakam (bassiz 0 yok)
export const WHATSAPP_MESAJ    = 'Merhaba, AviCAD hakkında bilgi almak istiyorum.'
export const EPOSTA            = 'info@avicadturkiye.com.tr'
export const ADRES             = 'İstanbul, Türkiye'
export const CALISMA_SAATLERI  = 'Hafta içi 09:00 – 18:00'

// Konu "Demo Talebi" secilip form gonderilince baslatilan demo kurulum indirmesi.
export const DEMO_INDIRME_URL  = 'https://avicad.com/dloads/AviCAD-Download.exe'

// KVKK / yasal (footer + aydinlatma metni).
// TODO: Ticaret sicilinde KAYITLI TAM UNVANI yazin — marka adi ("AviCAD
//   Turkiye") degil, tescilli unvan (or. "... Sanayi ve Ticaret Limited
//   Sirketi"). Kaynak: vergi levhasi / MERSIS (mersis.ticaret.gov.tr) /
//   Ticaret Sicili Gazetesi kurulus ilani; en hizlisi mali musavire sormak.
//   Aydinlatma metni bunu `${YASAL_UNVAN} ("AviCAD Turkiye")` diye kuruyor.
export const YASAL_UNVAN = '[YASAL ÜNVAN]'

// VERBIS NUMARASI BILEREK YOK — eksik degil.
// Kayit yukumlulugunden istisna kriterleri (2026, ucu birlikte saglanmali):
// yillik calisan < 50, yillik mali bilanco < 100 milyon TL, ana faaliyet
// konusu ozel nitelikli veri islemek degil. Bu sirket ucunu de karsiliyor
// (10 kisilik ekip; form yalnizca ad-soyad/telefon/e-posta/mesaj topluyor,
// ozel nitelikli veri yok), dolayisiyla VERBIS kaydi gerekmiyor ve aydinlatma
// metninde VERBIS satiri hic gecmiyor. Olmayan bir numara icin placeholder
// birakmak oldugundan kotu gorunur.
// Kriterler kumulatif: calisan sayisi 50'ye ULASIRSA ya da bilanco 100M TL'yi
// GECERSE yukumluluk dogar; o zaman burasi yeniden eklenmeli.

// Karsilastirma fiyatlari — resmi liste fiyatlari (USD), kisi basi / yil.
// Kaynak: AViCAD $449/yil (avicad.com), AutoCAD ~$1865/yil (Autodesk liste).
// TODO: Turkiye ₺ satis fiyatiniz farkliysa bu rakamlari + PARA_BIRIMI'ni guncelleyin.
export const PARA_BIRIMI    = '$'
export const AVICAD_YILLIK  = 449    // AViCAD yillik abonelik
export const AUTOCAD_YILLIK = 1865   // AutoCAD yillik abonelik

// wa.me linki — hazir mesajla birlikte.
export const whatsappHref = () =>
  `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(WHATSAPP_MESAJ)}`
