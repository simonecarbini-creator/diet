// L'obiettivo del piano: una gara con la sua data, oppure il mantenimento.
// Si cambia dal menu (Cambia piano); lo storico resta salvato sul telefono.
// Il primo obiettivo è la gara di dati.json (atleta.gara).
import { useSyncExternalStore } from 'react'
import { leggi, scrivi } from './archivio'
import { dati } from './dati'

export type Obiettivo =
  | { tipo: 'gara'; nome: string; data: string; dal: string }
  | { tipo: 'mantenimento'; dal: string }

const CHIAVE = 'obiettivi'
let elenco: Obiettivo[] = []
let versione = 0
const ascoltatori = new Set<() => void>()

function iniziale(): Obiettivo {
  const primoGiorno = dati.settimane.flatMap((s) => s.giorni.map((g) => g.data)).sort()[0] ?? dati.aggiornato
  return { tipo: 'gara', nome: dati.atleta.gara.nome, data: dati.atleta.gara.data, dal: primoGiorno }
}

/** Da chiamare una volta prima del primo render. */
export async function caricaObiettivi(): Promise<void> {
  const salvati = await leggi<Obiettivo[]>(CHIAVE).catch(() => undefined)
  elenco = salvati && salvati.length > 0 ? salvati : [iniziale()]
}

/** Dal più vecchio al più recente: l'ultimo è quello attivo. */
export function obiettivi(): Obiettivo[] {
  return elenco
}

export function obiettivoAttivo(): Obiettivo {
  return elenco[elenco.length - 1] ?? iniziale()
}

export async function impostaObiettivo(nuovo: Obiettivo): Promise<void> {
  elenco = [...elenco, nuovo]
  await scrivi(CHIAVE, elenco)
  versione++
  ascoltatori.forEach((ascolta) => ascolta())
}

export function useObiettivo(): Obiettivo {
  useSyncExternalStore(
    (ascolta) => {
      ascoltatori.add(ascolta)
      return () => ascoltatori.delete(ascolta)
    },
    () => versione,
  )
  return obiettivoAttivo()
}

/** Giorni da oggi alla data (negativi se è passata). */
export function giorniA(oggi: string, data: string): number {
  const [a1, m1, g1] = oggi.split('-').map(Number)
  const [a2, m2, g2] = data.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86_400_000)
}
