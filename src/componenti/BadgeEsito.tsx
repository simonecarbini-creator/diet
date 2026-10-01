import type { Esito } from '../giornata'
import { IconaPolliceGiu, IconaPolliceSu } from './Icone'

const etichette: Record<Esito, string> = {
  rispettato: 'piano rispettato',
  nonRispettato: 'piano non rispettato',
  nonDichiarato: 'pasti non registrati',
}

/** Riepilogo di un giorno passato: pollice su, pollice giù o ND. */
export function BadgeEsito({ esito, piccolo = false }: { esito: Esito; piccolo?: boolean }) {
  const dimensione = piccolo ? 'h-5 w-5' : 'h-6 w-6'
  const icona = piccolo ? 'h-3 w-3' : 'h-3.5 w-3.5'
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
        <span className={`font-semibold ${piccolo ? 'text-[8px]' : 'text-[9px]'}`}>ND</span>
      )}
    </span>
  )
}
