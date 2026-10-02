// Menu laterale: si apre da destra con il pulsante ad hamburger, che diventa una X.
// Animazioni brevi, disattivate con "Riduci movimento" del telefono.
import { useEffect } from 'react'
import { link } from '../navigazione'

type Props = {
  aperto: boolean
  onApri: () => void
  onChiudi: () => void
}

const voci = [
  { href: link.registro, titolo: 'Registro', descrizione: 'Peso, diario dei pasti ed export' },
  { href: link.nuova, titolo: 'Nuova settimana', descrizione: 'Inserisci la scheda e prepara il piano' },
  { href: link.calcoli, titolo: 'Calcoli', descrizione: "Come l'app sceglie pasti, gel e giornate" },
  { href: link.piano, titolo: 'Cambia piano', descrizione: 'Obiettivo attivo, nuova gara o mantenimento' },
]

/** Le tre linee che diventano una X. */
export function PulsanteMenu({ aperto, onApri, onChiudi }: Props) {
  const linea = 'absolute left-0 h-0.5 w-6 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none'
  return (
    <button
      type="button"
      onClick={aperto ? onChiudi : onApri}
      aria-label={aperto ? 'Chiudi il menu' : 'Apri il menu'}
      aria-expanded={aperto}
      className="relative z-[60] -mr-2 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span className="relative block h-5 w-6">
        <span className={`${linea} ${aperto ? 'top-[9px] rotate-45' : 'top-0.5'}`} />
        <span className={`${linea} top-[9px] ${aperto ? 'opacity-0' : 'opacity-100'}`} />
        <span className={`${linea} ${aperto ? 'top-[9px] -rotate-45' : 'top-[17px]'}`} />
      </span>
    </button>
  )
}

export function Menu({ aperto, onChiudi }: Props) {
  useEffect(() => {
    if (!aperto) return
    const chiudiConEsc = (e: KeyboardEvent) => e.key === 'Escape' && onChiudi()
    window.addEventListener('keydown', chiudiConEsc)
    const precedente = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', chiudiConEsc)
      document.body.style.overflow = precedente
    }
  }, [aperto, onChiudi])

  return (
    <>
      <div
        onClick={onChiudi}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          aperto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <nav
        aria-label="Menu"
        inert={!aperto}
        className={`fixed inset-y-0 right-0 z-50 flex w-4/5 max-w-xs flex-col bg-superficie pt-[calc(4.5rem+env(safe-area-inset-top))] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          aperto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ul className="divide-y divide-bordo border-y border-bordo">
          {voci.map((voce) => (
            <li key={voce.href}>
              <a href={voce.href} onClick={onChiudi} className="block px-5 py-4">
                <span className="block text-lg font-semibold">{voce.titolo}</span>
                <span className="block text-sm opacity-70">{voce.descrizione}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
