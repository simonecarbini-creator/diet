// Pasto libero della giornata di sgarro: al posto del pasto del piano c'è quello che si
// è mangiato davvero, scritto a mano. I CHO non sono noti: si mostra "ND g CHO".
import { useState } from 'react'
import type { CategoriaPasto } from '../dati'
import type { VocePasto } from '../giornata'

type Props = {
  voce: VocePasto
  etichetta: string
  consumato: boolean
  onConsumato: (consumato: boolean) => void
  onSalva: (testo: string) => void
  onRipristina: (categoria: CategoriaPasto) => void
}

export function CardPastoLibero({ voce, etichetta, consumato, onConsumato, onSalva, onRipristina }: Props) {
  const testo = voce.libero ?? ''
  const [bozza, setBozza] = useState<string | null>(testo === '' ? '' : null)
  const [aperto, setAperto] = useState(false)

  if (bozza !== null) {
    return (
      <article id={`pasto-${voce.categoria}`} className="scroll-mt-20 rounded-xl border-2 border-dashed border-cho bg-superficie p-4">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {voce.orario} · {etichetta} · libero
        </div>
        <label className="mt-2 block">
          <span className="text-sm font-semibold">Cosa hai mangiato?</span>
          <textarea
            rows={3}
            autoFocus
            value={bozza}
            onChange={(e) => setBozza(e.target.value)}
            placeholder="es. pizza margherita e una birra"
            className="mt-1 w-full resize-none rounded-lg border border-bordo bg-sfondo px-2.5 py-2 outline-none focus:border-cho"
          />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => (testo === '' ? onRipristina(voce.categoria) : setBozza(null))}
            className="rounded-xl border border-bordo p-2.5 font-medium"
          >
            {testo === '' ? 'Rimetti il pasto' : 'Annulla'}
          </button>
          <button
            type="button"
            disabled={bozza.trim() === ''}
            onClick={() => {
              onSalva(bozza.trim())
              setBozza(null)
            }}
            className="rounded-xl bg-cho p-2.5 font-bold text-white disabled:opacity-40"
          >
            Salva
          </button>
        </div>
      </article>
    )
  }

  return (
    <article id={`pasto-${voce.categoria}`} className="scroll-mt-20 rounded-xl border border-bordo bg-superficie">
      <div className="flex items-start">
        <button
          type="button"
          onClick={() => onConsumato(!consumato)}
          aria-pressed={consumato}
          aria-label={consumato ? `${etichetta}: consumato` : `Segna ${etichetta} come consumato`}
          className="flex shrink-0 self-stretch py-4 pl-4 pr-1"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${
              consumato ? 'border-cho bg-cho text-white' : 'border-bordo'
            }`}
          >
            {consumato && '✓'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAperto(!aperto)}
          aria-expanded={aperto}
          className="flex min-w-0 flex-1 items-start gap-3 py-4 pl-2 pr-4 text-left"
        >
          <div className="w-11 shrink-0 pt-0.5 text-sm tabular-nums opacity-70">{voce.orario}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {etichetta} · <span className="text-ko">libero</span>
            </div>
            <div className="font-semibold leading-snug">{testo}</div>
            <div className="text-sm opacity-70">al posto di {voce.pasto?.id ?? 'del pasto del piano'}</div>
          </div>
          <div className="shrink-0 text-right text-cho">
            <div className="text-3xl font-bold leading-none">ND</div>
            <div className="text-xs font-semibold">g CHO</div>
          </div>
        </button>
      </div>
      {aperto && (
        <div className="grid grid-cols-2 gap-2 border-t border-bordo px-4 pb-4 pt-3">
          <button type="button" onClick={() => setBozza(testo)} className="rounded-xl border border-bordo p-2.5 font-medium">
            Modifica
          </button>
          <button type="button" onClick={() => onRipristina(voce.categoria)} className="rounded-xl border border-bordo p-2.5 font-medium">
            Rimetti il pasto
          </button>
        </div>
      )}
    </article>
  )
}
