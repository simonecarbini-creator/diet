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
export type CategoriaConId = 'colazione' | 'spuntino' | 'pranzo' | 'cena' | 'merenda' | 'spuntinoSerale'

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
  /** Spuntino serale: varianti, eventualmente con valori propri (kcal, CHO, proteine). */
  varianti?: { nome: string; alimenti: Alimento[]; kcal?: number; cho?: number; proteine?: number; note?: string }[]
  /** Merende: tag per filtrare (ufficio, salata…). */
  tags?: string[]
  /** Cene: tipi giornata in cui il pasto è ammesso (es. C4 solo VERDE e GRIGIO). */
  soloTipiGiornata?: string[]
  /** Alternativa aggiunta dall'utente nell'app (non è in dati.json). */
  utente?: boolean
  /** Pranzi, cene e merende: versione ridotta o maggiorata di un pasto base. */
  versione?: 'ridotto' | 'maggiorato'
  /** Colazioni: STD, MAGG o RID (la famiglia a cui appartiene l'alternativa). */
  tipoColazione?: string
  /** Sgarro (pizza, sushi, cornetto al bar…): al posto del pasto, fuori dal piano. */
  daSgarro?: boolean
}

export function isTipoGiornata(tipo: string): tipo is TipoGiornata {
  return Object.hasOwn(dati.tipiGiornata, tipo)
}

type Versione = {
  id: string
  kcal: number
  cho: number
  proteine?: number
  modificheGrammi: { nome: string; grammi: number }[]
  rimozioni?: string[]
  /** Alimenti in piu' rispetto al pasto base (es. P14+: un frutto). */
  aggiunte?: Alimento[]
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
          proteine: versione.proteine ?? null,
          alimenti: applicaModifiche(pasto.alimenti, versione),
          notaVersione: versione.nota,
          versione: etichetta,
          base: pasto.id,
          note: pasto.note,
          // Versioni e varianti valgono negli stessi tipi di giornata del pasto base (es. C4).
          soloTipiGiornata: pasto.soloTipiGiornata,
        }
      }
    }
    const variante = pasto.varianti?.find((v) => v.id === id)
    if (variante) {
      return { soloTipiGiornata: pasto.soloTipiGiornata, ...variante, base: pasto.id }
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
  // Ogni colazione ha la sua lista completa di alimenti; "Quando" è quello della STD.
  const std = dati.blocchi.colazioni.find((c) => c.id === 'STD')
  return {
    id,
    nome: colazione.nome,
    kcal: colazione.kcal,
    cho: colazione.cho,
    proteine: colazione.proteine,
    alimenti: colazione.alimenti,
    base: colazione.base !== colazione.id ? colazione.base : undefined,
    quando: colazione.orario ?? base?.orario ?? std?.orario,
    note: colazione.note ?? base?.note,
    notaVersione: 'modifiche' in colazione ? colazione.modifiche : undefined,
    tipoColazione: colazione.tipoColazione,
    tags: colazione.tags,
    daSgarro: colazione.tags.includes('sgarro') || undefined,
  }
}

/** Sgarri di dati.json che possono prendere il posto di un pranzo o di una cena. */
function trovaSgarro(categoria: 'pranzo' | 'cena', id: string): PastoRisolto | null {
  const sgarro = dati.sgarri.find((s) => s.id === id && s.momento.includes(categoria))
  if (!sgarro) return null
  const { momento: _m, base, ...resto } = sgarro
  return { ...resto, base, daSgarro: true }
}

/** I dolci si aggiungono a un pasto, non lo sostituiscono: per ora solo da consultare. */
export function dolci(): PastoRisolto[] {
  return dati.dolci.map((d) => ({ ...d }))
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
      return cercaConVersioni(dati.pranzi, id) ?? trovaSgarro('pranzo', id)
    case 'cena':
      return cercaConVersioni(dati.cene, id) ?? trovaSgarro('cena', id)
    case 'spuntinoSerale': {
      if (id === dati.blocchi.spuntinoSerale.id) return spuntinoSerale()
      const alternativa = dati.blocchi.spuntinoSerale.alternative.find((a) => a.id === id)
      return alternativa ? { ...alternativa } : null
    }
    case 'merenda': {
      const ridotte = [dati.merendaRidotta, ...dati.merendaRidotta.alternative]
      const merenda = [...dati.merende, ...ridotte].find((m) => m.id === id)
      return merenda
        ? {
            id,
            nome: merenda.id,
            kcal: merenda.kcal,
            cho: merenda.cho,
            proteine: merenda.proteine,
            alimenti: [],
            composizione: merenda.composizione,
            tags: 'tags' in merenda ? (merenda.tags as string[]) : [],
            ...(ridotte.includes(merenda as (typeof ridotte)[number]) ? { versione: 'ridotto' as const } : {}),
          }
        : null
    }
  }
}

export function preCorsa(): PastoRisolto {
  return { ...dati.blocchi.preCorsa }
}

/** Lo spuntino serale del piano (senza l'elenco delle alternative e i consigli). */
export function spuntinoSerale(): PastoRisolto {
  const { alternative: _a, consigli: _c, ...base } = dati.blocchi.spuntinoSerale
  return base
}

/** Un dolce di dati.json: si aggiunge a un pasto, non lo sostituisce. */
export function trovaDolce(id: string): PastoRisolto | null {
  const dolce = dati.dolci.find((d) => d.id === id)
  return dolce ? { ...dolce } : null
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
    case 'cena': {
      const elenco = categoria === 'pranzo' ? dati.pranzi : dati.cene
      const sgarri = dati.sgarri.filter((s) => s.momento.includes(categoria)).map((s) => s.id)
      return [...senzaBase(conVersioni(elenco)), ...sgarri]
    }
    case 'merenda':
      return senzaBase([...dati.merende.map((m) => m.id), dati.merendaRidotta.id, ...dati.merendaRidotta.alternative.map((m) => m.id)])
    case 'spuntinoSerale':
      return senzaBase([dati.blocchi.spuntinoSerale.id, ...dati.blocchi.spuntinoSerale.alternative.map((a) => a.id)])
  }
}

export function isCategoriaConId(categoria: CategoriaPasto): categoria is CategoriaConId {
  return ['colazione', 'spuntino', 'pranzo', 'cena', 'merenda', 'spuntinoSerale'].includes(categoria)
}
