// Riepilogo della settimana: tre anelli concentrici (CHO fuori, proteine, grassi dentro) che si
// riempiono quando arrivano in vista. Un anello chiuso = consumato esattamente quanto il piano;
// si ferma prima se si e' sotto, e oltre il giro, piu' scuro, se si e' sopra. I numeri contano
// insieme agli anelli. Con "Riduci movimento" compaiono subito alla fine.
import { useEffect, useRef, useState } from 'react'
import { formatNumero } from '../formato'

type Valori = { cho: number; proteine: number; grassi: number }

type Props = {
  piano: Valori
  consumati: Valori
  /** Pasti liberi spuntati senza valori: non contati. */
  liberiSenzaValori: number
}

const DURATA = 1400 // ms
const SPESSORE = 9

const anelli = [
  { chiave: 'cho', nome: 'Carboidrati', raggio: 44, colore: 'var(--cho)', testo: 'text-cho' },
  { chiave: 'proteine', nome: 'Proteine', raggio: 33, colore: 'var(--pro)', testo: 'text-pro' },
  { chiave: 'grassi', nome: 'Grassi', raggio: 22, colore: 'var(--grassi)', testo: 'text-grassi' },
] as const

/** 0 → 1 con partenza rapida e arrivo morbido. */
const rallenta = (t: number) => 1 - Math.pow(1 - t, 3)

export function AnelliSettimana({ piano, consumati, liberiSenzaValori }: Props) {
  const riquadro = useRef<HTMLElement>(null)
  const [avanzamento, setAvanzamento] = useState(0)

  useEffect(() => {
    const el = riquadro.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAvanzamento(1)
      return
    }
    let fotogramma = 0
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (!voce.isIntersecting) return
        osservatore.disconnect()
        const inizio = performance.now()
        const passo = (ora: number) => {
          const t = Math.min(1, (ora - inizio) / DURATA)
          setAvanzamento(rallenta(t))
          if (t < 1) fotogramma = requestAnimationFrame(passo)
        }
        fotogramma = requestAnimationFrame(passo)
      },
      { threshold: 0.5 },
    )
    osservatore.observe(el)
    return () => {
      osservatore.disconnect()
      cancelAnimationFrame(fotogramma)
    }
  }, [])

  return (
    <section ref={riquadro} className="rounded-2xl border border-bordo bg-superficie p-4">
      <h2 className="text-lg font-bold">Riepilogo della settimana</h2>
      <p className="text-sm opacity-70">Pasti spuntati rispetto al piano dei 7 giorni (gel esclusi).</p>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0 -rotate-90" aria-hidden="true">
          {anelli.map((a) => {
            const frazione = piano[a.chiave] > 0 ? (consumati[a.chiave] / piano[a.chiave]) * avanzamento : 0
            const giro = Math.min(1, frazione)
            const oltre = Math.min(1, Math.max(0, frazione - 1))
            return (
              <g key={a.chiave} fill="none" strokeWidth={SPESSORE} strokeLinecap="round">
                <circle cx="50" cy="50" r={a.raggio} stroke={a.colore} strokeOpacity={0.16} />
                {giro > 0 && <circle cx="50" cy="50" r={a.raggio} stroke={a.colore} pathLength={100} strokeDasharray={`${giro * 100} 100`} />}
                {/* Oltre il piano: il secondo giro, piu' scuro, sopra il primo. */}
                {oltre > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={a.raggio}
                    stroke={`color-mix(in srgb, ${a.colore} 60%, black)`}
                    pathLength={100}
                    strokeDasharray={`${oltre * 100} 100`}
                  />
                )}
              </g>
            )
          })}
        </svg>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {anelli.map((a) => {
            const valore = consumati[a.chiave]
            const percento = piano[a.chiave] > 0 ? Math.round((valore / piano[a.chiave]) * 100) : 0
            return (
              <li key={a.chiave}>
                <div className="flex items-center gap-1.5 text-sm opacity-80">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.colore }} aria-hidden="true" />
                  {a.nome}
                </div>
                <div className={`font-bold tabular-nums ${a.testo}`}>
                  <span className="text-lg">{formatNumero(Math.round(valore * avanzamento))}</span>
                  <span className="text-sm"> / {formatNumero(Math.round(piano[a.chiave]))} g</span>
                  <span className="ml-1.5 text-xs font-semibold text-testo opacity-60">{Math.round(percento * avanzamento)}%</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      {liberiSenzaValori > 0 && (
        <p className="mt-3 text-xs font-semibold text-ko">
          + {liberiSenzaValori} {liberiSenzaValori === 1 ? 'pasto libero' : 'pasti liberi'} senza valori, non contati
        </p>
      )}
    </section>
  )
}
