import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { olcumBaslat } from './olcum.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Ölçüm render'dan SONRA başlar: bölüm gözlemcisinin izleyeceği <section>
// öğeleri o ana kadar DOM'a girmiş olmuyor. requestIdleCallback ile ana iş
// parçacığı boşalınca çalışır, ilk boyamayı geciktirmez. Bileşen içinde
// değil burada çağrılıyor — StrictMode'un çift render'ı sayacı şişirmesin.
const olcumuBaslat = () => olcumBaslat()
if ('requestIdleCallback' in window) {
  requestIdleCallback(olcumuBaslat, { timeout: 2500 })
} else {
  setTimeout(olcumuBaslat, 1200)
}
