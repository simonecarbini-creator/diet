// Navigazione tra le schermate tramite l'hash dell'indirizzo:
// così il tasto indietro del telefono funziona e ogni giorno ha un suo link.
import { useEffect, useState } from 'react'

export type Rotta =
  | { schermata: 'oggi' }
  | { schermata: 'prova' }
  | { schermata: 'settimana'; numero: number | null }
  | { schermata: 'giorno'; data: string }

function leggiRotta(hash: string): Rotta {
  const parti = hash.replace(/^#\/?/, '').split('/')
  if (parti[0] === 'oggi') return { schermata: 'oggi' }
  if (parti[0] === 'prova') return { schermata: 'prova' }
  if (parti[0] === 'settimana' || parti[0] === '') {
    const numero = Number(parti[1])
    return { schermata: 'settimana', numero: Number.isInteger(numero) && parti[1] ? numero : null }
  }
  if (parti[0] === 'giorno' && /^\d{4}-\d{2}-\d{2}$/.test(parti[1] ?? '')) {
    return { schermata: 'giorno', data: parti[1] }
  }
  // All'avvio, o con un indirizzo sconosciuto, si apre la Settimana.
  return { schermata: 'settimana', numero: null }
}

export function useRotta(): Rotta {
  const [rotta, setRotta] = useState(() => leggiRotta(window.location.hash))
  useEffect(() => {
    const aggiorna = () => {
      setRotta(leggiRotta(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', aggiorna)
    return () => window.removeEventListener('hashchange', aggiorna)
  }, [])
  return rotta
}

export const link = {
  oggi: '#/oggi',
  settimana: (numero?: number) => (numero === undefined ? '#/settimana' : `#/settimana/${numero}`),
  giorno: (data: string) => `#/giorno/${data}`,
}
