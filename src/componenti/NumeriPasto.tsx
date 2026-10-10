// In alto a destra nelle card dei pasti: i CHO, numero principale grande e rosa, e sotto
// le proteine, più piccole e in blu.
import { formatNumero } from '../formato'

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

/** "47 g PRO" in blu, sotto i CHO (card dei pasti e vista settimanale). */
export function NumeroProteine({ proteine }: { proteine: number }) {
  return (
    <div className="mt-1 whitespace-nowrap text-pro">
      <span className="text-base font-bold tabular-nums">{formatNumero(proteine)}</span>
      <span className="text-xs font-semibold"> g PRO</span>
    </div>
  )
}
