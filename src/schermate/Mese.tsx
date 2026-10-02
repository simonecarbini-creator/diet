// Vista Mese: calendario con tipo giornata e riepilogo di ogni giorno, per lo storico.
// Toccando un giorno se ne apre il dettaglio.
import { BadgeEsito } from '../componenti/BadgeEsito'
import { dati, isTipoGiornata, type Giorno } from '../dati'
import { formatMese } from '../formato'
import { esitoGiorno, type Esito } from '../giornata'
import { link } from '../navigazione'
import { settimane } from '../piano'
import { useStatiGiorni, type StatoGiorno } from '../statoGiorno'

const intestazioni = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

/** "2026-10" ± n mesi */
function spostaMese(mese: string, delta: number): string {
  const [anno, numero] = mese.split('-').map(Number)
  const data = new Date(anno, numero - 1 + delta, 1)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

function CellaGiorno({
  data,
  giorno,
  stato,
  oggi,
}: {
  data: string
  giorno?: Giorno
  stato?: StatoGiorno
  oggi: string
}) {
  const numero = Number(data.slice(8))
  if (!giorno) {
    return (
      <div className="flex aspect-square items-start justify-center pt-1 text-sm opacity-30">{numero}</div>
    )
  }

  const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
  const { esito, fatti, totali } = esitoGiorno(giorno, stato ?? { scelte: {}, consumati: [] })
  const eOggi = data === oggi

  return (
    <a
      href={link.giorno(data)}
      aria-label={`${data}, ${giorno.tipo}`}
      className={`flex aspect-square flex-col items-center justify-between overflow-hidden rounded-lg border bg-superficie pt-1 ${
        eOggi ? 'border-2 border-cho' : 'border-[1.5px] border-contorno'
      }`}
    >
      <span className={`text-sm leading-none ${eOggi ? 'font-bold text-cho' : 'font-medium'}`}>{numero}</span>
      <span className="mb-1 flex flex-1 items-center">
        {(data < oggi || (eOggi && stato?.sgarro)) && <BadgeEsito esito={esito} misura="mini" />}
        {eOggi && !stato?.sgarro && (
          <span className="text-[10px] font-bold tabular-nums">
            {fatti}/{totali}
          </span>
        )}
      </span>
      <span className="h-1.5 w-full" style={{ backgroundColor: tipo?.colore }} aria-hidden="true" />
    </a>
  )
}

type Props = {
  mese: string | null
  oggi: string
}

export function Mese({ mese, oggi }: Props) {
  const giorniPiano = settimane().flatMap((s) => s.giorni)
  const perData = new Map(giorniPiano.map((g) => [g.data, g]))
  const corrente = mese ?? oggi.slice(0, 7)

  // Si naviga dal primo mese del piano fino al più recente tra oggi e la fine del piano.
  const date = giorniPiano.map((g) => g.data).sort()
  const primoMese = (date[0] ?? oggi).slice(0, 7)
  const ultimoMese = [date[date.length - 1] ?? oggi, oggi].sort()[1].slice(0, 7)

  const [anno, numero] = corrente.split('-').map(Number)
  const giorniNelMese = new Date(anno, numero, 0).getDate()
  const vuotiIniziali = (new Date(anno, numero - 1, 1).getDay() + 6) % 7
  const giorniDelMese = Array.from(
    { length: giorniNelMese },
    (_, i) => `${corrente}-${String(i + 1).padStart(2, '0')}`,
  )

  const stati = useStatiGiorni(giorniDelMese.filter((d) => perData.has(d)))

  const conteggi: Record<Esito, number> = { rispettato: 0, nonRispettato: 0, nonDichiarato: 0 }
  for (const data of giorniDelMese) {
    const giorno = perData.get(data)
    if (giorno && data < oggi) conteggi[esitoGiorno(giorno, stati[data] ?? { scelte: {}, consumati: [] }).esito]++
  }
  const passati = conteggi.rispettato + conteggi.nonRispettato + conteggi.nonDichiarato

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        {corrente > primoMese ? (
          <a href={link.mese(spostaMese(corrente, -1))} aria-label="Mese precedente" className="p-2 text-2xl">
            ‹
          </a>
        ) : (
          <span className="w-10" />
        )}
        <h1 className="text-xl font-bold first-letter:uppercase">{formatMese(corrente)}</h1>
        {corrente < ultimoMese ? (
          <a href={link.mese(spostaMese(corrente, 1))} aria-label="Mese successivo" className="p-2 text-2xl">
            ›
          </a>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {intestazioni.map((giorno, i) => (
          <div key={i} className="text-center text-xs font-semibold opacity-60">
            {giorno}
          </div>
        ))}
        {Array.from({ length: vuotiIniziali }, (_, i) => (
          <div key={`vuoto-${i}`} />
        ))}
        {giorniDelMese.map((data) => (
          <CellaGiorno key={data} data={data} giorno={perData.get(data)} stato={stati[data]} oggi={oggi} />
        ))}
      </div>

      {passati > 0 && (
        <section className="mt-5 grid grid-cols-3 gap-2 text-center">
          {(['rispettato', 'nonRispettato', 'nonDichiarato'] as const).map((esito) => (
            <div key={esito} className="flex flex-col items-center gap-1 rounded-xl border border-bordo bg-superficie p-3">
              <BadgeEsito esito={esito} />
              <span className="text-2xl font-bold tabular-nums">{conteggi[esito]}</span>
              <span className="text-xs opacity-70">
                {{ rispettato: 'rispettati', nonRispettato: 'non rispettati', nonDichiarato: 'non registrati' }[esito]}
              </span>
            </div>
          ))}
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
        {Object.entries(dati.tipiGiornata).map(([nome, tipo]) => (
          <span key={nome} className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: tipo.colore }} aria-hidden="true" />
            {nome} · {tipo.etichetta}
          </span>
        ))}
      </div>
    </>
  )
}
