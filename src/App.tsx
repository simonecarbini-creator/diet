// Punto 1 di SPEC.md: vista di verifica del caricamento di dati.json.
// Verrà sostituita dalla schermata Oggi al punto 2.
import { dati, isTipoGiornata, trovaPasto, type CategoriaPasto, type Giorno } from './dati'
import { verificaDati } from './verifica'

const categorie: CategoriaPasto[] = ['colazione', 'spuntino', 'pranzo', 'cena', 'merenda']

function RigaPasto({ categoria, giorno }: { categoria: CategoriaPasto; giorno: Giorno }) {
  const id = giorno[categoria]
  if (id === null) {
    return (
      <li>
        <span className="font-medium capitalize">{categoria}</span>: da scegliere
      </li>
    )
  }
  const pasto = trovaPasto(categoria, id)
  return (
    <li>
      <span className="font-medium capitalize">{categoria}</span> {id}
      {pasto ? (
        <>
          {' '}— {pasto.nome} · {pasto.kcal} kcal ·{' '}
          <span className="font-semibold text-cho">{pasto.cho} g CHO</span>
        </>
      ) : (
        <span className="text-red-700"> — non trovato</span>
      )}
    </li>
  )
}

function App() {
  const errori = verificaDati(dati)

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold">Diet</h1>
      <p className="text-sm opacity-70">
        dati.json versione {dati.versione} · aggiornato il {dati.aggiornato}
      </p>

      {errori.length > 0 ? (
        <ul className="mt-4 rounded border border-red-700 p-3 text-red-700">
          {errori.map((errore) => (
            <li key={errore}>{errore}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm">Calendario coerente con i pasti di dati.json.</p>
      )}

      {dati.settimane.map((settimana) => (
        <section key={settimana.numero} className="mt-6">
          <h2 className="text-lg font-semibold">
            Settimana {settimana.numero} · {settimana.dal} → {settimana.al} · {settimana.kmTotali} km
          </h2>
          {settimana.giorni.map((giorno) => {
            const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
            return (
              <article key={giorno.data} className="mt-3 rounded bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <strong>{giorno.data}</strong>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: tipo?.colore }}
                  >
                    {giorno.tipo}
                  </span>
                </div>
                <p className="text-sm">{giorno.allenamento}</p>
                <ul className="mt-2 text-sm">
                  {categorie.map((categoria) => (
                    <RigaPasto key={categoria} categoria={categoria} giorno={giorno} />
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Totale giorno: {giorno.kcal} kcal ·{' '}
                  <span className="text-lg font-bold text-cho">{giorno.cho} g CHO</span>
                </p>
              </article>
            )
          })}
        </section>
      ))}

      <footer className="mt-8 border-t pt-3 text-xs opacity-70">{dati.disclaimer}</footer>
    </div>
  )
}

export default App
