import { useEffect, useState } from 'react'
import { dati } from './dati'
import { dataLocale, oraLocale } from './giornata'
import { link, useRotta } from './navigazione'
import { Mese } from './schermate/Mese'
import { Oggi } from './schermate/Oggi'
import { Settimana } from './schermate/Settimana'
import { NuovaSettimana } from './schermate/NuovaSettimana'
import { Calcoli } from './schermate/Calcoli'
import { CambiaPiano } from './schermate/CambiaPiano'
import { Registro } from './schermate/Registro'
import { Menu } from './componenti/Menu'
import { verificaDati } from './verifica'
import { compilaDatiDiProva } from './prova'
import { Intestazione } from './componenti/Intestazione'
import { PiePagina } from './componenti/PiePagina'
import { FinestraPeso, PulsantePeso } from './componenti/Peso'
import { promemoriaPesata, usePesi } from './peso'
import { usePiano } from './piano'

function App() {
  const errori = verificaDati(dati)
  const { rotta, provenienza } = useRotta()
  usePiano()
  const [adesso, setAdesso] = useState(() => new Date())

  // Aggiorna l'ora ogni minuto: il pasto corrente cambia anche ad app aperta.
  useEffect(() => {
    const timer = setInterval(() => setAdesso(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const oggi = dataLocale(adesso)
  const { pesate, aggiungi, elimina } = usePesi()
  const [finestraPeso, setFinestraPeso] = useState(false)
  const [menuAperto, setMenuAperto] = useState(false)
  const promemoria = promemoriaPesata(oggi, oraLocale(adesso), pesate)

  // TEMPORANEO: vedi prova.ts.
  useEffect(() => {
    if (rotta.schermata === 'prova') {
      void compilaDatiDiProva(oggi).then(() => window.location.replace(link.settimana()))
    }
  }, [rotta.schermata, oggi])

  // Nel dettaglio di un giorno resta attiva la scheda da cui si è arrivati.
  const schedaAttiva = rotta.schermata === 'giorno' ? provenienza.schermata : rotta.schermata
  const schede = [
    { href: link.mese(), etichetta: 'Mese', attiva: schedaAttiva === 'mese' },
    { href: link.settimana(), etichetta: 'Settimana', attiva: schedaAttiva === 'settimana' },
    { href: link.oggi, etichetta: 'Oggi', attiva: schedaAttiva === 'oggi' },
  ]

  return (
    <>
      <Intestazione
        oggi={oggi}
        menuAperto={menuAperto}
        onApriMenu={() => setMenuAperto(true)}
        onChiudiMenu={() => setMenuAperto(false)}
      />
      <Menu aperto={menuAperto} onApri={() => setMenuAperto(true)} onChiudi={() => setMenuAperto(false)} />
      {promemoria && (
        <button
          type="button"
          onClick={() => setFinestraPeso(true)}
          className="block w-full bg-cho px-4 py-2 text-center text-sm font-semibold text-white"
        >
          {promemoria === 'vigilia' ? 'Domattina pesati a digiuno' : 'Oggi è il giorno della pesata'} ›
        </button>
      )}
      <div className="mx-auto max-w-xl px-4 pb-36 pt-4">
        {errori.length > 0 && (
          <ul className="mb-4 rounded-xl border-2 border-red-600 p-3 text-sm text-red-600">
            {errori.map((errore) => (
              <li key={errore}>{errore}</li>
            ))}
          </ul>
        )}

        {rotta.schermata === 'oggi' && <Oggi key={oggi} data={oggi} ora={oraLocale(adesso)} />}
        {rotta.schermata === 'mese' && <Mese mese={rotta.mese} oggi={oggi} />}
        {rotta.schermata === 'nuova' && <NuovaSettimana />}
        {rotta.schermata === 'calcoli' && <Calcoli />}
        {rotta.schermata === 'piano' && <CambiaPiano oggi={oggi} />}
        {rotta.schermata === 'registro' && <Registro pesate={pesate} onApriPeso={() => setFinestraPeso(true)} />}
        {rotta.schermata === 'settimana' && <Settimana numero={rotta.numero} oggi={oggi} />}
        {rotta.schermata === 'giorno' && (
          <>
            <a href={provenienza.href} className="mb-3 inline-block py-1 font-medium text-cho">
              ‹ {provenienza.schermata === 'mese' ? 'Mese' : 'Settimana'}
            </a>
            <Oggi
              key={rotta.data}
              data={rotta.data}
              ora={rotta.data === oggi ? oraLocale(adesso) : null}
              solaLettura={rotta.data < oggi}
            />
          </>
        )}

        <PiePagina />
      </div>

      {!finestraPeso && <PulsantePeso promemoria={promemoria !== null} onApri={() => setFinestraPeso(true)} />}
      {finestraPeso && (
        <FinestraPeso
          pesate={pesate}
          oggi={oggi}
          promemoria={promemoria}
          onAggiungi={aggiungi}
          onElimina={elimina}
          onChiudi={() => setFinestraPeso(false)}
        />
      )}

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
