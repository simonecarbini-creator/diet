// Unico punto di accesso a dati.json.
// L'assegnazione a `Dati` fa fallire la compilazione se il JSON non rispetta i tipi
// generati (npm run tipi).
import datiJson from '../dati.json'
import type { Dati } from './tipi/dati.generati'

export const dati: Dati = datiJson

// Alias leggibili, derivati dalla forma di Dati: seguono il JSON se cambia.
export type Settimana = Dati['settimane'][number]
export type Giorno = Settimana['giorni'][number]
export type TipoGiornata = keyof Dati['tipiGiornata']
export type InfoTipoGiornata = Dati['tipiGiornata'][TipoGiornata]

export type CategoriaPasto = 'colazione' | 'spuntino' | 'pranzo' | 'cena' | 'merenda'

/** Un pasto come riferito dal calendario (es. "P1", "P3+", "C1rid", "Mrid"). */
export type PastoRisolto = {
  id: string
  nome: string
  kcal: number
  cho: number
  /** null quando il JSON non lo riporta (es. versioni ridotte e maggiorate). */
  proteine: number | null
  /** Per versioni ridotte e maggiorate: le modifiche rispetto al pasto base. */
  modifiche?: string
  /** Id del pasto da cui deriva la versione ridotta, maggiorata o variante. */
  base?: string
}

export function isTipoGiornata(tipo: string): tipo is TipoGiornata {
  return Object.hasOwn(dati.tipiGiornata, tipo)
}

type ConVersioni = {
  id: string
  nome: string
  kcal: number
  cho: number
  proteine: number
  ridotto?: { id: string; kcal: number; cho: number; modifiche: string }
  maggiorato?: { id: string; kcal: number; cho: number; modifiche: string }
  varianti?: { id: string; nome: string; kcal: number; cho: number; proteine: number }[]
}

function cercaConVersioni(elenco: ConVersioni[], id: string): PastoRisolto | null {
  for (const pasto of elenco) {
    if (pasto.id === id) {
      return { id, nome: pasto.nome, kcal: pasto.kcal, cho: pasto.cho, proteine: pasto.proteine }
    }
    for (const [versione, etichetta] of [
      [pasto.ridotto, 'ridotto'],
      [pasto.maggiorato, 'maggiorato'],
    ] as const) {
      if (versione?.id === id) {
        return {
          id,
          nome: `${pasto.nome} (${etichetta})`,
          kcal: versione.kcal,
          cho: versione.cho,
          proteine: null,
          modifiche: versione.modifiche,
          base: pasto.id,
        }
      }
    }
    const variante = pasto.varianti?.find((v) => v.id === id)
    if (variante) {
      return { ...variante, base: pasto.id }
    }
  }
  return null
}

export function trovaPasto(categoria: CategoriaPasto, id: string): PastoRisolto | null {
  switch (categoria) {
    case 'colazione':
    case 'spuntino': {
      const elenco = categoria === 'colazione' ? dati.blocchi.colazioni : dati.blocchi.spuntini
      const pasto = elenco.find((p) => p.id === id)
      return pasto
        ? { id, nome: pasto.nome, kcal: pasto.kcal, cho: pasto.cho, proteine: pasto.proteine }
        : null
    }
    case 'pranzo':
      return cercaConVersioni(dati.pranzi, id)
    case 'cena':
      return cercaConVersioni(dati.cene, id)
    case 'merenda': {
      const merenda = [...dati.merende, dati.merendaRidotta].find((m) => m.id === id)
      return merenda
        ? {
            id,
            nome: merenda.composizione,
            kcal: merenda.kcal,
            cho: merenda.cho,
            proteine: merenda.proteine,
          }
        : null
    }
  }
}
