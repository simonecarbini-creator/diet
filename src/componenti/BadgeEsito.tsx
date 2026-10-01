import type { Esito } from '../giornata'
import { IconaPolliceGiu, IconaPolliceSu } from './Icone'

const etichette: Record<Esito, string> = {
  rispettato: 'piano rispettato',
  nonRispettato: 'piano non rispettato',
  nonDichiarato: 'pasti non registrati',
}

/** Riepilogo di un giorno passato: pollice su, pollice giù o ND. */
export function BadgeEsito({ esito, piccolo = false }: { esito: Esito; piccolo?: boolean }) {
  const dimensione = piccolo ? 'h-6 w-6' : 'h-8 w-8'
  const icona = piccolo ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
  const stile = {
    rispettato: 'border-ok text-ok',
    nonRispettato: 'border-ko text-ko',
    nonDichiarato: 'border-bordo text-testo opacity-60',
  }[esito]

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border-2 ${dimensione} ${stile}`}
      title={etichette[esito]}
      aria-label={etichette[esito]}
      role="img"
    >
      {esito === 'rispettato' && <IconaPolliceSu className={icona} />}
      {esito === 'nonRispettato' && <IconaPolliceGiu className={icona} />}
      {esito === 'nonDichiarato' && (
        <span className={`font-bold ${piccolo ? 'text-[9px]' : 'text-[11px]'}`}>ND</span>
      )}
    </span>
  )
}
