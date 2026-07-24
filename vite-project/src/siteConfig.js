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

// wa.me linki — hazir mesajla birlikte.
export const whatsappHref = () =>
  `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(WHATSAPP_MESAJ)}`
