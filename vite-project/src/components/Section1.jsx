import React, { useEffect, useRef, useState } from 'react'
import './Section1.css'

const HOUSES = [
  {
    id: 'stark',
    name: 'STARK',
    seat: 'Winterfell',
    words: '"Winter Is Coming"',
    region: 'The North',
    sigil: 'Grey Direwolf',
    colors: ['#6b7a8d', '#c8d4e0'],
    accent: '#8fafc4',
    description:
      'Wardens of the North, the Starks trace their blood to the First Men. Honour is their sword and the frozen wind their banner. They endure where others fall — patient as winter itself.',
    sigil_url: '/images/one.jpg',
    bg: 'linear-gradient(135deg, #0d1117 0%, #1a2332 60%, #0d1117 100%)',
    borderColor: '#4a6380',
  },
  {
    id: 'lannister',
    name: 'LANNISTER',
    seat: 'Casterly Rock',
    words: '"Hear Me Roar"',
    region: 'The Westerlands',
    sigil: 'Golden Lion',
    colors: ['#c9a84c', '#e8c97a'],
    accent: '#d4a84b',
    description:
      'The wealthiest house in Westeros. Their lion does not merely roar — it devours. Power is their birthright, gold their language, and debt a weapon they wield with surgical precision.',
    sigil_url: '/images/two.jpg',
    bg: 'linear-gradient(135deg, #1a1200 0%, #2a1f00 60%, #1a1200 100%)',
    borderColor: '#7a6130',
  },
  {
    id: 'targaryen',
    name: 'TARGARYEN',
    seat: 'Dragonstone',
    words: '"Fire and Blood"',
    region: 'The Crownlands',
    sigil: 'Three-Headed Dragon',
    colors: ['#c41e3a', '#ff4466'],
    accent: '#c0392b',
    description:
      'Blood of Old Valyria. They did not conquer Westeros — they burned it into submission. Dragon riders, dynasty builders, and the last of a world consumed by fire.',
    sigil_url: '/images/three.png',
    bg: 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 60%, #1a0000 100%)',
    borderColor: '#7a1a1a',
  },
  {
    id: 'baratheon',
    name: 'BARATHEON',
    seat: "Storm's End",
    words: '"Ours Is The Fury"',
    region: 'The Stormlands',
    sigil: 'Crowned Black Stag',
    colors: ['#e8c97a', '#f5e6c8'],
    accent: '#c9a84c',
    description:
      'Born of storms, tempered by battle. The Baratheons seized the Iron Throne not through cunning but through iron will and a war hammer. Fury is not their weakness — it is their crown.',
    sigil_url: '/images/four.webp',
    bg: 'linear-gradient(135deg, #0a0a00 0%, #1f1c00 60%, #0a0a00 100%)',
    borderColor: '#5a5020',
  },
  {
    id: 'greyjoy',
    name: 'GREYJOY',
    seat: 'Pyke',
    words: '"We Do Not Sow"',
    region: 'The Iron Islands',
    sigil: 'Golden Kraken',
    colors: ['#d4af37', '#8b8b6b'],
    accent: '#b8a040',
    description:
      'Reavers of the sea. Iron men who bow to no king but the Drowned God. What they cannot make, they take. What they cannot take, they burn. The sea is their kingdom — all else is plunder.',
    sigil_url: '/images/five.jpg',
    bg: 'linear-gradient(135deg, #050810 0%, #0a1020 60%, #050810 100%)',
    borderColor: '#3a4a5a',
  },
  {
    id: 'tyrell',
    name: 'TYRELL',
    seat: 'Highgarden',
    words: '"Growing Strong"',
    region: 'The Reach',
    sigil: 'Golden Rose',
    colors: ['#4a7c3f', '#7ab648'],
    accent: '#5a9e48',
    description:
      'The richest lords of the Reach, whose roses feed the realm. Behind beauty and abundance lies a house of ruthless ambition — growing strong in gardens, and stronger still in schemes.',
    sigil_url: '/images/six.jpg',
    bg: 'linear-gradient(135deg, #030a00 0%, #0a1800 60%, #030a00 100%)',
    borderColor: '#2a4a20',
  },
]

