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

/** Pasto libero della giornata di sgarro; i valori sono facoltativi (se si conoscono). */
export type PastoLibero = { testo: string; kcal?: number; cho?: number; proteine?: number }

/** I pasti liberi salvati prima dei valori erano solo testo. */
export function comeLibero(valore: string | PastoLibero): PastoLibero {
  return typeof valore === 'string' ? { testo: valore } : valore
}

export function haValori(libero: PastoLibero): boolean {
  return libero.kcal !== undefined && libero.cho !== undefined && libero.proteine !== undefined
}

export type VocePasto = {
  categoria: CategoriaPasto
  orario: string
  /** Il pasto effettivo. null: da scegliere (merenda non assegnata) o id non trovato. */
  pasto: PastoRisolto | null
  /** Il pasto previsto dal piano, se diverso da quello scelto per oggi. */
  delPiano?: PastoRisolto | null
  /** Id previsto dal piano (null se il piano lo lascia da scegliere). */
  idPiano: string | null
  /** Giornata libera: cosa si è mangiato al posto del pasto (testo '' = ancora da scrivere). */
  libero?: PastoLibero
}

export function vociDelGiorno(
  giorno: Giorno,
  scelte: Partial<Record<CategoriaConId, string>> = {},
  liberi: Partial<Record<CategoriaPasto, string | PastoLibero>> = {},
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
    if (libero !== undefined) voce.libero = comeLibero(libero)
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
  /** Pasti liberi senza valori (CHO non dichiarati): esclusi dalla somma. */
  pastiLiberi: CategoriaPasto[]
}

