// Elenco delle alternative per un pasto: la scelta vale solo per il giorno mostrato.
import { useState } from 'react'
import { dati, idAlternative, trovaPasto, type CategoriaConId, type PastoRisolto } from '../dati'
import { formatDifferenzaCho, formatNumero } from '../formato'
import type { VocePasto } from '../giornata'

/** "senzaYogurt" → "senza yogurt" */
function etichettaTag(tag: string): string {
  return tag.replace(/([A-Z])/g, ' $1').toLowerCase()
}

type Props = {
  categoria: CategoriaConId
  voce: VocePasto
  tipoGiorno: string
  onScegli: (id: string | null) => void
}

export function SceltaPasto({ categoria, voce, tipoGiorno, onScegli }: Props) {
  const [filtri, setFiltri] = useState<string[]>([])

  const pasti = idAlternative(categoria)
    .map((id) => trovaPasto(categoria, id))
    .filter((p): p is PastoRisolto => p !== null)
  const tuttiTag = [...new Set(pasti.flatMap((p) => p.tags ?? []))]
  const visibili = pasti.filter((p) => filtri.every((f) => p.tags?.includes(f)))
  // Riferimento per la differenza di CHO: il pasto del piano, se il piano lo indica.
  const piano = voce.delPiano !== undefined ? voce.delPiano : voce.pasto
  const riferimento = voce.idPiano !== null ? piano : null

  return (
    <div>
      <div className="text-xs font-semibold uppercase opacity-70">
        {voce.idPiano === null ? 'Scegli per oggi' : 'Cambia solo per oggi'}
      </div>

      {tuttiTag.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tuttiTag.map((tag) => {
            const attivo = filtri.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={attivo}
                onClick={() =>
                  setFiltri(attivo ? filtri.filter((f) => f !== tag) : [...filtri, tag])
                }
                className={`rounded-full border px-3 py-1 text-sm ${
                  attivo ? 'border-cho bg-cho text-white' : 'border-bordo'
                }`}
              >
                {etichettaTag(tag)}
              </button>
            )
          })}
        </div>
      )}

      <ul className="mt-2 space-y-2">
        {visibili.map((opzione) => {
          const scelto = voce.pasto?.id === opzione.id
          const ammesso =
            !opzione.soloTipiGiornata || opzione.soloTipiGiornata.includes(tipoGiorno)
          const differenza = riferimento ? opzione.cho - riferimento.cho : 0
          return (
            <li key={opzione.id}>
              <button
                type="button"
                disabled={!ammesso}
                onClick={() => onScegli(opzione.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left disabled:opacity-40 ${
                  scelto ? 'border-2 border-cho' : 'border-bordo'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-snug">
                    <span className="mr-2 rounded bg-bordo px-1.5 py-0.5 text-xs">{opzione.id}</span>
                    {opzione.composizione ?? opzione.nome}
                  </div>
                  <div className="text-sm opacity-70">
                    {formatNumero(opzione.kcal)} kcal
                    {opzione.id === voce.idPiano && ' · nel piano'}
                    {!ammesso && ` · solo giorni ${opzione.soloTipiGiornata?.join(', ')}`}
                  </div>
                  {opzione.tags && opzione.tags.length > 0 && (
                    <div className="text-xs opacity-70">{opzione.tags.map(etichettaTag).join(' · ')}</div>
                  )}
                </div>
                <div className="shrink-0 text-right text-cho">
                  <div className="text-2xl font-bold leading-none tabular-nums">
                    {formatNumero(opzione.cho)}
                  </div>
                  <div className="text-xs font-semibold">
                    {riferimento && differenza !== 0 ? formatDifferenzaCho(differenza) : 'g CHO'}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {categoria === 'merenda' && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-70">
          {dati.merendaNote.map((nota) => (
            <li key={nota}>{nota}</li>
          ))}
        </ul>
      )}

      {voce.delPiano !== undefined && (
        <button
          type="button"
          onClick={() => onScegli(null)}
          className="mt-3 w-full rounded-lg border border-bordo p-3 font-medium"
        >
          {voce.idPiano === null ? 'Annulla la scelta' : `Torna al piano (${voce.idPiano})`}
        </button>
      )}
    </div>
  )
}
