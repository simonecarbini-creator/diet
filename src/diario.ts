// Il diario (vista Mese, Registro, esiti dei giorni, note sui pasti) è facoltativo:
// l'app serve prima di tutto a leggere il piano. Si attiva dal menu; spento di serie.
// Spegnerlo nasconde soltanto: i dati salvati restano sul telefono.
import { useSyncExternalStore } from 'react'
import { leggi, scrivi } from './archivio'

const CHIAVE = 'diario'
let attivo = false
let versione = 0
const ascoltatori = new Set<() => void>()

/** Da chiamare una volta prima del primo render. */
export async function caricaDiario(): Promise<void> {
  attivo = (await leggi<boolean>(CHIAVE).catch(() => undefined)) ?? false
}

export async function impostaDiario(nuovo: boolean): Promise<void> {
  attivo = nuovo
  versione++
  ascoltatori.forEach((ascolta) => ascolta())
  await scrivi(CHIAVE, nuovo)
}

export function useDiario(): boolean {
  useSyncExternalStore(
    (ascolta) => {
      ascoltatori.add(ascolta)
      return () => ascoltatori.delete(ascolta)
    },
    () => versione,
  )
  return attivo
}
