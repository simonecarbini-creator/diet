// Le scelte fatte in un giorno: merenda, sostituzioni, pasti consumati.
// Valgono solo per quella data e non modificano il piano.
import { useEffect, useState } from 'react'
import { leggi, scrivi } from './archivio'
import type { CategoriaConId, CategoriaPasto } from './dati'

export type StatoGiorno = {
  /** Pasti scelti al posto di quelli del piano (o la merenda, se il piano non la indica). */
  scelte: Partial<Record<CategoriaConId, string>>
  consumati: CategoriaPasto[]
  /** Diario: cosa è stato mangiato davvero, se diverso dal piano (facoltativo). */
  note?: Partial<Record<CategoriaPasto, string>>
}

const statoVuoto: StatoGiorno = { scelte: {}, consumati: [] }

export async function leggiStatoGiorno(data: string): Promise<StatoGiorno> {
  try {
    return (await leggi<StatoGiorno>(`giorno:${data}`)) ?? statoVuoto
  } catch {
    return statoVuoto
  }
}

export function useStatoGiorno(data: string) {
  const [caricato, setCaricato] = useState<{ data: string; stato: StatoGiorno } | null>(null)

  useEffect(() => {
    let annullato = false
    void leggiStatoGiorno(data).then((stato) => {
      if (!annullato) setCaricato({ data, stato })
    })
    return () => {
      annullato = true
    }
  }, [data])

  const stato = caricato?.data === data ? caricato.stato : statoVuoto

  function aggiorna(nuovo: StatoGiorno) {
    setCaricato({ data, stato: nuovo })
    void scrivi(`giorno:${data}`, nuovo)
  }

  return {
    stato,
    /** id null, o uguale a quello del piano, torna al piano. */
    scegli(categoria: CategoriaConId, id: string | null, idPiano: string | null) {
      const scelte = { ...stato.scelte }
      if (id === null || id === idPiano) delete scelte[categoria]
      else scelte[categoria] = id
      aggiorna({ ...stato, scelte })
    },
    annota(categoria: CategoriaPasto, testo: string) {
      const note = { ...stato.note }
      if (testo.trim()) note[categoria] = testo.trim()
      else delete note[categoria]
      aggiorna({ ...stato, note })
    },
    segnaConsumato(categoria: CategoriaPasto, consumato: boolean) {
      const consumati = stato.consumati.filter((c) => c !== categoria)
      aggiorna({ ...stato, consumati: consumato ? [...consumati, categoria] : consumati })
    },
  }
}

/** Le scelte salvate di più giorni (es. una settimana), lette una volta all'apertura. */
export function useStatiGiorni(date: string[]): Record<string, StatoGiorno> {
  const [stati, setStati] = useState<Record<string, StatoGiorno>>({})
  const chiave = date.join(',')
  useEffect(() => {
    let annullato = false
    const elenco = chiave ? chiave.split(',') : []
    void Promise.all(elenco.map(leggiStatoGiorno)).then((letti) => {
      if (!annullato) setStati(Object.fromEntries(elenco.map((d, i) => [d, letti[i]])))
    })
    return () => {
      annullato = true
    }
  }, [chiave])
  return stati
}
