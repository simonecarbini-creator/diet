import { dati } from '../dati'
import { formatData } from '../formato'

/** In fondo a ogni schermata: disclaimer (CLAUDE.md, regola 5) e versione del piano. */
export function PiePagina() {
  return (
    <footer className="mt-10 border-t border-bordo pt-4 text-xs leading-relaxed">
      <p className="opacity-70">{dati.disclaimer}</p>
      <p className="mt-2 opacity-50">
        Piano v{dati.versione} · aggiornato {formatData(dati.aggiornato)}
      </p>
    </footer>
  )
}
