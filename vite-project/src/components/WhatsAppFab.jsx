import { useEffect, useState } from 'react'
import './WhatsAppFab.css'
import { whatsappHref } from '../siteConfig'

// Sol alttaki yuzen WhatsApp CTA'si. BackToTop (sag alt) ile AYNI anda —
// video/hero bitince — belirir ki videonun uzerini kaplamasin. Gorunurluk:
// #neden-avicad (Section1) tepesi viewport ustunu gecince.
const WhatsAppFab = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // rAF throttle KULLANILMIYOR — agir video rAF'i starve edince FAB takiliyordu (QA).
    const onScroll = () => {
      const s1 = document.getElementById('neden-avicad')
      setVisible(s1 ? s1.getBoundingClientRect().top <= 0 : window.scrollY > window.innerHeight * 6)
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
    <a
      className={`wa-fab ${visible ? 'show' : ''}`}
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp'tan yazın"
      title="WhatsApp'tan yazın"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.36l6.19-1.98A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.826 32 16S24.826 0 16.004 0zm9.316 22.598c-.386 1.09-1.92 1.994-3.142 2.258-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826s1.204-3.424 1.632-3.892c.386-.42.836-.512 1.11-.512.268 0 .544.002.784.014.276.012.63-.104.976.744.386.94 1.316 3.244 1.43 3.478.116.234.194.508.038.818-.148.31-.226.502-.446.772-.226.268-.472.598-.674.802-.226.234-.462.488-.198.938.268.45 1.19 1.964 2.556 3.182 1.756 1.566 3.238 2.052 3.688 2.28.45.234.714.196.976-.116.268-.31 1.128-1.316 1.43-1.768.294-.45.598-.374 1.006-.226.412.148 2.61 1.23 3.06 1.456.45.226.75.334.86.518.116.19.116 1.084-.27 2.176z"
        />
      </svg>
    </a>
  )
}

export default WhatsAppFab
