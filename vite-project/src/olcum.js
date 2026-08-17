// ─── Ölçüm (kendi sunucumuz) ─────────────────────────────────────────────────
// Üçüncü taraf analitik yerine kendi `public/olcum.php` uç noktamıza yazıyoruz.
// Sebep: site açılışta hiçbir dış sunucuya istek atmıyor ve bu konumu bozmak
// istemiyoruz — bir analitik servisi eklemek KVKK aydınlatma metnine "üçüncü
// tarafa aktarım" satırı eklemeyi de gerektirirdi.
//
// Çerez yok, localStorage yok, kimlik yok; sunucu IP de kaydetmiyor. Yalnızca
// toplam sayaçlar artıyor.

const ENDPOINT = `${import.meta.env.BASE_URL}olcum.php`

// Do Not Track'e saygı: kişisel veri toplamasak da ziyaretçinin açık tercihi.
const olcumeIzinVar = () =>
  typeof navigator !== 'undefined' &&
  navigator.doNotTrack !== '1' &&
  navigator.doNotTrack !== 'yes' &&
  window.doNotTrack !== '1'

/**
 * Olayı sunucuya yollar. sendBeacon tercih edilir: tarayıcı isteği arka
 * planda, sayfa kapanırken bile tamamlar ve ana iş parçacığını bloklamaz.
 * HER TÜRLÜ hata yutulur — ölçüm hiçbir koşulda siteyi bozmamalı.
 */
function gonder(olay, etiket = '') {
  if (!olcumeIzinVar()) return
  const govde = JSON.stringify({ olay, etiket })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([govde], { type: 'application/json' }))
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: govde,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // sessiz
  }
}

/** Form sonucunu işaretler — emailService.js çağırır. */
export function olcumFormOlayi(sonuc) {
  gonder('form', sonuc)
}

/**
 * Sayfa görüntüleme + bölüm derinliği ölçümünü başlatır.
 * Bölüm derinliği "ziyaretçi nereye kadar indi" sorusunu cevaplar; hangi
 * bölümün ilgi çektiğini görmenin çerezsiz yolu bu.
 */
export function olcumBaslat() {
  if (!olcumeIzinVar()) return

  const mobil = window.matchMedia('(max-width: 768px)').matches
  gonder('sayfa', mobil ? 'mobil' : 'masaustu')

  // YALNIZCA section[id]. Daha genis bir secici (`main [id]`) denendi ve
  // olculdu: form alanlarini (c-ad, c-email…) ve kart panellerini de
  // "bolum" sayiyordu — 5 yerine 17 oge. Veri anlamsizlasirdi.
  const bolumler = document.querySelectorAll('section[id]')
  if (!bolumler.length || !('IntersectionObserver' in window)) return

  // Her bölüm oturumda YALNIZCA BİR KEZ sayılır; yoksa aşağı-yukarı kaydıran
  // tek ziyaretçi sayacı defalarca artırır ve veri anlamsızlaşır.
  const sayilanlar = new Set()
  const gozlemci = new IntersectionObserver(
    (girisler) => {
      for (const giris of girisler) {
        const id = giris.target.id
        if (giris.isIntersecting && id && !sayilanlar.has(id)) {
          sayilanlar.add(id)
          gonder('bolum', id)
          gozlemci.unobserve(giris.target)
        }
      }
    },
    // Bölümün yarısı göründüğünde say: kenarından geçmek "gördü" sayılmamalı.
    { threshold: 0.5 },
  )

  bolumler.forEach((b) => gozlemci.observe(b))
}
