// Ricerca senza maiuscole e senza accenti ("caffe" trova "Caffè"), con le posizioni
// nel testo originale per evidenziare le lettere trovate.

/** Ogni carattere del testo ridotto a minuscolo senza accenti, con la sua posizione originale. */
function normalizzato(testo: string): { piano: string; origine: number[] } {
  let piano = ''
  const origine: number[] = []
  for (let i = 0; i < testo.length; i++) {
    const c = testo[i].normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    for (const ch of c) {
      piano += ch
      origine.push(i)
    }
  }
  return { piano, origine }
}

/** Intervalli [inizio, fine) del testo originale che corrispondono alla ricerca. */
export function occorrenze(testo: string, cerca: string): [number, number][] {
  const q = normalizzato(cerca.trim()).piano
  if (!q) return []
  const { piano, origine } = normalizzato(testo)
  const trovate: [number, number][] = []
  let da = piano.indexOf(q)
  while (da !== -1) {
    trovate.push([origine[da], origine[da + q.length - 1] + 1])
    da = piano.indexOf(q, da + q.length)
  }
  return trovate
}

export function contiene(testo: string, cerca: string): boolean {
  return occorrenze(testo, cerca).length > 0
}
