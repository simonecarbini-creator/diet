// Vincoli settimanali sui pasti, a partire da dati.json:
// - regole.vincoliSettimanali con "pasti" e "minimo"/"massimo" (es. pesce grasso C2 o P9
//   almeno 3 volte; carne P13 o C13 al massimo 1 volta in totale);
// - soloTipiGiornata e incompatibileCon sui singoli pranzi e cene.
import { dati, trovaPasto, type Giorno, type Vincolo } from './dati'
import { formatDataBreve } from './formato'

export type EsitoVincolo = {
  id: string
  testo: string
  limite: string
  rispettato: boolean
  /** Giorni che violano il vincolo, se pertinente. */
  dettaglio?: string
}

/** Pranzo e cena effettivi di un giorno; null se non contano (es. pasto libero). */
export type PastiDelGiorno = { pranzo: string | null; cena: string | null }

export type ConteggioVincolo = {
  vincolo: Vincolo
  /** Volte in cui uno dei pasti del vincolo compare (pranzo e cena contano separatamente). */
  volte: number
  giorni: string[]
  minimo?: number
  massimo?: number
}

/** Id del pasto base: "C2rid" → "C2", "P1-u1" → "P1". */
export function idBase(categoria: 'pranzo' | 'cena', id: string): string {
  return trovaPasto(categoria, id)?.base ?? id
}

/** I vincoli che si contano: hanno dei pasti e un minimo o un massimo a settimana. */
function vincoliConLimite(): Vincolo[] {
  return dati.regole.vincoliSettimanali.filter(
    (v) => v.pasti && ('minimo' in v || 'massimo' in v),
  )
}

const limiti = (v: Vincolo) => ({
  minimo: 'minimo' in v ? (v.minimo as number) : undefined,
  massimo: 'massimo' in v ? (v.massimo as number) : undefined,
})

/** Gli id base di pranzo e cena di un giorno. */
function basiDelGiorno(pasti: PastiDelGiorno): string[] {
  return [
    ...(pasti.pranzo ? [idBase('pranzo', pasti.pranzo)] : []),
    ...(pasti.cena ? [idBase('cena', pasti.cena)] : []),
  ]
}

export function conteggiVincoli(
  giorni: Giorno[],
  pastiDelGiorno: (g: Giorno) => PastiDelGiorno,
): Record<string, ConteggioVincolo> {
  const conteggi: Record<string, ConteggioVincolo> = {}
  for (const vincolo of vincoliConLimite()) {
    const occorrenze = giorni.flatMap((g) =>
      basiDelGiorno(pastiDelGiorno(g))
        .filter((id) => vincolo.pasti?.includes(id))
        .map(() => g.data),
    )
    conteggi[vincolo.id] = { vincolo, volte: occorrenze.length, giorni: [...new Set(occorrenze)], ...limiti(vincolo) }
  }
  return conteggi
}

/** I conteggi che riguardano un pasto (per id base), es. C2 → pesce grasso. */
export function conteggiDelPasto(conteggi: Record<string, ConteggioVincolo>, idBasePasto: string): ConteggioVincolo[] {
  return Object.values(conteggi).filter((c) => c.vincolo.pasti?.includes(idBasePasto))
}

export function nomeVincolo(vincolo: Vincolo): string {
  return ('nome' in vincolo && vincolo.nome) || vincolo.regola
}

/**
 * @param giorni i giorni della settimana
 * @param pastiEffettivi per ogni data, pranzo e cena effettivi (piano + sostituzioni del giorno)
 */
