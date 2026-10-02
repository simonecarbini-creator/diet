import { dati } from '../dati'
import { link } from '../navigazione'
import { Logo } from './Logo'

function giorniMancanti(da: string, a: string): number {
  const [a1, m1, g1] = da.split('-').map(Number)
  const [a2, m2, g2] = a.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86_400_000)
}

/** Barra fissa in alto: logo, nome dell'app e giorni alla gara. */
export function Intestazione({ oggi }: { oggi: string }) {
  const { gara } = dati.atleta
  const mancano = giorniMancanti(oggi, gara.data)

  return (
    <header className="sticky top-0 z-30 border-b border-bordo bg-superficie/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2.5">
        <a href={link.settimana()} aria-label="DIET, vai alla settimana">
          <Logo />
        </a>
        {mancano >= 0 && (
          <div className="ml-auto text-right leading-tight">
            <div className="text-xs opacity-70">{gara.nome}</div>
            <div className="text-sm font-semibold">
              {mancano === 0 ? 'è oggi!' : `${mancano} ${mancano === 1 ? 'giorno' : 'giorni'}`}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
