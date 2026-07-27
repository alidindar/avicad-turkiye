import { useState } from 'react'
import './VideoShowcase.css'
import Ornament from './Ornament'

const VIDEO_ID = 'NG6p5puX9kY'

// AViCAD tanitim videosu — tikla-oynat facade (player yalniz tiklayinca yuklenir).
const VideoShowcase = () => {
  const [playing, setPlaying] = useState(false)
  const [thumb, setThumb] = useState(`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`)

  return (
    <section id="video" className="showcase" aria-label="AViCAD tanıtım videosu">
      <header className="showcase-header">
        <p className="showcase-eyebrow">İZLEYİN</p>
        <Ornament />
        <h2 className="showcase-title">AViCAD'i iş başında görün</h2>
        <p className="showcase-subtitle">
          Tanıdık komutlar, DWG uyumu ve akıcı 2B/3B iş akışı — AutoCAD'e alternatif AViCAD'in
          nasıl çalıştığını kısa videoda izleyin.
        </p>
      </header>

      <div className="showcase-video">
        {playing ? (
          <div className="video-facade playing">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?start=25&autoplay=1&rel=0`}
              title="AViCAD tanıtım videosu"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button
            type="button"
            className="video-facade"
            onClick={() => setPlaying(true)}
            aria-label="Videoyu oynat"
          >
            <img
              src={thumb}
              alt="AViCAD tanıtım videosu önizlemesi"
              loading="lazy"
              onError={() => setThumb(`https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`)}
            />
            <span className="video-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </section>
  )
}

export default VideoShowcase
