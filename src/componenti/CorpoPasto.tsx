// Parte alta delle card dei pasti: in prima riga spunta, orario e tipo di pasto; sotto, allineati
// alla spunta, titolo (al massimo due righe), etichette e kcal. A destra CHO, PRO e grassi.
// Tutta la card apre i dettagli; la spunta resta un pulsante a parte, sopra.
import type { ReactNode } from 'react'

type Props = {
  etichetta: string
  orario: string
  /** Dopo il tipo di pasto, es. " · adesso", " · composto da te". */
  dopoEtichetta?: ReactNode
  consumato: boolean
  /** Senza pasto (merenda da scegliere) la spunta e' spenta. */
  spuntabile?: boolean
  onConsumato: (consumato: boolean) => void
  onApri: () => void
  aperto?: boolean
  /** Titolo, etichette, kcal: sotto la prima riga. */
  children: ReactNode
  /** CHO, PRO e grassi a destra. */
  numeri: ReactNode
}

export function CorpoPasto({
  etichetta,
  orario,
  dopoEtichetta,
  consumato,
  spuntabile = true,
  onConsumato,
  onApri,
  aperto,
  children,
  numeri,
}: Props) {
  return (
    <div className="relative flex items-start gap-3 p-4">
      <button
        type="button"
        onClick={onApri}
        aria-expanded={aperto}
        aria-label={`${etichetta}: dettagli`}
        className="absolute inset-0 rounded-xl"
      />
      <div className={`pointer-events-none relative min-w-0 flex-1 ${consumato ? '[&>*:not(:first-child)]:opacity-60' : ''}`}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onConsumato(!consumato)}
            disabled={!spuntabile}
            aria-pressed={consumato}
            aria-label={consumato ? `${etichetta}: consumato` : `Segna ${etichetta} come consumato`}
            className={`pointer-events-auto -m-2 shrink-0 p-2 ${spuntabile ? '' : 'opacity-30'}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${
                consumato ? 'border-cho bg-cho text-white' : 'border-bordo'
              }`}
            >
              {consumato && '✓'}
            </span>
          </button>
          <span className="text-sm tabular-nums opacity-70">{orario}</span>
          <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide opacity-70">
            {etichetta}
            {dopoEtichetta}
          </span>
        </div>
        <div className="mt-2">{children}</div>
      </div>
      <div className={`pointer-events-none relative ${consumato ? 'opacity-60' : ''}`}>{numeri}</div>
    </div>
  )
}
