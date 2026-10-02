// Il calendario completo: le settimane di dati.json più quelle create nell'app
// (schermata Nuova settimana), salvate in IndexedDB. Se una data compare in
// entrambe, vince la settimana salvata sul telefono.
import { useSyncExternalStore } from 'react'
import { leggi, scrivi } from './archivio'
import { dati, type Settimana } from './dati'

const CHIAVE = 'settimane'
let salvate: Settimana[] = []
let versione = 0
const ascoltatori = new Set<() => void>()

/** Da chiamare una volta prima del primo render. */
export async function caricaPiano(): Promise<void> {
  salvate = (await leggi<Settimana[]>(CHIAVE).catch(() => undefined)) ?? []
}

function dateDi(settimana: Settimana): Set<string> {
  return new Set(settimana.giorni.map((g) => g.data))
}

function siSovrappone(a: Settimana, b: Settimana): boolean {
  const date = dateDi(b)
  return a.giorni.some((g) => date.has(g.data))
}

export function settimane(): Settimana[] {
  const dalJson = dati.settimane.filter((s) => !salvate.some((n) => siSovrappone(s, n)))
  return [...dalJson, ...salvate].sort((a, b) => a.dal.localeCompare(b.dal))
}

/** Le settimane che una nuova settimana sostituirebbe (stesse date). */
export function settimaneSovrapposte(nuova: Settimana): Settimana[] {
  return settimane().filter((s) => siSovrappone(s, nuova))
}

export async function salvaSettimana(nuova: Settimana): Promise<void> {
  salvate = [...salvate.filter((s) => !siSovrappone(s, nuova)), nuova]
  await scrivi(CHIAVE, salvate)
  versione++
  ascoltatori.forEach((ascolta) => ascolta())
}

/** Fa ridisegnare chi lo usa quando cambia il calendario. */
export function usePiano(): number {
  return useSyncExternalStore(
    (ascolta) => {
      ascoltatori.add(ascolta)
      return () => ascoltatori.delete(ascolta)
    },
    () => versione,
  )
}
