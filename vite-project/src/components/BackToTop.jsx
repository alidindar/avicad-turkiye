import { useEffect, useState } from 'react'
import './BackToTop.css'
import { fabSeridiniKapatiyor } from './fabAlan'

// Sayfa sonundayken (Iletisim) nav yukarida pinli hero'da kaldigi icin erisilemez.
// Bu yuzen buton her yerden en uste donmeyi saglar. Agir video decode smooth
// scroll'u bozdugu icin 'auto' (aninda) kullaniliyor.
const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Video/hero'yu kaplamamasi icin: buton yalnizca Section1 (Neden AviCAD)
    // tepesi viewport ustunu gecince belirir → o an hero tamamen scroll edilmis olur.
    // Not: rAF throttle KULLANILMIYOR — agir video ana thread'i doyurup rAF'i
    // starve edince FAB takili kaliyordu (QA). 2 eleman icin dogrudan hesap ucuz.
    // Iletisim formu alt seride girdiginde FAB input'larin sag kenarindan
    // dokunma caliyor (bkz. fabAlan.js) — o aralikta gizlenir.
    const onScroll = () => {
      const s1 = document.getElementById('neden-avicad')
      const gorunur = s1
        ? s1.getBoundingClientRect().top <= 0
        : window.scrollY > window.innerHeight * 6
      setVisible(gorunur && !fabSeridiniKapatiyor('iletisim'))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'show' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
      aria-label="Yukarı çık"
      title="Yukarı çık"
    >
      ↑
    </button>
  )
}

export default BackToTop
