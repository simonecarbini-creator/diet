// Registro del peso: una pesata per data, salvata in IndexedDB.
import { useEffect, useState } from 'react'
import { leggi, scrivi } from './archivio'
import { giornoDopo } from './giornata'

export type Pesata = { data: string; kg: number }

const CHIAVE = 'pesi'

/** Pesate dalla più recente alla più vecchia. */
function ordina(pesate: Pesata[]): Pesata[] {
  return [...pesate].sort((a, b) => b.data.localeCompare(a.data))
}

export function usePesi() {
  const [pesate, setPesate] = useState<Pesata[]>([])

  useEffect(() => {
    void leggi<Pesata[]>(CHIAVE)
      .catch(() => undefined)
      .then((salvate) => setPesate(ordina(salvate ?? [])))
  }, [])

  function salva(nuove: Pesata[]) {
    const ordinate = ordina(nuove)
    setPesate(ordinate)
    void scrivi(CHIAVE, ordinate)
  }

  return {
    pesate,
    /** Una sola pesata per data: se la data esiste già, la sostituisce. */
    aggiungi(pesata: Pesata) {
      salva([...pesate.filter((p) => p.data !== pesata.data), pesata])
    },
    elimina(data: string) {
      salva(pesate.filter((p) => p.data !== data))
    },
  }
}

/** "75,2" o "75.2" → 75.2; null se non è un peso plausibile. */
export function leggiKg(testo: string): number | null {
  const valore = Number(testo.trim().replace(',', '.'))
  return Number.isFinite(valore) && valore >= 30 && valore <= 250 ? Math.round(valore * 10) / 10 : null
}

/**
 * Promemoria della pesata del giorno 1 del mese:
 * "vigilia" l'ultimo giorno del mese dalle 18, "oggi" il giorno 1 finché non c'è una pesata.
 */
export function promemoriaPesata(oggi: string, ora: string, pesate: Pesata[]): 'vigilia' | 'oggi' | null {
  if (oggi.endsWith('-01')) return pesate.some((p) => p.data === oggi) ? null : 'oggi'
  if (giornoDopo(oggi).endsWith('-01') && ora >= '18:00') return 'vigilia'
  return null
}
