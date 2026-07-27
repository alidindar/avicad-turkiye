import { useEffect, useState } from 'react'
import './BackToTop.css'

// Sayfa sonundayken (Iletisim) nav yukarida pinli hero'da kaldigi icin erisilemez.
// Bu yuzen buton her yerden en uste donmeyi saglar. Agir video decode smooth
// scroll'u bozdugu icin 'auto' (aninda) kullaniliyor.
const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Video/hero'yu kaplamamasi icin: buton yalnizca Section1 (Neden AviCAD)
    // tepesi viewport ustunu gecince belirir → o an hero tamamen scroll edilmis olur.
    // getBoundingClientRect scroll'da reflow tetikler → rAF ile frame basina 1 kez.
    let ticking = false
    const compute = () => {
      ticking = false
      const s1 = document.getElementById('neden-avicad')
      setVisible(s1 ? s1.getBoundingClientRect().top <= 0 : window.scrollY > window.innerHeight * 6)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(compute)
    }
    compute()
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
