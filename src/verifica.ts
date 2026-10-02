// Controllo di coerenza del calendario: ogni giorno deve riferirsi a tipi e pasti
// che esistono in dati.json. Usato dall'app e da `npm run verifica` prima del build.
// Non importa dati.json direttamente, così gira anche con Node fuori da Vite.
import { validaQuando, valutaCondizione } from './condizioni.ts'
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

  // Le modifiche delle versioni ridotte/maggiorate e delle colazioni devono
  // riferirsi ad alimenti che esistono nel pasto base.
  const controllaNomi = (dove: string, base: { nome: string }[], nomi: string[]) => {
    for (const nome of nomi) {
      if (!base.some((a) => a.nome === nome)) {
        errori.push(`${dove}: "${nome}" non e' tra gli alimenti del pasto base`)
      }
    }
  }
  for (const pasto of [...dati.pranzi, ...dati.cene]) {
    for (const versione of [pasto.ridotto, 'maggiorato' in pasto ? pasto.maggiorato : undefined]) {
      if (!versione) continue
      controllaNomi(versione.id, pasto.alimenti, [
        ...versione.modificheGrammi.map((m) => m.nome),
        ...((versione as { rimozioni?: string[] }).rimozioni ?? []),
      ])
    }
  }
  for (const colazione of dati.blocchi.colazioni) {
    const base = dati.blocchi.colazioni.find((c) => c.id === colazione.base)
    if (base?.alimenti) controllaNomi(colazione.id, base.alimenti, colazione.rimozioni ?? [])
  }

  // Le condizioni delle regole devono essere leggibili dall'app.
  const { regole } = dati
  errori.push(
    ...validaQuando(regole.rossoPesante.quando, 'regole.rossoPesante'),
    ...validaQuando(regole.sabatoRicarica.quando, 'regole.sabatoRicarica'),
    ...validaQuando(dati.merendaRidotta.quando, 'merendaRidotta'),
    ...regole.classificazioneGiornata.flatMap((r) => validaQuando(r.quando, `classificazioneGiornata.${r.id}`)),
    ...regole.sceltaColazione.flatMap((r) => validaQuando(r.quando, `sceltaColazione.${r.colazione}`)),
    ...regole.sceltaSpuntino.flatMap((r) => validaQuando(r.quando, `sceltaSpuntino.${r.spuntino}`)),
    ...regole.spuntinoSerale.flatMap((r, i) => validaQuando(r.quando, `spuntinoSerale[${i}]`)),
    ...regole.gelInCorsa.flatMap((r, i) => validaQuando(r.quando, `gelInCorsa[${i}]`)),
  )
  for (const r of regole.classificazioneGiornata) {
    if (!Object.hasOwn(dati.tipiGiornata, r.tipo)) errori.push(`classificazioneGiornata.${r.id}: tipo "${r.tipo}" sconosciuto`)
  }
  for (const r of regole.sceltaColazione) {
    if (!idColazioni.has(r.colazione)) errori.push(`sceltaColazione: colazione "${r.colazione}" non trovata`)
  }
  for (const r of regole.sceltaSpuntino) {
    if (!idSpuntini.has(r.spuntino)) errori.push(`sceltaSpuntino: spuntino "${r.spuntino}" non trovato`)
  }
  const assegnazione = regole.assegnazionePasti
  if (!idPranzi.has(assegnazione.pranzo)) errori.push(`assegnazionePasti.pranzo: "${assegnazione.pranzo}" non trovato`)
  for (const id of [...assegnazione.ceneDistribuite.map((c) => c.cena), ...assegnazione.ceneARotazione, assegnazione.cenaRidottaDiRiserva]) {
    if (!idCene.has(id)) errori.push(`assegnazionePasti: cena "${id}" non trovata`)
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
