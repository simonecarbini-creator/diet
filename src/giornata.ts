// Composizione della giornata a partire da un giorno del calendario.
import { valutaCondizione } from './condizioni'
import { settimane } from './piano'
import {
  dati,
  preCorsa,
  spuntinoSerale,
  trovaPasto,
  type CategoriaConId,
  type CategoriaPasto,
  type Giorno,
  type PastoRisolto,
  type Settimana,
} from './dati'

export type VocePasto = {
  categoria: CategoriaPasto
  orario: string
  /** Il pasto effettivo. null: da scegliere (merenda non assegnata) o id non trovato. */
  pasto: PastoRisolto | null
  /** Il pasto previsto dal piano, se diverso da quello scelto per oggi. */
  delPiano?: PastoRisolto | null
  /** Id previsto dal piano (null se il piano lo lascia da scegliere). */
  idPiano: string | null
  /** Giornata libera: cosa si è mangiato al posto del pasto ('' = ancora da scrivere). */
  libero?: string
}

export function vociDelGiorno(
  giorno: Giorno,
  scelte: Partial<Record<CategoriaConId, string>> = {},
  liberi: Partial<Record<CategoriaPasto, string>> = {},
): VocePasto[] {
  const orari = dati.orariPasti
  const voci: VocePasto[] = []

  const voce = (categoria: CategoriaConId, idPiano: string | null): VocePasto => {
    const delPiano = idPiano === null ? null : trovaPasto(categoria, idPiano)
    const idScelto = scelte[categoria]
    // Una scelta che non esiste più in dati.json viene ignorata.
    const scelto = idScelto && idScelto !== idPiano ? trovaPasto(categoria, idScelto) : null
    return scelto
      ? { categoria, orario: orari[categoria], pasto: scelto, delPiano, idPiano }
      : { categoria, orario: orari[categoria], pasto: delPiano, idPiano }
  }

  if (valutaCondizione(dati.blocchi.preCorsa.saltaSe, giorno) !== true) {
    voci.push({ categoria: 'preCorsa', orario: orari.preCorsa, pasto: preCorsa(), idPiano: null })
  }
  voci.push(
    voce('colazione', giorno.colazione),
    voce('spuntino', giorno.spuntino),
    voce('pranzo', giorno.pranzo),
    voce('merenda', giorno.merenda),
    voce('cena', giorno.cena),
  )
  if (giorno.spuntinoSerale) {
    voci.push({
      categoria: 'spuntinoSerale',
      orario: orari.spuntinoSerale,
      pasto: spuntinoSerale(),
      idPiano: null,
    })
  }

  for (const voce of voci) {
    const libero = liberi[voce.categoria]
    if (libero !== undefined) voce.libero = libero
  }
  return voci.sort((a, b) => a.orario.localeCompare(b.orario))
}

export type TotaliPasti = {
  kcal: number
  cho: number
  /** Somma delle proteine dei pasti che le riportano in dati.json. */
  proteine: number
  /** Id dei pasti senza proteine in dati.json (es. versioni ridotte e maggiorate). */
  senzaProteine: string[]
  /** Pasti senza valori (da scegliere): la somma è parziale. */
  pastiMancanti: CategoriaPasto[]
  /** Pasti liberi della giornata di sgarro: CHO non dichiarati, esclusi dalla somma. */
  pastiLiberi: CategoriaPasto[]
}

/** Somma dei pasti assegnati. Il gel in corsa non è un pasto e non entra mai qui. */
export function totaliPasti(voci: VocePasto[]): TotaliPasti {
  const totali: TotaliPasti = { kcal: 0, cho: 0, proteine: 0, senzaProteine: [], pastiMancanti: [], pastiLiberi: [] }
  for (const { categoria, pasto, libero } of voci) {
    if (libero !== undefined) {
      totali.pastiLiberi.push(categoria)
      continue
    }
    if (!pasto) {
      totali.pastiMancanti.push(categoria)
      continue
    }
    totali.kcal += pasto.kcal
    totali.cho += pasto.cho
    if (pasto.proteine === null) totali.senzaProteine.push(pasto.id)
    else totali.proteine += pasto.proteine
  }
  return totali
}

