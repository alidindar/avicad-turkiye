// ─── AviCAD Türkiye — iletişim bilgileri (tek kaynak) ────────────────────────
// TEK ISTISNA: index.html'deki <noscript> blogu bu degerleri TEKRARLIYOR —
// orasi React disinda kaldigi icin buradan okuyamiyor. Telefon/e-posta/adres
// degistirirken index.html'i de guncelleyin.
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

// FIYAT SABITI YOK — BILEREK.
// Sitede fiyat yayinlanmiyor; musteriye telefonda veriliyor (karar 4661da5'te
// alindi, maliyet grafigi bolumu o commit'te komple kaldirildi). Burada eskiden
// PARA_BIRIMI / AVICAD_YILLIK / AUTOCAD_YILLIK sabitleri duruyordu; grafik
// gidince hicbir yerden import edilmez oldular ama dosyada kaldilar ve
// "sayfada fiyat var" yanilgisina yol actilar. Kaldirildilar.
//
// Fiyat gostermeye karar verilirse: once gorunur icerige eklenmeli, SONRA
// index.html'deki SoftwareApplication semasina offers dusunulmeli. Google
// yapilandirilmis verinin gorunur icerigi temsil etmesini istiyor; sayfada
// olmayan bir fiyati semaya koymak kural ihlali olur.

// wa.me linki — hazir mesajla birlikte.
export const whatsappHref = () =>
  `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(WHATSAPP_MESAJ)}`
