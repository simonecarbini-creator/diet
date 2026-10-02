import { link } from '../navigazione'
import { giorniA, useObiettivo } from '../obiettivo'
import { Logo } from './Logo'
import { PulsanteMenu } from './Menu'

type Props = {
  oggi: string
  menuAperto: boolean
  onApriMenu: () => void
  onChiudiMenu: () => void
}

/** Barra fissa in alto: logo, obiettivo con i giorni che mancano, menu. */
export function Intestazione({ oggi, menuAperto, onApriMenu, onChiudiMenu }: Props) {
  const obiettivo = useObiettivo()
  const mancano = obiettivo.tipo === 'gara' ? giorniA(oggi, obiettivo.data) : null

  return (
    // Con il menu aperto l'header resta sopra il velo, così la X per chiudere è visibile.
    <header
      className={`sticky top-0 ${menuAperto ? 'z-[60]' : 'z-30'} border-b border-bordo bg-superficie/95 pt-[env(safe-area-inset-top)] backdrop-blur`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2.5">
        <a href={link.settimana()} aria-label="DIET, vai alla settimana">
          <Logo />
        </a>
        <a href={link.piano} className="ml-auto text-right leading-tight">
          <div className="text-xs opacity-70">{obiettivo.tipo === 'gara' ? obiettivo.nome : 'Obiettivo'}</div>
          <div className="text-sm font-semibold">
            {mancano === null && 'Mantenimento'}
            {mancano !== null && mancano > 0 && `−${mancano} ${mancano === 1 ? 'giorno' : 'giorni'}`}
            {mancano === 0 && 'è oggi!'}
            {mancano !== null && mancano < 0 && <span className="text-cho">conclusa · cambia piano</span>}
          </div>
        </a>
        <PulsanteMenu aperto={menuAperto} onApri={onApriMenu} onChiudi={onChiudiMenu} />
      </div>
    </header>
  )
}