/** Pasto corrente: l'ultimo il cui orario è già passato (il primo, prima di tutti). */
export function indicePastoCorrente(voci: VocePasto[], ora: string): number {
  let indice = 0
  voci.forEach((voce, i) => {
    if (voce.orario <= ora) indice = i
  })
  return indice
}

export function cercaGiorno(data: string): { settimana: Settimana; giorno: Giorno } | null {
  for (const settimana of settimane()) {
    const giorno = settimana.giorni.find((g) => g.data === data)
    if (giorno) return { settimana, giorno }
  }
  return null
}

/** Data locale nel formato del calendario (AAAA-MM-GG). */
export function dataLocale(adesso: Date): string {
  const mese = String(adesso.getMonth() + 1).padStart(2, '0')
  const giorno = String(adesso.getDate()).padStart(2, '0')
  return `${adesso.getFullYear()}-${mese}-${giorno}`
}

export function oraLocale(adesso: Date): string {
  return `${String(adesso.getHours()).padStart(2, '0')}:${String(adesso.getMinutes()).padStart(2, '0')}`
}

export type Esito = 'rispettato' | 'nonRispettato' | 'nonDichiarato'

/**
 * Riepilogo del giorno dai pasti spuntati: tutti → rispettato, nessuno → non dichiarato,
 * solo alcuni → non rispettato. La merenda non scelta conta come non consumata.
 */
export function esitoGiorno(
  giorno: Giorno,
  stato: { scelte: Partial<Record<CategoriaConId, string>>; consumati: CategoriaPasto[]; sgarro?: boolean },
): { esito: Esito; fatti: number; totali: number } {
  const voci = vociDelGiorno(giorno, stato.scelte)
  const fatti = voci.filter((v) => v.pasto && stato.consumati.includes(v.categoria)).length
  // La giornata libera è sempre "non rispettato".
  const esito = stato.sgarro
    ? 'nonRispettato'
    : fatti === 0 ? 'nonDichiarato' : fatti === voci.length ? 'rispettato' : 'nonRispettato'
  return { esito, fatti, totali: voci.length }
}

/** "2026-10-03" → "2026-10-04" */
export function giornoDopo(data: string): string {
  const [anno, mese, giorno] = data.split('-').map(Number)
  return dataLocale(new Date(anno, mese - 1, giorno + 1))
}

/** Media delle merende M1-M12: la stima usata nel totale del piano quando la merenda non è scelta. */
export function merendaMedia(): { kcal: number; cho: number } {
  const n = dati.merende.length
  return {
    kcal: Math.round(dati.merende.reduce((s, m) => s + m.kcal, 0) / n),
    cho: Math.round(dati.merende.reduce((s, m) => s + m.cho, 0) / n),
  }
}

/** Totale del piano per un giorno creato nell'app: somma dei pasti, più la merenda media se non è assegnata. */
export function totaleDelPiano(giorno: Omit<Giorno, 'kcal' | 'cho'>): { kcal: number; cho: number } {
  const totali = totaliPasti(vociDelGiorno({ ...giorno, kcal: 0, cho: 0 }))
  const stima = giorno.merenda === null ? merendaMedia() : { kcal: 0, cho: 0 }
  return { kcal: totali.kcal + stima.kcal, cho: totali.cho + stima.cho }
}

/** "2026-10-05" + 2 → "2026-10-07" */
export function aggiungiGiorni(data: string, giorni: number): string {
  const [anno, mese, giorno] = data.split('-').map(Number)
  return dataLocale(new Date(anno, mese - 1, giorno + giorni))
}

/** 1 = lunedì … 7 = domenica */
export function giornoDellaSettimana(data: string): number {
  const [anno, mese, giorno] = data.split('-').map(Number)
  return new Date(anno, mese - 1, giorno).getDay() || 7
}
