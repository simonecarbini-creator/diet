// Condizioni semplici scritte in dati.json nella forma "tipo == GRIGIO".
// Modulo senza dipendenze da dati.json: lo usa anche lo script di verifica con Node.

/** Restituisce null se la condizione ha un'altra forma: `verificaDati` lo segnala. */
export function valutaCondizione(se: string, giorno: { tipo: string }): boolean | null {
  const corrispondenza = /^tipo\s*==\s*(\w+)$/.exec(se.trim())
  return corrispondenza ? giorno.tipo === corrispondenza[1] : null
}
