// Navigazione tra le schermate tramite l'hash dell'indirizzo:
// così il tasto indietro del telefono funziona e ogni giorno ha un suo link.
import { useEffect, useState } from 'react'

export type Rotta =
  | { schermata: 'oggi' }
  | { schermata: 'prova' }
  | { schermata: 'nuova' }
  | { schermata: 'calcoli' }
  | { schermata: 'mese'; mese: string | null }
  | { schermata: 'settimana'; numero: number | null }
  | { schermata: 'giorno'; data: string }

function leggiRotta(hash: string): Rotta {
  const parti = hash.replace(/^#\/?/, '').split('/')
  if (parti[0] === 'oggi') return { schermata: 'oggi' }
  if (parti[0] === 'prova') return { schermata: 'prova' }
  if (parti[0] === 'nuova') return { schermata: 'nuova' }
  if (parti[0] === 'calcoli') return { schermata: 'calcoli' }
  if (parti[0] === 'mese') {
    return { schermata: 'mese', mese: /^\d{4}-\d{2}$/.test(parti[1] ?? '') ? parti[1] : null }
  }
  if (parti[0] === 'giorno' && /^\d{4}-\d{2}-\d{2}$/.test(parti[1] ?? '')) {
    return { schermata: 'giorno', data: parti[1] }
  }
  if (parti[0] === 'settimana') {
    const numero = Number(parti[1])
    return { schermata: 'settimana', numero: parti[1] && Number.isInteger(numero) ? numero : null }
  }
  // All'avvio, o con un indirizzo sconosciuto, si apre la Settimana.
  return { schermata: 'settimana', numero: null }
}

export const link = {
  oggi: '#/oggi',
  nuova: '#/nuova',
  calcoli: '#/calcoli',
  mese: (mese?: string) => (mese === undefined ? '#/mese' : `#/mese/${mese}`),
  settimana: (numero?: number) => (numero === undefined ? '#/settimana' : `#/settimana/${numero}`),
  giorno: (data: string) => `#/giorno/${data}`,
}

/** L'ultima vista d'insieme aperta (Mese o Settimana): il dettaglio del giorno ci torna. */
export type Provenienza = { schermata: 'mese' | 'settimana'; href: string }
let provenienza: Provenienza = { schermata: 'settimana', href: link.settimana() }

function ricordaProvenienza(rotta: Rotta) {
  if (rotta.schermata === 'mese' || rotta.schermata === 'settimana') {
    provenienza = { schermata: rotta.schermata, href: window.location.hash || link.settimana() }
  }
}

export function useRotta(): { rotta: Rotta; provenienza: Provenienza } {
  const [rotta, setRotta] = useState(() => {
    const iniziale = leggiRotta(window.location.hash)
    ricordaProvenienza(iniziale)
    return iniziale
  })
  useEffect(() => {
    const aggiorna = () => {
      const nuova = leggiRotta(window.location.hash)
      ricordaProvenienza(nuova)
      setRotta(nuova)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', aggiorna)
    return () => window.removeEventListener('hashchange', aggiorna)
  }, [])
  return { rotta, provenienza }
}
