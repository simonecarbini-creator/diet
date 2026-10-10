// In alto a destra nelle card dei pasti: proteine (più piccole, in blu) accanto ai CHO,
// che restano il numero principale, grande e rosa.
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
    <div className="flex shrink-0 items-end gap-3 text-right">
      {proteine !== null && (
        <div className="text-pro">
          <div className={`${grande ? 'text-xl' : 'text-lg'} font-bold leading-none tabular-nums`}>{formatNumero(proteine)}</div>
          <div className="text-xs font-semibold">g PRO</div>
        </div>
      )}
      <div className="text-cho">
        <div className={`${grande ? 'text-3xl' : 'text-2xl'} font-bold leading-none tabular-nums`}>
          {cho === null ? mancante : formatNumero(cho)}
        </div>
        <div className="text-xs font-semibold">g CHO</div>
      </div>
    </div>
  )
}
