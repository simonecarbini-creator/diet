import { useEffect, type ReactNode } from 'react'

type Props = {
  titolo: string
  onChiudi: () => void
  children: ReactNode
}

/** Finestra informativa dal basso: si chiude con ✕, "Ho capito" o toccando fuori. */
export function Popup({ titolo, onChiudi, children }: Props) {
  useEffect(() => {
    const precedente = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = precedente
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onChiudi}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titolo}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-superficie px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{titolo}</h2>
          <button
            type="button"
            onClick={onChiudi}
            aria-label="Chiudi"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-2xl"
          >
            ✕
          </button>
        </div>
        <div className="mt-2 space-y-3">{children}</div>
        <button type="button" onClick={onChiudi} className="mt-4 w-full rounded-xl border border-bordo p-3 font-medium">
          Ho capito
        </button>
      </div>
    </div>
  )
}
