import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { caricaPiano } from './piano'
import { caricaObiettivi } from './obiettivo'

// Chiede al browser di non cancellare i dati salvati (scelte, peso, settimane).
void navigator.storage?.persist?.()

// Prima del primo render si leggono le settimane salvate sul telefono.
void Promise.all([caricaPiano(), caricaObiettivi()]).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  chiudiAvvio()
})

/** La schermata di avvio (index.html) resta un giro e mezzo della GIF, poi sfuma. */
function chiudiAvvio() {
  const DURATA_AVVIO_MS = 3600
  const avvio = document.getElementById('avvio')
  if (!avvio) return
  setTimeout(() => {
    avvio.classList.add('via')
    setTimeout(() => avvio.remove(), 400)
  }, Math.max(0, DURATA_AVVIO_MS - performance.now()))
}