/** Somma dei pasti assegnati. Il gel in corsa non è un pasto e non entra mai qui. */
export function totaliPasti(voci: VocePasto[]): TotaliPasti {
  const totali: TotaliPasti = { kcal: 0, cho: 0, proteine: 0, senzaProteine: [], pastiMancanti: [], pastiLiberi: [] }
  for (const { categoria, pasto, libero } of voci) {
    if (libero !== undefined) {
      if (haValori(libero)) {
        totali.kcal += libero.kcal ?? 0
        totali.cho += libero.cho ?? 0
        totali.proteine += libero.proteine ?? 0
      } else {
        totali.pastiLiberi.push(categoria)
      }
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

type StatoPerEsito = {
  scelte: Partial<Record<CategoriaConId, string>>
  consumati: CategoriaPasto[]
  sgarro?: boolean
  liberi?: Partial<Record<CategoriaPasto, string | PastoLibero>>
}

/**
 * Giornata libera "equivalente": tutti i pasti liberi hanno i valori e kcal, CHO e proteine
 * del giorno restano entro la tolleranza di dati.json rispetto ai pasti del piano.
 */
/** Le scelte del giorno senza gli sgarri (pizza, sushi…): il piano con cui confrontarli. */
function senzaSgarri(scelte: Partial<Record<CategoriaConId, string>>): Partial<Record<CategoriaConId, string>> {
  return Object.fromEntries(
    Object.entries(scelte).filter(([categoria, id]) => !trovaPasto(categoria as CategoriaConId, id)?.daSgarro),
  )
}

function conSgarri(scelte: Partial<Record<CategoriaConId, string>>): boolean {
  return Object.keys(senzaSgarri(scelte)).length < Object.keys(scelte).length
}

export function giornataEquivalente(giorno: Giorno, stato: StatoPerEsito): boolean {
  const piano = totaliPasti(vociDelGiorno(giorno, senzaSgarri(stato.scelte)))
  const reale = totaliPasti(vociDelGiorno(giorno, stato.scelte, stato.liberi ?? {}))
  if (reale.pastiLiberi.length > 0) return false
  // Merenda libera dove il piano non ne ha scelta una: si confronta con la merenda media
  // (kcal e CHO; la media non ha le proteine, quindi le proteine non si confrontano).
  const merendaStimata = stato.liberi?.merenda !== undefined && piano.pastiMancanti.includes('merenda')
  if (merendaStimata) {
    const media = merendaMedia()
    piano.kcal += media.kcal
    piano.cho += media.cho
  }
  const tolleranza = dati.regole.giornataLibera.tolleranzaPercento / 100
  const vicino = (valore: number, riferimento: number) => Math.abs(valore - riferimento) <= riferimento * tolleranza
  // Le proteine si confrontano solo se il piano le riporta per tutti i pasti.
  const proteine = !merendaStimata && piano.senzaProteine.length === 0 && reale.senzaProteine.length === 0
  return vicino(reale.kcal, piano.kcal) && vicino(reale.cho, piano.cho) && (!proteine || vicino(reale.proteine, piano.proteine))
}

/**
 * Riepilogo del giorno dai pasti spuntati: tutti → rispettato, nessuno → non dichiarato,
 * solo alcuni → non rispettato. La merenda non scelta conta come non consumata.
 * Un pasto libero o uno sgarro scelti in un giorno normale contano come spuntati, ma il giorno
 * è rispettato solo se i totali restano equivalenti al piano (come nella giornata libera).
 */
export function esitoGiorno(
  giorno: Giorno,
  stato: StatoPerEsito,
): { esito: Esito; fatti: number; totali: number } {
  const liberi = stato.sgarro ? {} : (stato.liberi ?? {})
  const voci = vociDelGiorno(giorno, stato.scelte, liberi)
  const fatti = voci.filter((v) => (v.pasto || v.libero) && stato.consumati.includes(v.categoria)).length
  const tuttiFatti = fatti === voci.length
  const fuoriPiano = Object.keys(liberi).length > 0 || conSgarri(stato.scelte)
  // Giornata libera: rispettata solo se i totali restano equivalenti al piano.
  const esito = stato.sgarro
    ? giornataEquivalente(giorno, stato) ? 'rispettato' : 'nonRispettato'
    : fatti === 0
      ? 'nonDichiarato'
      : tuttiFatti && (!fuoriPiano || giornataEquivalente(giorno, stato))
        ? 'rispettato'
        : 'nonRispettato'
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

/**
 * CHO e kcal del giorno senza un pasto, per valutare un'alternativa: gli altri pasti assegnati
 * più la merenda media se la merenda non è ancora scelta (come nel totale del piano).
 */
export function totaliSenza(voci: VocePasto[], categoria: CategoriaPasto): { cho: number; kcal: number } {
  const altri = voci.filter((v) => v.categoria !== categoria)
  const merendaDaStimare = altri.some((v) => v.categoria === 'merenda' && !v.pasto && v.libero === undefined)
  const totali = totaliPasti(altri)
  const stima = merendaDaStimare ? merendaMedia() : { cho: 0, kcal: 0 }
  return { cho: totali.cho + stima.cho, kcal: totali.kcal + stima.kcal }
}

export type TargetGiorno = {
  cho: { piano: number; da: number; a: number }
  kcal: { piano: number; da: number; a: number }
  margine: number
}

/** Il piano del giorno (CHO e kcal) con il margine di dati.json (regole.sceltaPasti). */
export function targetGiorno(piano: { cho: number; kcal: number }): TargetGiorno {
  const margine = dati.regole.sceltaPasti.tolleranzaPercento
  const fascia = (valore: number) => ({
    piano: valore,
    da: Math.round(valore * (1 - margine / 100)),
    a: Math.round(valore * (1 + margine / 100)),
  })
  return { cho: fascia(piano.cho), kcal: fascia(piano.kcal), margine }
}

/**
 * Dove arriva la giornata scegliendo un pasto al posto di un altro, e se resta nel target:
 * CHO e kcal entrambi entro il margine del piano del giorno.
 */
export function valutaAlternativa(
  senzaQuesto: { cho: number; kcal: number },
  opzione: { cho: number; kcal: number },
  target: TargetGiorno,
): { cho: number; kcal: number; choDentro: boolean; kcalDentro: boolean; nelTarget: boolean } {
  const cho = senzaQuesto.cho + opzione.cho
  const kcal = senzaQuesto.kcal + opzione.kcal
  const choDentro = cho >= target.cho.da && cho <= target.cho.a
  const kcalDentro = kcal >= target.kcal.da && kcal <= target.kcal.a
  return { cho, kcal, choDentro, kcalDentro, nelTarget: choDentro && kcalDentro }
}
