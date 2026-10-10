// In alto a destra nelle card dei pasti: i CHO, numero principale grande e rosa, e sotto
// le proteine, più piccole e in blu.
import { formatNumero } from '../formato'
import type { ConfrontoProteine } from '../giornata'

type Props = {
  /** null: non disponibile (merenda da scegliere, pasto libero senza valori). */
  cho: number | null
  proteine: number | null
  /** Testo al posto dei CHO quando mancano: "—" o "ND". */
  mancante?: string
  grande?: boolean
}

export function NumeriPasto({ cho, proteine, mancante = '—', grande = false }: Props) {
  return (
    <div className="shrink-0 text-right">
      <div className="text-cho">
        <div className={`${grande ? 'text-3xl' : 'text-2xl'} font-bold leading-none tabular-nums`}>
          {cho === null ? mancante : formatNumero(cho)}
        </div>
        <div className="text-xs font-semibold">g CHO</div>
      </div>
      {proteine !== null && <NumeroProteine proteine={proteine} />}
    </div>
  )
}

const segni = { sotto: '▼', dentro: '✓', sopra: '▲' } as const

/**
 * "47 g PRO" in blu, sotto i CHO (card dei pasti e vista settimanale). Con il confronto
 * (totale del giorno) un segno dice se è dentro il target del tipo di giornata.
 */
export function NumeroProteine({ proteine, confronto }: { proteine: number; confronto?: ConfrontoProteine | null }) {
  return (
    <div className="mt-1 whitespace-nowrap text-pro">
      <span className="text-base font-bold tabular-nums">{formatNumero(proteine)}</span>
      <span className="text-xs font-semibold"> g PRO</span>
      {confronto && (
        <span
          className={`ml-1 text-xs font-bold ${confronto.esito === 'dentro' ? 'text-ok' : 'text-testo opacity-60'}`}
          title={`target ${confronto.min}–${confronto.max} g`}
          aria-label={confronto.esito === 'dentro' ? 'nel target' : `${confronto.esito} il target ${confronto.min}–${confronto.max} g`}
        >
          {segni[confronto.esito]}
        </span>
      )}
    </div>
  )
}
