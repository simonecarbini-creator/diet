import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { caricaPiano } from './piano'
import { caricaObiettivi } from './obiettivo'

// Chiede al browser di non cancellare i dati salvati (scelte, peso, settimane).
void navigator.storage?.persist?.()

// Prima del primo render si leggono le settimane salvate sul telefono.
void Promise.all([caricaPiano(), caricaObiettivi()]).finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
