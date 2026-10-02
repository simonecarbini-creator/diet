// Unico punto di accesso a dati.json.
// L'assegnazione a `Dati` fa fallire la compilazione se il JSON non rispetta i tipi
// generati (npm run tipi).
import datiJson from '../dati.json'
import type { Dati } from './tipi/dati.generati'
import { pastiUtente } from './pastiUtente'

export const dati: Dati = datiJson

// Alias leggibili, derivati dalla forma di Dati: seguono il JSON se cambia.
export type Settimana = Dati['settimane'][number]
export type Giorno = Settimana['giorni'][number]
export type TipoGiornata = keyof Dati['tipiGiornata']
export type InfoTipoGiornata = Dati['tipiGiornata'][TipoGiornata]
export type Vincolo = Dati['regole']['vincoliSettimanali'][number]

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
  /** Aggiunto al pasto base (es. nella colazione MAGG). */
  aggiunto?: boolean
  /** Tolto rispetto al pasto base (es. il pane nel P1rid): si mostra barrato. */
  rimosso?: boolean
  /** Grammi del pasto base, quando la versione ridotta o maggiorata li cambia. */
  grammiBase?: number | null
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
  /** Per versioni ridotte e maggiorate: indicazione aggiuntiva (es. P3+ "in alternativa…"). */
  notaVersione?: string
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
  /** Alternativa aggiunta dall'utente nell'app (non è in dati.json). */
  utente?: boolean
}

export function isTipoGiornata(tipo: string): tipo is TipoGiornata {
  return Object.hasOwn(dati.tipiGiornata, tipo)
}

type Versione = {
  id: string
  kcal: number
  cho: number
  modificheGrammi: { nome: string; grammi: number }[]
  rimozioni?: string[]
  nota?: string
}

/** Applica a una lista base le modifiche di grammi, le rimozioni e le aggiunte. */
function applicaModifiche(
  base: Alimento[],
  modifiche: { modificheGrammi?: { nome: string; grammi: number }[]; rimozioni?: string[]; aggiunte?: Alimento[] },
): Alimento[] {
  return [
    ...base.map((alimento) => {
      if (modifiche.rimozioni?.includes(alimento.nome)) return { ...alimento, rimosso: true }
      const nuovo = modifiche.modificheGrammi?.find((m) => m.nome === alimento.nome)
      return nuovo ? { ...alimento, grammi: nuovo.grammi, grammiBase: alimento.grammi } : alimento
    }),
    ...(modifiche.aggiunte ?? []).map((a) => ({ ...a, aggiunto: true })),
  ]
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
  ridotto?: Versione
  maggiorato?: Versione
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
          alimenti: applicaModifiche(pasto.alimenti, versione),
          notaVersione: versione.nota,
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
  const alimenti = applicaModifiche(colazione.alimenti ?? base?.alimenti ?? [], colazione)
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
  return trovaPastoDelPiano(categoria, id) ?? trovaPastoUtente(categoria, id)
}

function trovaPastoUtente(categoria: CategoriaConId, id: string): PastoRisolto | null {
  const p = pastiUtente().find((u) => u.id === id && u.categoria === categoria)
  if (!p) return null
  return {
    id: p.id,
    nome: p.nome,
    kcal: p.kcal,
    cho: p.cho,
    proteine: p.proteine,
    alimenti: p.alimenti,
    base: p.base ?? undefined,
    note: p.note,
    utente: true,
    // Le merende si mostrano con la loro composizione.
    ...(categoria === 'merenda' ? { composizione: p.nome } : {}),
  }
}

function trovaPastoDelPiano(categoria: CategoriaConId, id: string): PastoRisolto | null {
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

/**
 * Id di tutti i pasti che si possono scegliere per una categoria, nell'ordine del JSON;
 * le alternative dell'utente seguono il loro pasto base (o vanno in fondo).
 */
export function idAlternative(categoria: CategoriaConId): string[] {
  const utente = pastiUtente().filter((u) => u.categoria === categoria)
  const conVersioni = (elenco: ConVersioni[]) =>
    elenco.flatMap((p) => [
      p.id,
      ...(p.varianti ?? []).map((v) => v.id),
      ...(p.maggiorato ? [p.maggiorato.id] : []),
      ...(p.ridotto ? [p.ridotto.id] : []),
      ...utente.filter((u) => u.base === p.id).map((u) => u.id),
    ])
  const senzaBase = (ids: string[]) => [...ids, ...utente.filter((u) => !ids.includes(u.base ?? '') && !ids.includes(u.id)).map((u) => u.id)]
  switch (categoria) {
    case 'colazione':
      return senzaBase(dati.blocchi.colazioni.map((c) => c.id))
    case 'spuntino':
      return senzaBase(dati.blocchi.spuntini.map((s) => s.id))
    case 'pranzo':
      return senzaBase(conVersioni(dati.pranzi))
    case 'cena':
      return senzaBase(conVersioni(dati.cene))
    case 'merenda':
      return senzaBase([...dati.merende.map((m) => m.id), dati.merendaRidotta.id])
  }
}

export function isCategoriaConId(categoria: CategoriaPasto): categoria is CategoriaConId {
  return ['colazione', 'spuntino', 'pranzo', 'cena', 'merenda'].includes(categoria)
}
