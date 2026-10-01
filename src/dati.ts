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

/** I pasti della giornata, nelle chiavi usate da `orariPasti`. */
export type CategoriaPasto = Exclude<keyof Dati['orariPasti'], '_nota'>

/** Le categorie che il calendario assegna per id (es. "pranzo": "P1"). */
export type CategoriaConId = 'colazione' | 'spuntino' | 'pranzo' | 'cena' | 'merenda'

export type Alimento = {
  nome: string
  grammi?: number | null
  pezzi?: number
  note?: string
  sostituibileCon?: string[]
  /** Aggiunto alla colazione base (es. nella MAGG). */
  aggiunto?: boolean
}

/** Un pasto come riferito dal calendario (es. "P1", "P3+", "C1rid", "Mrid"). */
export type PastoRisolto = {
  id: string
  nome: string
  kcal: number
  cho: number
  /** null quando il JSON non lo riporta (es. versioni ridotte e maggiorate). */
  proteine: number | null
  /** Vuoto per le merende, che hanno solo `composizione`. */
  alimenti: Alimento[]
  composizione?: string
  /** Per versioni ridotte e maggiorate: le modifiche rispetto al pasto base. */
  modifiche?: string
  /** Id del pasto da cui deriva la versione ridotta, maggiorata o variante. */
  base?: string
  /** Indicazione testuale di quando consumarlo (es. colazione "al rientro…"). */
  quando?: string
  note?: string
  varianti?: { nome: string; alimenti: Alimento[] }[]
  /** Merende: tag per filtrare (ufficio, salata…). */
  tags?: string[]
  /** Cene: tipi giornata in cui il pasto è ammesso (es. C4 solo VERDE e GRIGIO). */
  soloTipiGiornata?: string[]
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
  alimenti: Alimento[]
  note?: string
  soloTipiGiornata?: string[]
  ridotto?: { id: string; kcal: number; cho: number; modifiche: string }
  maggiorato?: { id: string; kcal: number; cho: number; modifiche: string }
  varianti?: {
    id: string
    nome: string
    kcal: number
    cho: number
    proteine: number
    alimenti: Alimento[]
    note?: string
  }[]
}

function cercaConVersioni(elenco: ConVersioni[], id: string): PastoRisolto | null {
  for (const pasto of elenco) {
    if (pasto.id === id) {
      const { ridotto: _r, maggiorato: _m, varianti: _v, ...resto } = pasto
      return resto
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
          alimenti: pasto.alimenti,
          modifiche: versione.modifiche,
          base: pasto.id,
          note: pasto.note,
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

function trovaColazione(id: string): PastoRisolto | null {
  const colazione = dati.blocchi.colazioni.find((c) => c.id === id)
  if (!colazione) return null
  const base = colazione.base
    ? dati.blocchi.colazioni.find((c) => c.id === colazione.base)
    : undefined
  const rimozioni = colazione.rimozioni ?? []
  const alimenti: Alimento[] = [
    ...(colazione.alimenti ?? base?.alimenti ?? []).filter((a) => !rimozioni.includes(a.nome)),
    ...(colazione.aggiunte ?? []).map((a) => ({ ...a, aggiunto: true })),
  ]
  return {
    id,
    nome: colazione.nome,
    kcal: colazione.kcal,
    cho: colazione.cho,
    proteine: colazione.proteine,
    alimenti,
    base: colazione.base,
    quando: colazione.orario ?? base?.orario,
    note: colazione.note ?? base?.note,
  }
}

export function trovaPasto(categoria: CategoriaConId, id: string): PastoRisolto | null {
  switch (categoria) {
    case 'colazione':
      return trovaColazione(id)
    case 'spuntino': {
      const spuntino = dati.blocchi.spuntini.find((s) => s.id === id)
      return spuntino ? { ...spuntino } : null
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
            nome: merenda.id,
            kcal: merenda.kcal,
            cho: merenda.cho,
            proteine: merenda.proteine,
            alimenti: [],
            composizione: merenda.composizione,
            tags: 'tags' in merenda ? merenda.tags : [],
          }
        : null
    }
  }
}

export function preCorsa(): PastoRisolto {
  return { ...dati.blocchi.preCorsa }
}

export function spuntinoSerale(): PastoRisolto {
  return { ...dati.blocchi.spuntinoSerale }
}

/** Id di tutti i pasti che si possono scegliere per una categoria, nell'ordine del JSON. */
export function idAlternative(categoria: CategoriaConId): string[] {
  const conVersioni = (elenco: ConVersioni[]) =>
    elenco.flatMap((p) => [
      p.id,
      ...(p.varianti ?? []).map((v) => v.id),
      ...(p.maggiorato ? [p.maggiorato.id] : []),
      ...(p.ridotto ? [p.ridotto.id] : []),
    ])
  switch (categoria) {
    case 'colazione':
      return dati.blocchi.colazioni.map((c) => c.id)
    case 'spuntino':
      return dati.blocchi.spuntini.map((s) => s.id)
    case 'pranzo':
      return conVersioni(dati.pranzi)
    case 'cena':
      return conVersioni(dati.cene)
    case 'merenda':
      return [...dati.merende.map((m) => m.id), dati.merendaRidotta.id]
  }
}

export function isCategoriaConId(categoria: CategoriaPasto): categoria is CategoriaConId {
  return ['colazione', 'spuntino', 'pranzo', 'cena', 'merenda'].includes(categoria)
}
