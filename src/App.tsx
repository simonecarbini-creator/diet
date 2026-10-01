import { useEffect, useState } from 'react'
import { dati } from './dati'
import { dataLocale, oraLocale } from './giornata'
import { link, useRotta } from './navigazione'
import { Oggi } from './schermate/Oggi'
import { Settimana } from './schermate/Settimana'
import { verificaDati } from './verifica'

function App() {
  const errori = verificaDati(dati)
  const rotta = useRotta()
  const [adesso, setAdesso] = useState(() => new Date())

  // Aggiorna l'ora ogni minuto: il pasto corrente cambia anche ad app aperta.
  useEffect(() => {
    const timer = setInterval(() => setAdesso(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const oggi = dataLocale(adesso)
  const schede = [
    { href: link.oggi, etichetta: 'Oggi', attiva: rotta.schermata === 'oggi' },
    { href: link.settimana(), etichetta: 'Settimana', attiva: rotta.schermata !== 'oggi' },
  ]

  return (
    <>
      <div className="mx-auto max-w-xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {errori.length > 0 && (
          <ul className="mb-4 rounded-xl border-2 border-red-600 p-3 text-sm text-red-600">
            {errori.map((errore) => (
              <li key={errore}>{errore}</li>
            ))}
          </ul>
        )}

        {rotta.schermata === 'oggi' && <Oggi key={oggi} data={oggi} ora={oraLocale(adesso)} />}
        {rotta.schermata === 'settimana' && <Settimana numero={rotta.numero} oggi={oggi} />}
        {rotta.schermata === 'giorno' && (
          <>
            <a href={link.settimana()} className="mb-3 inline-block py-1 font-medium text-cho">
              ‹ Settimana
            </a>
            <Oggi
              key={rotta.data}
              data={rotta.data}
              ora={rotta.data === oggi ? oraLocale(adesso) : null}
              solaLettura={rotta.data < oggi}
            />
          </>
        )}

        <footer className="mt-8 border-t border-bordo pt-3 text-xs opacity-70">{dati.disclaimer}</footer>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-bordo bg-superficie pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-xl">
          {schede.map((scheda) => (
            <a
              key={scheda.etichetta}
              href={scheda.href}
              aria-current={scheda.attiva ? 'page' : undefined}
              className={`flex-1 py-4 text-center font-semibold ${
                scheda.attiva ? 'text-cho' : 'opacity-60'
              }`}
            >
              {scheda.etichetta}
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}

export default App
