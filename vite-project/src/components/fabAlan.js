// Yuzen butonlarin (WhatsAppFab / BackToTop) ekranin alt seridinde kapladigi
// alanla ilgili ortak hesap.
//
// Neden var: her iki FAB da `position: fixed` ile viewport'un alt kosesinde
// duruyor (mobilde bottom:18 + 50px, masaustunde bottom:28 + 56px). Iletisim
// formu bu seride girdiginde input'lar tam FAB'larin altina denk geliyor ve
// dokunmayi FAB caliyor: mobil testte telefon alaninin icindeki bir noktaya
// basildiginda alan odaklanmak yerine WhatsApp aciliyordu (elementFromPoint ->
// wa.me linki, ~44x32px'lik bir kesisim). Lead formunun ortasinda yanlislikla
// uygulama degistirmek dogrudan donusum kaybi.
//
// Cozum: verilen bolum alt seride degdigi surece FAB'lar geri cekilir. Iletisim
// bolumunde zaten telefon / WhatsApp / e-posta baglantilari duruyor, dolayisiyla
// erisilebilir bir eylem kaybedilmiyor.

// FAB'larin kapladigi alt serit yuksekligi (px). Masaustu 28+56=84 ve mobil
// 18+50=68 degerlerinin ikisini de icine alacak sekilde bir miktar pay birakildi.
const FAB_SERIDI = 90

export const fabSeridiniKapatiyor = (id) => {
  const el = document.getElementById(id)
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight && r.bottom > window.innerHeight - FAB_SERIDI
}
