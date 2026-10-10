// Alternative ai pasti aggiunte dall'utente nella sezione Pasti. Si salvano sul telefono,
// separate da dati.json: quando il piano del nutrizionista si aggiorna non si perdono.
// Hanno codici propri (es. "P1-u1") per non scontrarsi con quelli del JSON.
import { useSyncExternalStore } from 'react'
import { leggi, scrivi } from './archivio'
import type { CategoriaConId } from './dati'

export type PastoUtente = {
  id: string
  categoria: CategoriaConId
  /** Pasto del piano di cui è un'alternativa (pranzi e cene), es. "P1". */
  base: string | null
  nome: string
  kcal: number
  cho: number
  proteine: number
  alimenti: { nome: string; grammi: number | null }[]
  note?: string
  creato: string
}

const CHIAVE = 'pastiUtente'
let elenco: PastoUtente[] = []
let versione = 0
const ascoltatori = new Set<() => void>()

export async function caricaPastiUtente(): Promise<void> {
  elenco = (await leggi<PastoUtente[]>(CHIAVE).catch(() => undefined)) ?? []
}

export function pastiUtente(): PastoUtente[] {
  return elenco
}

const prefissi: Record<CategoriaConId, string> = {
  colazione: 'COL',
  spuntino: 'SPU',
  pranzo: 'P',
  cena: 'C',
  merenda: 'M',
  spuntinoSerale: 'SER',
}

/** Primo codice libero: "P1-u1", "P1-u2"… oppure "M-u1" per le categorie senza pasto base. */
export function nuovoId(categoria: CategoriaConId, base: string | null): string {
  const prefisso = `${base ?? prefissi[categoria]}-u`
  let n = 1
  while (elenco.some((p) => p.id === `${prefisso}${n}`)) n++
  return `${prefisso}${n}`
}

async function salva(nuovo: PastoUtente[]) {
  elenco = nuovo
  await scrivi(CHIAVE, elenco)
  versione++
  ascoltatori.forEach((ascolta) => ascolta())
}

export function aggiungiPastoUtente(pasto: Omit<PastoUtente, 'id' | 'creato'>): Promise<void> {
  return salva([...elenco, { ...pasto, id: nuovoId(pasto.categoria, pasto.base), creato: new Date().toISOString() }])
}

export function eliminaPastoUtente(id: string): Promise<void> {
  return salva(elenco.filter((p) => p.id !== id))
}

export function usePastiUtente(): PastoUtente[] {
  useSyncExternalStore(
    (ascolta) => {
      ascoltatori.add(ascolta)
      return () => ascoltatori.delete(ascolta)
    },
    () => versione,
  )
  return elenco
}
