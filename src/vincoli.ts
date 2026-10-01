// Controllo dei vincoli settimanali sulle cene, a partire dai campi numerici di
// dati.json (minimoSettimanale, massimoSettimanale, soloTipiGiornata, incompatibileCon).
import { dati, trovaPasto, type Giorno } from './dati'
import { formatDataBreve } from './formato'

export type EsitoVincolo = {
  id: string
  testo: string
  limite: string
  rispettato: boolean
  /** Giorni che violano il vincolo, se pertinente. */
  dettaglio?: string
}

/** Id del pasto base: "C2rid" → "C2". */
export function idBase(categoria: 'pranzo' | 'cena', id: string): string {
  return trovaPasto(categoria, id)?.base ?? id
}

/**
 * @param giorni i giorni della settimana
 * @param pastiEffettivi per ogni data, pranzo e cena effettivi (piano + sostituzioni del giorno)
 */
export function controllaVincoli(
  giorni: Giorno[],
  pastiEffettivi: Record<string, { pranzo: string; cena: string }>,
): EsitoVincolo[] {
  const esiti: EsitoVincolo[] = []
  const cenaBase = (g: Giorno) => idBase('cena', pastiEffettivi[g.data]?.cena ?? g.cena)
  const pastiBase = (g: Giorno) => [
    idBase('pranzo', pastiEffettivi[g.data]?.pranzo ?? g.pranzo),
    cenaBase(g),
  ]

  for (const cena of dati.cene) {
    const giorniConCena = giorni.filter((g) => cenaBase(g) === cena.id)
    const volte = `${giorniConCena.length} ${giorniConCena.length === 1 ? 'volta' : 'volte'}`
    const nome = `${cena.nome} (${cena.id})`

    if (cena.minimoSettimanale !== undefined) {
      esiti.push({
        id: `${cena.id}-minimo`,
        testo: `${nome}: ${volte}`,
        limite: `minimo ${cena.minimoSettimanale}`,
        rispettato: giorniConCena.length >= cena.minimoSettimanale,
      })
    }
    if (cena.massimoSettimanale !== undefined) {
      esiti.push({
        id: `${cena.id}-massimo`,
        testo: `${nome}: ${volte}`,
        limite: `massimo ${cena.massimoSettimanale}`,
        rispettato: giorniConCena.length <= cena.massimoSettimanale,
      })
    }
    if (cena.soloTipiGiornata) {
      const ammessi = cena.soloTipiGiornata
      const fuori = giorniConCena.filter((g) => !ammessi.includes(g.tipo))
      esiti.push({
        id: `${cena.id}-tipi`,
        testo: `${nome} solo nei giorni ${ammessi.join(' e ')}`,
        limite: fuori.length === 0 ? 'ok' : `${fuori.length} fuori regola`,
        rispettato: fuori.length === 0,
        dettaglio: fuori.length > 0 ? fuori.map((g) => `${formatDataBreve(g.data)} (${g.tipo})`).join(', ') : undefined,
      })
    }
    if (cena.incompatibileCon) {
      const incompatibili = cena.incompatibileCon
      const conflitti = giorniConCena.filter((g) => pastiBase(g).some((id) => incompatibili.includes(id)))
      esiti.push({
        id: `${cena.id}-incompatibile`,
        testo: `${nome} mai nello stesso giorno di ${incompatibili.join(', ')}`,
        limite: conflitti.length === 0 ? 'ok' : `${conflitti.length} giorni`,
        rispettato: conflitti.length === 0,
        dettaglio: conflitti.length > 0 ? conflitti.map((g) => formatDataBreve(g.data)).join(', ') : undefined,
      })
    }
  }
  return esiti
}

export type ConteggioPasto = {
  volte: number
  giorni: string[]
  minimo?: number
  massimo?: number
}

/** Quante volte ogni cena (per id base: C2rid conta come C2) compare nei giorni dati. */
export function conteggiCene(giorni: Giorno[], cenaEffettiva: (g: Giorno) => string): Record<string, ConteggioPasto> {
  const conteggi: Record<string, ConteggioPasto> = {}
  for (const cena of dati.cene) {
    const conCena = giorni.filter((g) => idBase('cena', cenaEffettiva(g)) === cena.id)
    conteggi[cena.id] = {
      volte: conCena.length,
      giorni: conCena.map((g) => g.data),
      minimo: cena.minimoSettimanale,
      massimo: cena.massimoSettimanale,
    }
  }
  return conteggi
}

/** Le regole di "Da ricordare" che riguardano un pasto (per id base). */
export function vincoliDelPasto(id: string) {
  return dati.regole.vincoliSettimanali.filter((v) => v.pasti?.includes(id))
}

/** Le regole da ricordare la sera, quando il giorno dopo è di un certo tipo (es. crucifere prima di ROSSO). */
export function vincoliSeraPrima(tipoDomani: string | undefined) {
  return tipoDomani ? dati.regole.vincoliSettimanali.filter((v) => v.seraPrimaDiTipo === tipoDomani) : []
}


/** "2/3 max", "2/3 min": la frazione rispetto al limite che il pasto ha in dati.json. */
export function frazioneLimite(conteggio: ConteggioPasto, volte = conteggio.volte): string | null {
  if (conteggio.massimo !== undefined) return `${volte}/${conteggio.massimo} max`
  if (conteggio.minimo !== undefined) return `${volte}/${conteggio.minimo} min`
  return null
}

export function oltreMassimo(conteggio: ConteggioPasto, volte = conteggio.volte): boolean {
  return conteggio.massimo !== undefined && volte > conteggio.massimo
}