export function controllaVincoli(giorni: Giorno[], pastiEffettivi: Record<string, PastiDelGiorno>): EsitoVincolo[] {
  const pastiDi = (g: Giorno): PastiDelGiorno => pastiEffettivi[g.data] ?? { pranzo: g.pranzo, cena: g.cena }
  const esiti: EsitoVincolo[] = []

  for (const c of Object.values(conteggiVincoli(giorni, pastiDi))) {
    const volte = `${c.volte} ${c.volte === 1 ? 'volta' : 'volte'}`
    esiti.push({
      id: c.vincolo.id,
      testo: `${nomeVincolo(c.vincolo)}: ${volte}`,
      limite: c.minimo !== undefined ? `minimo ${c.minimo}` : `massimo ${c.massimo}`,
      rispettato: (c.minimo === undefined || c.volte >= c.minimo) && (c.massimo === undefined || c.volte <= c.massimo),
    })
  }

  // Pasti ammessi solo in alcuni tipi di giornata (es. grassi alti: solo VERDE e GRIGIO).
  const conLimitiDiTipo = [...dati.pranzi, ...dati.cene].filter((p) => 'soloTipiGiornata' in p && p.soloTipiGiornata)
  const gruppi = new Map<string, string[]>()
  for (const p of conLimitiDiTipo) {
    const chiave = ((p as { soloTipiGiornata: string[] }).soloTipiGiornata).join(' e ')
    gruppi.set(chiave, [...(gruppi.get(chiave) ?? []), p.id])
  }
  for (const [ammessi, ids] of gruppi) {
    const fuori = giorni.filter((g) => !ammessi.split(' e ').includes(g.tipo) && basiDelGiorno(pastiDi(g)).some((id) => ids.includes(id)))
    esiti.push({
      id: `tipi-${ammessi}`,
      testo: `${ids.join(', ')} solo nei giorni ${ammessi}`,
      limite: fuori.length === 0 ? 'ok' : `${fuori.length} fuori regola`,
      rispettato: fuori.length === 0,
      dettaglio: fuori.length > 0 ? fuori.map((g) => `${formatDataBreve(g.data)} (${g.tipo})`).join(', ') : undefined,
    })
  }

  // Pasti da non abbinare nello stesso giorno.
  for (const p of [...dati.pranzi, ...dati.cene]) {
    if (!('incompatibileCon' in p) || !p.incompatibileCon) continue
    const incompatibili = p.incompatibileCon as string[]
    const conflitti = giorni.filter((g) => {
      const basi = basiDelGiorno(pastiDi(g))
      return basi.includes(p.id) && basi.some((id) => incompatibili.includes(id))
    })
    esiti.push({
      id: `${p.id}-incompatibile`,
      testo: `${p.id} mai nello stesso giorno di ${incompatibili.join(', ')}`,
      limite: conflitti.length === 0 ? 'ok' : `${conflitti.length} giorni`,
      rispettato: conflitti.length === 0,
      dettaglio: conflitti.length > 0 ? conflitti.map((g) => formatDataBreve(g.data)).join(', ') : undefined,
    })
  }
  return esiti
}

/** Le regole di "Da ricordare" che riguardano un pasto (per id base). */
export function vincoliDelPasto(id: string) {
  return dati.regole.vincoliSettimanali.filter((v) => v.pasti?.includes(id))
}

/** Le regole da ricordare la sera, quando il giorno dopo è di un certo tipo (es. crucifere prima di ROSSO). */
export function vincoliSeraPrima(tipoDomani: string | undefined) {
  return tipoDomani ? dati.regole.vincoliSettimanali.filter((v) => v.seraPrimaDiTipo === tipoDomani) : []
}

/** "2/3 max", "2/3 min": la frazione rispetto al limite del vincolo. */
export function frazioneLimite(conteggio: ConteggioVincolo, volte = conteggio.volte): string | null {
  if (conteggio.massimo !== undefined) return `${volte}/${conteggio.massimo} max`
  if (conteggio.minimo !== undefined) return `${volte}/${conteggio.minimo} min`
  return null
}

export function oltreMassimo(conteggio: ConteggioVincolo, volte = conteggio.volte): boolean {
  return conteggio.massimo !== undefined && volte > conteggio.massimo
}
