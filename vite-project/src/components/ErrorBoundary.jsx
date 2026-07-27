import { Component } from 'react'
import './ErrorBoundary.css'
import { TELEFON_GORUNEN, TELEFON_HREF, whatsappHref } from '../siteConfig'

// Bir bilesen render'da hata atarsa tum sayfa beyaz ekran olmasin diye:
// nazik bir fallback + iletisim (ziyaretci yine ulasabilsin).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Uretimde sessiz; gelistirmede konsola.
    if (import.meta.env.DEV) console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="eb-wrap" role="alert">
        <div className="eb-card">
          <p className="eb-brand">AViCAD Türkiye</p>
          <h1 className="eb-title">Bir şeyler ters gitti</h1>
          <p className="eb-text">
            Sayfa yüklenirken beklenmedik bir sorun oluştu. Lütfen sayfayı yenileyin;
            sorun sürerse bize doğrudan ulaşabilirsiniz.
          </p>
          <div className="eb-actions">
            <button type="button" className="eb-btn" onClick={() => window.location.reload()}>
              Sayfayı yenile
            </button>
            <a className="eb-link" href={TELEFON_HREF}>{TELEFON_GORUNEN}</a>
            <a className="eb-link" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
