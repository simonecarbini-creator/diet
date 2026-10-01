// Composizione della giornata a partire da un giorno del calendario.
import { valutaCondizione } from './condizioni'
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
}

export function vociDelGiorno(
  giorno: Giorno,
  scelte: Partial<Record<CategoriaConId, string>> = {},
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

  return voci.sort((a, b) => a.orario.localeCompare(b.orario))
}

export type TotaliPasti = {
  kcal: number
  cho: number
  /** null se almeno un pasto non ha le proteine in dati.json. */
  proteine: number | null
  /** Pasti senza valori (da scegliere): la somma è parziale. */
  pastiMancanti: CategoriaPasto[]
}

/** Somma dei pasti assegnati. Il gel in corsa non è un pasto e non entra mai qui. */
export function totaliPasti(voci: VocePasto[]): TotaliPasti {
  const totali: TotaliPasti = { kcal: 0, cho: 0, proteine: 0, pastiMancanti: [] }
  for (const { categoria, pasto } of voci) {
    if (!pasto) {
      totali.pastiMancanti.push(categoria)
      continue
    }
    totali.kcal += pasto.kcal
    totali.cho += pasto.cho
    totali.proteine =
      totali.proteine === null || pasto.proteine === null ? null : totali.proteine + pasto.proteine
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
  for (const settimana of dati.settimane) {
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
