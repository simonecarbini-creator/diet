// Pulsante flottante della bilancia e finestra del peso: inserimento e storico.
import { useState } from 'react'
import { dati } from '../dati'
import { formatData } from '../formato'
import { leggiKg, type Pesata } from '../peso'
import { IconaBilancia, IconaFrecciaGiu, IconaFrecciaSu, IconaUguale } from './Icone'
import { Popup } from './Popup'

const kg = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

type PropsPulsante = {
  promemoria: boolean
  onApri: () => void
}

/** Cerchio con la bilancia in basso a destra, sopra la barra delle schede. */
export function PulsantePeso({ promemoria, onApri }: PropsPulsante) {
  return (
    <button
      type="button"
      onClick={onApri}
      aria-label={promemoria ? 'Peso: è il momento di pesarti' : 'Peso'}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[var(--cho-pastello)] text-white shadow-lg"
    >
      <IconaBilancia className="h-8 w-8" spessore={1.75} piatto="#fff" segni="var(--cho)" />
      {promemoria && (
        <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-cho" />
      )}
    </button>
  )
}

function Variazione({ attuale, precedente }: { attuale: Pesata; precedente?: Pesata }) {
  if (!precedente) return <span className="w-16" />
  const differenza = Math.round((attuale.kg - precedente.kg) * 10) / 10
  const Icona = differenza < 0 ? IconaFrecciaGiu : differenza > 0 ? IconaFrecciaSu : IconaUguale
  const descrizione =
    differenza < 0 ? 'in calo' : differenza > 0 ? 'in aumento' : 'invariato'
  return (
    <span className="flex w-16 items-center justify-end gap-1 text-sm tabular-nums" aria-label={descrizione}>
      <Icona className="h-4 w-4" />
      {differenza !== 0 && `${differenza > 0 ? '+' : '−'}${kg.format(Math.abs(differenza))}`}
    </span>
  )
}

/** Avviso di soglia sull'ultima pesata, con le azioni scritte in dati.json. */
function AvvisoSoglia({ ultima }: { ultima?: Pesata }) {
  const { target } = dati
  if (!ultima) return null
  const sopra = ultima.kg > target.sogliaPesoAlto
  const sotto = ultima.kg < target.sogliaPesoBasso
  if (!sopra && !sotto) return null
  return (
    <p className="rounded-lg border border-cho p-3 text-sm">
      <span className="font-semibold">
        {sopra ? `Sopra ${kg.format(target.sogliaPesoAlto)} kg` : `Sotto ${kg.format(target.sogliaPesoBasso)} kg`}:
      </span>{' '}
      {sopra ? target.azioneSopraSoglia : target.azioneSottoSoglia}
    </p>
  )
}

type PropsFinestra = {
  pesate: Pesata[]
  oggi: string
  promemoria: 'vigilia' | 'oggi' | null
  onAggiungi: (pesata: Pesata) => void
  onElimina: (data: string) => void
  onChiudi: () => void
}

export function FinestraPeso({ pesate, oggi, promemoria, onAggiungi, onElimina, onChiudi }: PropsFinestra) {
  const [testo, setTesto] = useState('')
  const [data, setData] = useState(oggi)
  const [daEliminare, setDaEliminare] = useState<string | null>(null)
  const valore = leggiKg(testo)
  const esistente = pesate.find((p) => p.data === data)

  function salva() {
    if (valore === null) return
    onAggiungi({ data, kg: valore })
    setTesto('')
    setData(oggi)
  }

  return (
    <Popup titolo="Peso" onChiudi={onChiudi} conConferma={false}>
      {promemoria === 'oggi' && (
        <p className="rounded-lg bg-cho/15 p-3 text-sm font-medium">Oggi è il giorno della pesata: a digiuno.</p>
      )}
      {promemoria === 'vigilia' && (
        <p className="rounded-lg bg-cho/15 p-3 text-sm font-medium">Domattina pesati a digiuno.</p>
      )}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          salva()
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="text-xs font-semibold uppercase opacity-70">Peso</span>
            <div className="mt-1 flex items-center rounded-xl border border-bordo bg-sfondo px-3 focus-within:border-cho">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="75,0"
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
                className="w-full bg-transparent py-3 text-2xl font-bold tabular-nums outline-none"
              />
              <span className="font-medium opacity-70">kg</span>
            </div>
          </label>
          <label className="min-w-0">
            <span className="text-xs font-semibold uppercase opacity-70">Data</span>
            <input
              type="date"
              value={data}
              max={oggi}
              onChange={(e) => setData(e.target.value || oggi)}
              className="mt-1 block h-[3.6rem] w-full py-0 leading-[3.6rem] min-w-0 max-w-full appearance-none rounded-xl border border-bordo bg-sfondo px-3 text-left outline-none focus:border-cho"
            />
          </label>
        </div>
        {esistente && (
          <p className="text-xs opacity-70">
            Per questa data c'è già {kg.format(esistente.kg)} kg: salvando lo sostituisci.
          </p>
        )}
        <button
          type="submit"
          disabled={valore === null}
          className="w-full rounded-xl bg-cho p-3.5 text-lg font-bold text-white disabled:opacity-40"
        >
          Salva
        </button>
      </form>

      <AvvisoSoglia ultima={pesate[0]} />

      <section>
        <h3 className="text-xs font-semibold uppercase opacity-70">Storico</h3>
        {pesate.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">Nessuna pesata ancora.</p>
        ) : (
          <ul className="mt-1 divide-y divide-bordo">
            {pesate.map((pesata, i) => (
              <li key={pesata.data} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 text-sm first-letter:uppercase">{formatData(pesata.data)}</span>
                <span className="font-bold tabular-nums">{kg.format(pesata.kg)} kg</span>
                <Variazione attuale={pesata} precedente={pesate[i + 1]} />
                {daEliminare === pesata.data ? (
                  <button
                    type="button"
                    onClick={() => {
                      onElimina(pesata.data)
                      setDaEliminare(null)
                    }}
                    className="rounded-lg bg-ko px-2 py-1 text-xs font-semibold text-white"
                  >
                    Elimina
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDaEliminare(pesata.data)}
                    aria-label={`Elimina la pesata del ${formatData(pesata.data)}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full opacity-40"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <a
        href={`${import.meta.env.BASE_URL}promemoria-peso.ics`}
        className="block rounded-xl border border-bordo p-3 text-center text-sm font-medium"
      >
        Aggiungi promemoria al Calendario
        <span className="block text-xs font-normal opacity-70">
          l'ultimo giorno di ogni mese alle 21:00: "Domattina pesati a digiuno"
        </span>
      </a>
    </Popup>
  )
}
