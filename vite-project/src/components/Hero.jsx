import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

// ─── Chapter data ────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 'prologue',
    progress: [0, 0.12],
    title: 'The Ancient Chronicles',
    subtitle: 'A SONG OF ICE AND FIRE',
    body: 'In the beginning, there were only the words of the Maesters — secrets sealed within ancient tomes, waiting for a hand brave enough to open them.',
    sigil: '✦',
  },
  {
    id: 'winterfell',
    progress: [0.12, 0.30],
    title: 'The North Remembers',
    subtitle: 'HOUSE STARK — WINTERFELL',
    body: 'Winter is coming. Beyond the ancient walls, the cold whispers of the North carry stories older than the Wall itself.',
    sigil: '⚔',
  },
  {
    id: 'westeros',
    progress: [0.30, 0.52],
    title: 'The Seven Kingdoms',
    subtitle: 'THE REALM OF WESTEROS',
    body: 'From the Eyrie\'s clouded peaks to the red sands of Dorne — seven kingdoms, one throne, a thousand reasons to bleed.',
    sigil: '♜',
  },
  {
    id: 'kings-landing',
    progress: [0.52, 0.70],
    title: 'Where Crowns Are Won',
    subtitle: 'KING\'S LANDING — THE CAPITAL',
    body: 'The city that swallows kings whole. Gold and treachery perfume the air. Every smile here conceals a blade.',
    sigil: '👑',
  },
  {
    id: 'swords',
    progress: [0.70, 0.87],
    title: 'A Thousand Blades',
    subtitle: 'FORGED IN CONQUEST',
    body: 'One thousand swords, surrendered by enemies of Aegon the Conqueror. Melted. Reshaped. Made into something terrible and magnificent.',
    sigil: '⚒',
  },
  {
    id: 'throne',
    progress: [0.87, 1.0],
    title: 'The Iron Throne',
    subtitle: 'WHEN YOU PLAY THE GAME OF THRONES',
    body: 'You win — or you die.',
    sigil: '♔',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const invlerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1)

