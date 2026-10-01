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
function idBase(categoria: 'pranzo' | 'cena', id: string): string {
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
