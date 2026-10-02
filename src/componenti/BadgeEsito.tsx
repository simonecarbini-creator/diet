import type { Esito } from '../giornata'
import { IconaPolliceGiu, IconaPolliceSu } from './Icone'

const etichette: Record<Esito, string> = {
  rispettato: 'piano rispettato',
  nonRispettato: 'piano non rispettato',
  nonDichiarato: 'pasti non registrati',
}

/** Riepilogo di un giorno passato: pollice su, pollice giù o ND. */
const misure = {
  /** Nelle celle del calendario mensile. */
  mini: { cerchio: 'h-4 w-4', icona: 'h-2.5 w-2.5', testo: 'text-[7px]' },
  normale: { cerchio: 'h-6 w-6', icona: 'h-3.5 w-3.5', testo: 'text-[9px]' },
}

export function BadgeEsito({ esito, misura = 'normale' }: { esito: Esito; misura?: keyof typeof misure }) {
  const { cerchio: dimensione, icona, testo } = misure[misura]
  // Sfondo appena colorato e icona sottile: un segnale discreto, non un bollino.
  const stile = {
    rispettato: 'bg-ok/15 text-ok',
    nonRispettato: 'bg-ko/15 text-ko',
    nonDichiarato: 'bg-bordo/70 text-testo/60',
  }[esito]

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${dimensione} ${stile}`}
      title={etichette[esito]}
      aria-label={etichette[esito]}
      role="img"
    >
      {esito === 'rispettato' && <IconaPolliceSu className={icona} spessore={1.75} />}
      {esito === 'nonRispettato' && <IconaPolliceGiu className={icona} spessore={1.75} />}
      {esito === 'nonDichiarato' && (
        <span className={`font-semibold ${testo}`}>ND</span>
      )}
    </span>
  )
}
