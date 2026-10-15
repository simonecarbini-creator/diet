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
  /** Riga piccola sotto i CHO, es. "5 g in meno di C2" (riguarda i CHO). */
  sottoCho?: string
}

export function NumeriPasto({ cho, proteine, mancante = '—', grande = false, sottoCho }: Props) {
  return (
    <div className="shrink-0 text-right">
      <div className="text-cho">
        <div className={`${grande ? 'text-3xl' : 'text-2xl'} font-bold leading-none tabular-nums`}>
          {cho === null ? mancante : formatNumero(cho)}
        </div>
        <div className="text-xs font-semibold">g CHO</div>
        {sottoCho && <div className="whitespace-nowrap text-xs font-normal text-testo opacity-70">{sottoCho}</div>}
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
      {/* Le proteine del piano rispetto al target del tipo di giornata, scritto per esteso. */}
      {confronto && (
        <div className={`text-[11px] font-semibold leading-tight ${confronto.esito === 'dentro' ? 'text-ok' : 'text-testo opacity-70'}`}>
          {segni[confronto.esito]} PRO {confronto.esito === 'dentro' ? 'nel target' : `${confronto.esito} target`} {confronto.min}–{confronto.max}
        </div>
      )}
    </div>
  )
}
