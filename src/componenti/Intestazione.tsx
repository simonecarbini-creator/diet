import { dati } from '../dati'
import { link } from '../navigazione'
import { Logo } from './Logo'
import { PulsanteMenu } from './Menu'

function giorniMancanti(da: string, a: string): number {
  const [a1, m1, g1] = da.split('-').map(Number)
  const [a2, m2, g2] = a.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86_400_000)
}

/** Barra fissa in alto: logo, nome dell'app e giorni alla gara. */
type Props = {
  oggi: string
  menuAperto: boolean
  onApriMenu: () => void
  onChiudiMenu: () => void
}

export function Intestazione({ oggi, menuAperto, onApriMenu, onChiudiMenu }: Props) {
  const { gara } = dati.atleta
  const mancano = giorniMancanti(oggi, gara.data)

  return (
    // Con il menu aperto l'header resta sopra il velo, così la X per chiudere è visibile.
    <header className={`sticky top-0 ${menuAperto ? 'z-[60]' : 'z-30'} border-b border-bordo bg-superficie/95 pt-[env(safe-area-inset-top)] backdrop-blur`}>
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
        <PulsanteMenu aperto={menuAperto} onApri={onApriMenu} onChiudi={onChiudiMenu} />
      </div>
    </header>
  )
}
