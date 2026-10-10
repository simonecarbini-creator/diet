// Controllo di coerenza del calendario: ogni giorno deve riferirsi a tipi e pasti
// che esistono in dati.json. Usato dall'app e da `npm run verifica` prima del build.
// Non importa dati.json direttamente, così gira anche con Node fuori da Vite.
import { validaQuando, valutaCondizione } from './condizioni.ts'
import type { Dati } from './tipi/dati.generati'

/** idExtra: codici validi oltre a quelli di dati.json (alternative create nell'app). */
export function verificaDati(dati: Dati, idExtra: string[] = []): string[] {
  const errori: string[] = []

  const idColazioni = new Set([...dati.blocchi.colazioni.map((c) => c.id), ...idExtra])
  const idSpuntini = new Set([...dati.blocchi.spuntini.map((s) => s.id), ...idExtra])
  const idPranzi = new Set(
    dati.pranzi.flatMap((p) => [
      p.id,
      ...(p.ridotto ? [p.ridotto.id] : []),
      ...(p.maggiorato ? [p.maggiorato.id] : []),
      ...(p.varianti ?? []).map((v) => v.id),
    ]).concat(idExtra),
  )
  const idCene = new Set([
    ...dati.cene.flatMap((c) => [c.id, ...(c.ridotto ? [c.ridotto.id] : []), ...('maggiorato' in c && c.maggiorato ? [c.maggiorato.id] : [])]),
    ...idExtra,
  ])
  const idMerende = new Set([...dati.merende.map((m) => m.id), dati.merendaRidotta.id, ...idExtra])

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
  // Colazioni: ogni tipo usato dalle regole deve esistere tra i tipi di colazione.
  for (const colazione of dati.blocchi.colazioni) {
    if (!Object.hasOwn(dati.blocchi.tipiColazione, colazione.tipoColazione)) {
      errori.push(`colazione ${colazione.id}: tipo "${colazione.tipoColazione}" sconosciuto`)
    }
  }

  // Sgarri: prendono il posto di un pranzo o di una cena, quindi i codici non devono
  // coincidere con quelli dei pranzi e delle cene (si cercherebbe il pasto sbagliato).
  for (const sgarro of dati.sgarri) {
    for (const momento of sgarro.momento) {
      if (momento !== 'pranzo' && momento !== 'cena') errori.push(`sgarro ${sgarro.id}: momento "${momento}" non valido`)
    }
    if (idPranzi.has(sgarro.id) || idCene.has(sgarro.id)) errori.push(`sgarro ${sgarro.id}: codice gia' usato da un pranzo o da una cena`)
    if (sgarro.base && !dati.sgarri.some((s) => s.id === sgarro.base)) errori.push(`sgarro ${sgarro.id}: base "${sgarro.base}" non trovata`)
  }
  const codici = [...idPranzi, ...idCene, ...dati.sgarri.map((s) => s.id), ...dati.dolci.map((d) => d.id)]
  for (const id of new Set(codici.filter((id, i) => codici.indexOf(id) !== i && !idExtra.includes(id)))) {
    errori.push(`codice "${id}" usato piu' di una volta tra pranzi, cene, sgarri e dolci`)
  }

  // Spuntino serale predefinito: deve essere quello di base o una delle alternative.
  const serale = dati.blocchi.spuntinoSerale
  if (serale.predefinito !== serale.id && !serale.alternative.some((a) => a.id === serale.predefinito)) {
    errori.push(`spuntinoSerale.predefinito: "${serale.predefinito}" non trovato`)
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

  // I pasti nominati nei vincoli settimanali devono esistere (pranzi o cene di base).
  const idBasePasti = new Set([...dati.pranzi.map((p) => p.id), ...dati.cene.map((c) => c.id)])
  for (const v of regole.vincoliSettimanali) {
    for (const id of v.pasti ?? []) {
      if (!idBasePasti.has(id)) errori.push(`vincoliSettimanali.${v.id}: pasto "${id}" non trovato`)
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
