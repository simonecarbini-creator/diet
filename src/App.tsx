import { useEffect, useState } from 'react'
import { dati } from './dati'
import { dataLocale, oraLocale } from './giornata'
import { Oggi } from './schermate/Oggi'
import { verificaDati } from './verifica'

// ?data=AAAA-MM-GG mostra un altro giorno del piano (utile per provare).
function dataRichiesta(): string | null {
  const data = new URLSearchParams(window.location.search).get('data')
  return data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null
}

function App() {
  const errori = verificaDati(dati)
  const [adesso, setAdesso] = useState(() => new Date())

  // Aggiorna l'ora ogni minuto: il pasto corrente cambia anche ad app aperta.
  useEffect(() => {
    const timer = setInterval(() => setAdesso(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const oggi = dataLocale(adesso)
  const data = dataRichiesta() ?? oggi

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-4">
      {errori.length > 0 && (
        <ul className="mb-4 rounded-xl border-2 border-red-600 p-3 text-sm text-red-600">
          {errori.map((errore) => (
            <li key={errore}>{errore}</li>
          ))}
        </ul>
      )}

      <Oggi data={data} ora={data === oggi ? oraLocale(adesso) : null} />

      <footer className="mt-8 border-t border-bordo pt-3 text-xs opacity-70">
        {dati.disclaimer}
      </footer>
    </div>
  )
}

export default App
