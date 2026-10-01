// Composizione della giornata a partire da un giorno del calendario.
import { valutaCondizione } from './condizioni'
import {
  dati,
  preCorsa,
  spuntinoSerale,
  trovaPasto,
  type CategoriaPasto,
  type Giorno,
  type PastoRisolto,
  type Settimana,
} from './dati'

export type VocePasto = {
  categoria: CategoriaPasto
  orario: string
  /** null: pasto da scegliere (merenda non assegnata) o id non trovato. */
  pasto: PastoRisolto | null
}

export function vociDelGiorno(giorno: Giorno): VocePasto[] {
  const orari = dati.orariPasti
  const voci: VocePasto[] = []

  if (valutaCondizione(dati.blocchi.preCorsa.saltaSe, giorno) !== true) {
    voci.push({ categoria: 'preCorsa', orario: orari.preCorsa, pasto: preCorsa() })
  }
  voci.push(
    { categoria: 'colazione', orario: orari.colazione, pasto: trovaPasto('colazione', giorno.colazione) },
    { categoria: 'spuntino', orario: orari.spuntino, pasto: trovaPasto('spuntino', giorno.spuntino) },
    { categoria: 'pranzo', orario: orari.pranzo, pasto: trovaPasto('pranzo', giorno.pranzo) },
    {
      categoria: 'merenda',
      orario: orari.merenda,
      pasto: giorno.merenda === null ? null : trovaPasto('merenda', giorno.merenda),
    },
    { categoria: 'cena', orario: orari.cena, pasto: trovaPasto('cena', giorno.cena) },
  )
  if (giorno.spuntinoSerale) {
    voci.push({ categoria: 'spuntinoSerale', orario: orari.spuntinoSerale, pasto: spuntinoSerale() })
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
