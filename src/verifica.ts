// Controllo di coerenza del calendario: ogni giorno deve riferirsi a tipi e pasti
// che esistono in dati.json. Usato dall'app e da `npm run verifica` prima del build.
// Non importa dati.json direttamente, così gira anche con Node fuori da Vite.
import { valutaCondizione } from './condizioni.ts'
import type { Dati } from './tipi/dati.generati'

export function verificaDati(dati: Dati): string[] {
  const errori: string[] = []

  const idColazioni = new Set(dati.blocchi.colazioni.map((c) => c.id))
  const idSpuntini = new Set(dati.blocchi.spuntini.map((s) => s.id))
  const idPranzi = new Set(
    dati.pranzi.flatMap((p) => [
      p.id,
      p.ridotto.id,
      ...(p.maggiorato ? [p.maggiorato.id] : []),
      ...(p.varianti ?? []).map((v) => v.id),
    ]),
  )
  const idCene = new Set(dati.cene.flatMap((c) => [c.id, ...(c.ridotto ? [c.ridotto.id] : [])]))
  const idMerende = new Set([...dati.merende.map((m) => m.id), dati.merendaRidotta.id])

  if (valutaCondizione(dati.blocchi.preCorsa.saltaSe, { tipo: '' }) === null) {
    errori.push(`blocchi.preCorsa.saltaSe: condizione "${dati.blocchi.preCorsa.saltaSe}" non riconosciuta`)
  }
  for (const [pasto, orario] of Object.entries(dati.orariPasti)) {
    if (pasto !== '_nota' && !/^\d{2}:\d{2}$/.test(orario)) {
      errori.push(`orariPasti.${pasto}: "${orario}" non e' nel formato HH:MM`)
    }
  }

  for (const settimana of dati.settimane) {
    for (const giorno of settimana.giorni) {
      const dove = `Settimana ${settimana.numero}, ${giorno.data}`
      if (!Object.hasOwn(dati.tipiGiornata, giorno.tipo)) {
        errori.push(`${dove}: tipo giornata "${giorno.tipo}" sconosciuto`)
      }
      if (!idColazioni.has(giorno.colazione)) {
        errori.push(`${dove}: colazione "${giorno.colazione}" non trovata`)
      }
      if (!idSpuntini.has(giorno.spuntino)) {
        errori.push(`${dove}: spuntino "${giorno.spuntino}" non trovato`)
      }
      if (!idPranzi.has(giorno.pranzo)) {
        errori.push(`${dove}: pranzo "${giorno.pranzo}" non trovato`)
      }
      if (!idCene.has(giorno.cena)) {
        errori.push(`${dove}: cena "${giorno.cena}" non trovata`)
      }
      if (giorno.merenda !== null && !idMerende.has(giorno.merenda)) {
        errori.push(`${dove}: merenda "${giorno.merenda}" non trovata`)
      }
    }
  }

  return errori
}