const HouseCard = ({ house, index }) => {
  const cardRef   = useRef(null)
  const sigilRef  = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Staggered entrance via IntersectionObserver
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), index * 120)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [index])

  // Sigil tilt on hover
  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 14
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 14
    if (sigilRef.current) {
      sigilRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg) scale(1.06)`
    }
  }
  const handleMouseLeave = () => {
    if (sigilRef.current) sigilRef.current.style.transform = ''
    setHovered(false)
  }

  return (
    <div
      ref={cardRef}
      className={`house-card house-card--${house.id}`}
      style={{ '--accent': house.accent, '--border': house.borderColor, background: house.bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Corner ornaments */}
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />

      {/* Glow pulse on hover */}
      <div className="card-glow" />

      {/* Sigil */}
      <div ref={sigilRef} className="house-sigil-wrap">
        {!imgError ? (
          <img
            className="house-sigil-img"
            src={import.meta.env.BASE_URL + house.sigil_url.replace(/^\//, '')}
            alt={`House ${house.name} sigil`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="house-sigil-fallback">{house.sigil[0]}</div>
        )}
        <div className="sigil-ring" />
      </div>

      {/* Static content */}
      <div className={`house-content ${hovered ? 'content-hidden' : ''}`}>
        <p className="house-region">{house.region}</p>
        <div className="house-divider">
          <span className="divider-line" />
          <span className="divider-diamond" />
          <span className="divider-line" />
        </div>
        <h2 className="house-name">HOUSE<br />{house.name}</h2>
        <p className="house-seat">{house.seat}</p>
        <p className="house-sigil-label">{house.sigil}</p>
      </div>

      {/* Hover reveal: words + description */}
      <div className={`house-hover-content ${hovered ? 'hover-visible' : ''}`}>
        <p className="hover-words">{house.words}</p>
        <div className="house-divider hover-divider">
          <span className="divider-line" />
          <span className="divider-diamond" />
          <span className="divider-line" />
        </div>
        <h2 className="hover-name">HOUSE {house.name}</h2>
        <p className="hover-desc">{house.description}</p>
      </div>

      {/* Bottom accent bar */}
      <div className="card-accent-bar" />
    </div>
  )
}

const Section1 = () => {
  const sectionRef   = useRef(null)
  const headingRef   = useRef(null)
  const subRef       = useRef(null)

  useEffect(() => {
    const els = [headingRef.current, subRef.current].filter(Boolean)
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          els.forEach((el, i) =>
            setTimeout(() => el.classList.add('visible'), i * 150)
          )
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="section1">

      {/* Ambient background texture */}
      <div className="section1-bg-texture" />
      <div className="section1-bg-vignette" />

      {/* Section header */}
      <header className="section1-header">
        <p ref={subRef} className="section1-eyebrow fade-up">THE GREAT HOUSES OF WESTEROS</p>
        <div className="header-ornament">
          <span className="ornament-line" />
          <span className="ornament-rune">✦</span>
          <span className="ornament-line" />
        </div>
        <h1 ref={headingRef} className="section1-title fade-up">
          The Noble<br />
          <em>Houses</em>
        </h1>
        <p className="section1-subtitle fade-up">
          Seven kingdoms. Six great houses. One Iron Throne.
        </p>
      </header>

      {/* Houses grid */}
      <div className="houses-grid">
        {HOUSES.map((house, i) => (
          <HouseCard key={house.id} house={house} index={i} />
        ))}
      </div>

      {/* Section footer ornament */}
      <div className="section1-footer-ornament">
        <span className="footer-line" />
        <span className="footer-sigil">⚔</span>
        <span className="footer-line" />
      </div>

    </section>
  )
}

export default Section1