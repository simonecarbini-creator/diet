// Schermata Oggi (SPEC.md §3.1): cosa mangio adesso. Serve anche per il dettaglio di un
// giorno dalla Settimana, in sola lettura per i giorni passati.
import { useEffect, useRef } from 'react'
import { CardPasto } from '../componenti/CardPasto'
import { formatData, formatNumero } from '../formato'
import { cercaGiorno, indicePastoCorrente, totaliPasti, vociDelGiorno } from '../giornata'
import { useStatoGiorno } from '../statoGiorno'
import { dati, isCategoriaConId, isTipoGiornata } from '../dati'

type Props = {
  data: string
  /** Ora corrente (HH:MM), solo se `data` è oggi: serve a evidenziare il pasto corrente. */
  ora: string | null
  /** Giorni passati: si consultano ma non si cambiano. */
  solaLettura?: boolean
}

export function Oggi({ data, ora, solaLettura = false }: Props) {
  const trovato = cercaGiorno(data)
  const { stato, scegli, segnaConsumato } = useStatoGiorno(data)
  const voci = trovato ? vociDelGiorno(trovato.giorno, stato.scelte) : []
  const corrente = ora !== null && voci.length > 0 ? indicePastoCorrente(voci, ora) : null
  const categoriaCorrente = corrente !== null ? voci[corrente].categoria : null

  // Porta il pasto corrente in cima solo all'apertura, non a ogni cambio d'ora.
  const scorrimentoFatto = useRef(false)
  useEffect(() => {
    if (categoriaCorrente && !scorrimentoFatto.current) {
      scorrimentoFatto.current = true
      document.getElementById(`pasto-${categoriaCorrente}`)?.scrollIntoView({ block: 'start' })
    }
  }, [categoriaCorrente])

  if (!trovato) {
    const tutti = dati.settimane.flatMap((s) => s.giorni.map((g) => g.data)).sort()
    return (
      <section className="rounded-xl border border-bordo bg-superficie p-4">
        <h1 className="text-xl font-bold first-letter:uppercase">{formatData(data)}</h1>
        <p className="mt-2">Nessun giorno del piano per questa data.</p>
        {tutti.length > 0 && (
          <p className="mt-1 text-sm opacity-70">
            Il piano copre dal {formatData(tutti[0])} al {formatData(tutti[tutti.length - 1])}.
          </p>
        )}
      </section>
    )
  }

  const { giorno } = trovato
  const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
  const somma = totaliPasti(voci)

  return (
    <>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold first-letter:uppercase">{formatData(giorno.data)}</h1>
          <span
            className="rounded-md px-2 py-0.5 text-sm font-semibold text-white"
            style={{ backgroundColor: tipo?.colore }}
          >
            {giorno.tipo}
          </span>
          {tipo && <span className="text-sm opacity-70">{tipo.etichetta}</span>}
        </div>
        <p className="mt-1">{giorno.allenamento}</p>
        {giorno.lungoDomenicale && (
          <p className="mt-1 text-sm font-semibold">Lungo domenicale</p>
        )}
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Piano</div>
          <div className="text-4xl font-bold leading-tight tabular-nums text-cho">
            {formatNumero(giorno.cho)}
            <span className="ml-1 text-base">g CHO</span>
          </div>
          <div className="text-sm opacity-70">{formatNumero(giorno.kcal)} kcal</div>
        </div>
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Somma pasti</div>
          <div className="text-4xl font-bold leading-tight tabular-nums text-cho">
            {formatNumero(somma.cho)}
            <span className="ml-1 text-base">g CHO</span>
          </div>
          <div className="text-sm opacity-70">
            {formatNumero(somma.kcal)} kcal ·{' '}
            {somma.proteine !== null ? `${formatNumero(somma.proteine)} g proteine` : 'proteine n.d.'}
          </div>
          {somma.pastiMancanti.includes('merenda') && (
            <div className="mt-1 text-xs font-semibold">merenda da scegliere</div>
          )}
        </div>
      </section>

      {(giorno.gelCho > 0 || giorno.spuntinoSerale) && (
        <section className="mt-3 space-y-1 rounded-xl border border-bordo bg-superficie p-3 text-sm">
          {giorno.gelCho > 0 && (
            <p>
              <span className="font-semibold">Gel in corsa: </span>
              <span className="font-bold text-cho">{formatNumero(giorno.gelCho)} g CHO</span>
              <span className="opacity-70"> · non inclusi nei totali</span>
            </p>
          )}
          {giorno.spuntinoSerale && (
            <p>
              <span className="font-semibold">Spuntino serale previsto</span>
            </p>
          )}
        </section>
      )}

      {giorno.ricarica && (
        <section className="mt-3 rounded-xl border-2 border-cho p-3 text-sm">
          <p className="font-semibold">Ricarica: {dati.regole.sabatoRicarica.motivo}</p>
          <p className="mt-1">{dati.regole.sabatoRicarica.effetto}</p>
        </section>
      )}

      {giorno.note && <p className="mt-3 text-sm opacity-80">{giorno.note}</p>}

      <section className="mt-5 space-y-3">
        {voci.map((voce, i) => (
          <CardPasto
            key={voce.categoria}
            voce={voce}
            corrente={i === corrente}
            consumato={stato.consumati.includes(voce.categoria)}
            tipoGiorno={giorno.tipo}
            solaLettura={solaLettura}
            onConsumato={(consumato) => segnaConsumato(voce.categoria, consumato)}
            onScegli={(id) => {
              if (isCategoriaConId(voce.categoria)) scegli(voce.categoria, id, voce.idPiano)
            }}
          />
        ))}
      </section>
    </>
  )
}
