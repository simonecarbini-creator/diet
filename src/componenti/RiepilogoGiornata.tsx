// In cima alla giornata: kcal consumate, kcal del piano (fisse, al centro dell'arco) e rimanenti;
// sotto, carboidrati, proteine e grassi consumati rispetto al piano, con una barra ciascuno.
// Contano solo i pasti spuntati: crescono man mano che si mangia.
import { formatNumero } from '../formato'

type Valori = { kcal: number; cho: number; proteine: number; grassi: number }

type Props = {
  piano: Valori
  consumati: Valori
  /** Pasti liberi spuntati senza valori: non contati. */
  liberiSenzaValori: number
}

// Arco di 270 gradi aperto in basso, come un contachilometri.
const R = 42
const CENTRO = 50
function punto(gradi: number) {
  const rad = ((gradi - 90) * Math.PI) / 180
  return `${CENTRO + R * Math.cos(rad)} ${CENTRO + R * Math.sin(rad)}`
}
const ARCO = `M ${punto(-135)} A ${R} ${R} 0 1 1 ${punto(135)}`

function Barra({ nome, valore, piano, colore, testo }: { nome: string; valore: number; piano: number; colore: string; testo: string }) {
  const frazione = piano > 0 ? Math.min(1, valore / piano) : 0
  return (
    <div className="min-w-0 text-center">
      <div className="text-sm opacity-70">{nome}</div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bordo">
        <div className={`h-full rounded-full ${colore}`} style={{ width: `${frazione * 100}%` }} />
      </div>
      <div className={`mt-1.5 text-sm font-bold tabular-nums ${testo}`}>
        {formatNumero(Math.round(valore))} / {formatNumero(Math.round(piano))} g
      </div>
    </div>
  )
}

export function RiepilogoGiornata({ piano, consumati, liberiSenzaValori }: Props) {
  const rimanenti = piano.kcal - consumati.kcal
  const frazione = piano.kcal > 0 ? Math.min(1, consumati.kcal / piano.kcal) : 0
  return (
    <section className="rounded-2xl border border-bordo bg-superficie px-3 pb-4 pt-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{formatNumero(consumati.kcal)}</div>
          <div className="text-sm opacity-70">Consumate</div>
        </div>
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <path d={ARCO} pathLength={100} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-bordo" />
            {frazione > 0 && (
              <path
                d={ARCO}
                pathLength={100}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${frazione * 100} 100`}
                className={rimanenti < 0 ? 'stroke-ko' : 'stroke-ok'}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-black tabular-nums leading-none">{formatNumero(piano.kcal)}</div>
            <div className="mt-1 text-sm opacity-70">kcal del piano</div>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold tabular-nums ${rimanenti < 0 ? 'text-ko' : ''}`}>{formatNumero(Math.abs(rimanenti))}</div>
          <div className="text-sm opacity-70">{rimanenti < 0 ? 'Oltre' : 'Rimanenti'}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-4">
        <Barra nome="Carboidrati" valore={consumati.cho} piano={piano.cho} colore="bg-cho" testo="text-cho" />
        <Barra nome="Proteine" valore={consumati.proteine} piano={piano.proteine} colore="bg-pro" testo="text-pro" />
        <Barra nome="Grassi" valore={consumati.grassi} piano={piano.grassi} colore="bg-grassi" testo="text-grassi" />
      </div>
      {liberiSenzaValori > 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-ko">
          + {liberiSenzaValori} {liberiSenzaValori === 1 ? 'pasto libero' : 'pasti liberi'} senza valori, non contati
        </p>
      )}
    </section>
  )
}
