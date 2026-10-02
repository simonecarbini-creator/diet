import type { ReactNode } from 'react'
import { Popup } from './Popup'

type Props = {
  titolo: string
  children: ReactNode
  etichettaConferma: string
  /** Azione che toglie qualcosa: pulsante rosso. */
  distruttiva?: boolean
  onConferma: () => void
  onAnnulla: () => void
}

/** Richiesta di conferma nello stile dell'app (al posto di window.confirm). */
export function Conferma({ titolo, children, etichettaConferma, distruttiva = false, onConferma, onAnnulla }: Props) {
  return (
    <Popup titolo={titolo} onChiudi={onAnnulla} conConferma={false}>
      <div className="text-sm leading-relaxed">{children}</div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button type="button" onClick={onAnnulla} className="rounded-xl border border-bordo p-3 font-medium">
          Annulla
        </button>
        <button
          type="button"
          onClick={onConferma}
          className={`rounded-xl p-3 font-bold text-white ${distruttiva ? 'bg-ko' : 'bg-cho'}`}
        >
          {etichettaConferma}
        </button>
      </div>
    </Popup>
  )
}