// ─── Component ───────────────────────────────────────────────────────────────
const Hero = () => {
  const containerRef  = useRef(null)
  const stickyRef     = useRef(null)
  const videoRef      = useRef(null)
  const overlayRef    = useRef(null)
  const overlayBRef   = useRef(null)
  const titleRef      = useRef(null)
  const subtitleRef   = useRef(null)
  const bodyRef       = useRef(null)
  const sigilRef      = useRef(null)
  const progressRef   = useRef(null)
  const vignetteRef   = useRef(null)
  const chapterLabelRef = useRef(null)
  const runeBarRef    = useRef(null)

  const [activeChapter, setActiveChapter] = useState(0)
  const [videoReady, setVideoReady]       = useState(false)

  // ─── Chapter transition ───────────────────────────────────────────────────
  const prevChapter = useRef(-1)
  const transitionChapter = (idx) => {
    if (prevChapter.current === idx) return
    prevChapter.current = idx
    setActiveChapter(idx)

    const ch = CHAPTERS[idx]
    const tl = gsap.timeline()

    // fade out old text
    tl.to([titleRef.current, subtitleRef.current, bodyRef.current, sigilRef.current], {
      y: -24, opacity: 0, duration: 0.35, ease: 'power2.in', stagger: 0.04,
    })
    // update DOM mid-fade via callback
    .call(() => {
      if (titleRef.current)    titleRef.current.textContent    = ch.title
      if (subtitleRef.current) subtitleRef.current.textContent = ch.subtitle
      if (bodyRef.current)     bodyRef.current.textContent     = ch.body
      if (sigilRef.current)    sigilRef.current.textContent    = ch.sigil
    })
    // fade in new text
    .fromTo(
      [sigilRef.current, subtitleRef.current, titleRef.current, bodyRef.current],
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.07 }
    )

    // chapter label
    if (chapterLabelRef.current) {
      gsap.fromTo(chapterLabelRef.current,
        { opacity: 0, x: 12 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      )
      chapterLabelRef.current.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}`
    }
  }

  // ─── Setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onReady = () => setTimeout(() => setVideoReady(true), 1000)
        video.addEventListener('loadedmetadata', onReady)
    if (video.readyState >= 1) onReady()

    // Initial chapter text
    const ch0 = CHAPTERS[0]
    if (titleRef.current)    titleRef.current.textContent    = ch0.title
    if (subtitleRef.current) subtitleRef.current.textContent = ch0.subtitle
    if (bodyRef.current)     bodyRef.current.textContent     = ch0.body
    if (sigilRef.current)    sigilRef.current.textContent    = ch0.sigil

    return () => video.removeEventListener('loadedmetadata', onReady)
  }, [])

  // ─── GSAP ScrollTrigger ───────────────────────────────────────────────────
  useEffect(() => {
    if (!videoReady) return

    const video    = videoRef.current
    const duration = video.duration || 1

    // Scroll distance = 5× viewport so we have plenty of room to scrub
    const scrollHeight = window.innerHeight * 6

    // Pin the sticky wrapper
    const pinTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start:   'top top',
      end:     `+=${scrollHeight}`,
      pin:     stickyRef.current,
      pinSpacing: true,
      anticipatePin: 1,
    })

    // Main scrub timeline — drives video time + rune bar
    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start:   'top top',
        end:     `+=${scrollHeight}`,
        scrub:   1.2,
        onUpdate: (self) => {
          // video scrub
          const t = self.progress * duration
          if (!video.seeking && Math.abs(video.currentTime - t) > 0.04) {
            if (video.fastSeek) video.fastSeek(t)
            else video.currentTime = t
          }

          // progress bar
          if (progressRef.current) {
            progressRef.current.style.transform = `scaleX(${self.progress})`
          }

          // chapter detection
          const p = self.progress
          const idx = CHAPTERS.findIndex(c => p >= c.progress[0] && p < c.progress[1])
          transitionChapter(idx === -1 ? CHAPTERS.length - 1 : idx)

          // vignette intensity
          const vinInt = 0.55 + Math.sin(p * Math.PI) * 0.2
          if (vignetteRef.current) {
            vignetteRef.current.style.opacity = String(vinInt)
          }
        },
      },
    })

    // Subtle overlay colour shift across scroll — crossfade two static
    // gradient layers (opacity is compositor-only; animating `background`
    // repaints the full screen every frame)
    gsap.to(overlayRef.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${scrollHeight}`,
        scrub: 2,
      },
    })
    gsap.to(overlayBRef.current, {
      opacity: 1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${scrollHeight}`,
        scrub: 2,
      },
    })

    // Rune bar decorative tick animation
    if (runeBarRef.current) {
      const ticks = runeBarRef.current.querySelectorAll('.rune-tick')
      gsap.fromTo(ticks,
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1, opacity: 1, stagger: 0.06, duration: 0.6, ease: 'elastic.out(1,0.5)',
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%' }
        }
      )
    }

    // Entrance animation
    gsap.fromTo(
      [sigilRef.current, subtitleRef.current, titleRef.current, bodyRef.current],
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.1, delay: 0.3 }
    )

    return () => {
      scrubTl.kill()
      pinTrigger.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoReady])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>

      {/* ── Loading overlay ── */}
      <div className={`got-loading ${videoReady ? 'hidden' : ''}`}>
        <div className="got-loading-logo">Game of Thrones</div>
        <div className="got-loading-sub">The Chronicles of Westeros</div>
        <div className="got-loading-bar-wrap">
          <div className="got-loading-bar-fill" />
        </div>
      </div>

      {/* ── Main scroll container ── */}
      <div
        ref={containerRef}
        className="got-container"
        style={{ height: `${window.innerHeight * 6 + window.innerHeight}px` }}
      >
        {/* ── Sticky viewport ── */}
        <div ref={stickyRef} className="got-sticky">

          {/* Video */}
          <video
            ref={videoRef}
            className="got-video"
            src={`${import.meta.env.BASE_URL}video/one.mp4`}
            playsInline
            muted
            preload="auto"
          />

          {/* Layers */}
          <div ref={vignetteRef} className="got-vignette" />
          <div ref={overlayRef}  className="got-overlay" />
          <div ref={overlayBRef} className="got-overlay got-overlay-b" />
          <div className="got-grain" />

          {/* Corner ornaments */}
          {['tl','tr','bl','br'].map(pos => (
            <div key={pos} className={`got-corner got-corner-${pos}`}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2 L2 20 M2 2 L20 2" stroke="#c9a84c" strokeWidth="1" strokeOpacity="0.5"/>
                <path d="M2 2 L8 8" stroke="#c9a84c" strokeWidth="0.5" strokeOpacity="0.4"/>
                <rect x="1" y="1" width="4" height="4" fill="none" stroke="#c9a84c" strokeWidth="0.5" strokeOpacity="0.6"/>
              </svg>
            </div>
          ))}

          {/* Nav */}
          <nav className="got-nav">
            <div className="got-nav-logo">Game of Thrones</div>
            <ul className="got-nav-links">
              {['The World','Characters','Houses','History'].map(l => (
                <li key={l}><a href="#0">{l}</a></li>
              ))}
            </ul>
          </nav>

          {/* Rune bar */}
          <div ref={runeBarRef} className="got-rune-bar">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="rune-tick" />
            ))}
          </div>

   
          <div className="got-content">
            <span ref={sigilRef} className="got-sigil" />
            <div className="got-divider">
              <div className="got-divider-line" />
              <div className="got-divider-diamond" />
              <div className="got-divider-line right" />
            </div>
            <span ref={subtitleRef} className="got-subtitle" />
            <h1 ref={titleRef} className="got-title" />
            <p ref={bodyRef} className="got-body" />
            <div className="got-cta-row">
              <button className="got-cta-btn">Begin the Journey</button>
              <button className="got-cta-ghost">Explore the Realm</button>
            </div>
          </div>

         
          <div className="got-right-panel">
            <div ref={chapterLabelRef} className="got-chapter-label">01 / 06</div>
            <div className="got-vert-line" />
            <div className="got-dots">
              {CHAPTERS.map((_, i) => (
                <div
                  key={i}
                  className={`got-dot ${i === activeChapter ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="got-scroll-hint">
            <span>Scroll</span>
            <div className="arrow" />
          </div>

          {/* Progress bar */}
          <div className="got-progress-bar-wrap">
            <div ref={progressRef} className="got-progress-bar-fill" />
          </div>

        </div>{/* /sticky */}
      </div>{/* /container */}
    </>
  )
}

export default Hero