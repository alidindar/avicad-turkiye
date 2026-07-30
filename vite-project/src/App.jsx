import Hero from './components/Hero'
import Section1 from './components/Section1'
import About from './components/About'
import Compare from './components/Compare'
import Testimonials from './components/Testimonials'
import Faq from './components/Faq'
import Contact from './components/Contact'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import WhatsAppFab from './components/WhatsAppFab'

function App() {

  return (
    <>
      {/* Klavye/ekran okuyucu kullanicisinin nav'i VE 6 ekran boyu suren
          pinli hero'yu atlayabilmesi icin ilk odaklanabilir oge. Normalde
          gorunmez, odaklaninca belirir (stil: index.css). */}
      <a className="skip-link" href="#ana-icerik">İçeriğe geç</a>

      <Hero />

      {/* <main> landmark'i yoktu; ekran okuyucu kullanicisi icerige
          atlayamiyordu. Hero disarida biraktildi: site nav'ini iceriyor ve
          nav'in main icinde olmasi landmark semantigini bulandirir. Bunun
          bedeli h1'in main disinda kalmasi — hero/banner alaninda h1 bulunan
          yaygin bir desen, gecerli. */}
      {/* tabIndex={-1} SART: onsuz skip link'e basildiginda sayfa main'e
          kayiyor ama ODAK <body>'ye dusuyordu — sonraki Tab basa donuyor ve
          link islevsel olarak ise yaramiyordu (olculdu). -1, main'i klavye
          sirasina SOKMADAN programatik odaga acar. */}
      <main id="ana-icerik" tabIndex={-1}>
        <Section1 />
        <About />
        <Compare />
        <Testimonials />
        <Contact />
        <Faq />
      </main>

      <Footer />
      <BackToTop />
      <WhatsAppFab />
    </>
  )
}

export default App
