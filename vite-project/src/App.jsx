
import './App.css'
import Hero from './components/Hero'
import Section1 from './components/Section1'

function App() {

  return (
    <>
   <Hero />
   <Section1 />
   <a className="howto-fab" href="nasil-yapildi.html">
     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>
     Nasıl yapıldı?
   </a>
    </>
  )
}

export default App
