// Selettore a rotella per la quantita' di un alimento: si scorre in verticale, il valore al
// centro e' quello scelto. Niente tastiera: i passi (5 g, 10 g, 1 pezzo...) vengono da dati.json.
import { useLayoutEffect, useRef } from 'react'
import { formatNumero } from '../formato'

const ALTEZZA = 44 // px di ogni valore
const VISIBILI = 5

type Props = {
  valori: number[]
  valore: number
  unita: string
  /** Unita' diversa per il plurale (es. 1 banana, 2 banane). */
  unitaPlurale?: string
  onCambia: (valore: number) => void
}

function indiceVicino(valori: number[], valore: number): number {
  let migliore = 0
  valori.forEach((v, i) => {
    if (Math.abs(v - valore) < Math.abs(valori[migliore] - valore)) migliore = i
  })
  return migliore
}

export function SelettoreQuantita({ valori, valore, unita, unitaPlurale, onCambia }: Props) {
  const rotella = useRef<HTMLDivElement>(null)
  const indice = indiceVicino(valori, valore)

  // All'apertura la rotella parte dal valore attuale.
  useLayoutEffect(() => {
    if (rotella.current) rotella.current.scrollTop = indice * ALTEZZA
  }, [])

  const vaiA = (i: number) => {
    const limitato = Math.min(valori.length - 1, Math.max(0, i))
    rotella.current?.scrollTo({ top: limitato * ALTEZZA, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => vaiA(indice - 1)}
        aria-label="Meno"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bordo bg-sfondo text-2xl font-bold"
      >
        −
      </button>
      <div className="relative flex-1" style={{ height: ALTEZZA * VISIBILI }}>
        {/* Banda del valore scelto */}
        <div
          className="pointer-events-none absolute inset-x-0 rounded-xl border-2 border-cho bg-[color-mix(in_srgb,var(--cho)_8%,transparent)]"
          style={{ top: ALTEZZA * Math.floor(VISIBILI / 2), height: ALTEZZA }}
          aria-hidden="true"
        />
        <div
          ref={rotella}
          role="listbox"
          aria-label="Quantita'"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') vaiA(indice - 1)
            if (e.key === 'ArrowDown') vaiA(indice + 1)
          }}
          onScroll={(e) => {
            const i = Math.min(valori.length - 1, Math.max(0, Math.round(e.currentTarget.scrollTop / ALTEZZA)))
            if (valori[i] !== valore) onCambia(valori[i])
          }}
          className="h-full snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            paddingBlock: ALTEZZA * Math.floor(VISIBILI / 2),
            maskImage: 'linear-gradient(transparent, black 30%, black 70%, transparent)',
          }}
        >
          {valori.map((v, i) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={i === indice}
              onClick={() => vaiA(i)}
              className={`flex w-full snap-center items-center justify-center tabular-nums ${
                i === indice ? 'text-2xl font-bold' : 'text-lg opacity-60'
              }`}
              style={{ height: ALTEZZA }}
            >
              {formatNumero(v)} {v > 1 && unitaPlurale ? unitaPlurale : unita}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => vaiA(indice + 1)}
        aria-label="Piu'"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bordo bg-sfondo text-2xl font-bold"
      >
        +
      </button>
    </div>
  )
}
