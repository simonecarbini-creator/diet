// Condizioni semplici scritte in dati.json nella forma "tipo == GRIGIO".
// Modulo senza dipendenze da dati.json: lo usa anche lo script di verifica con Node.

/** Restituisce null se la condizione ha un'altra forma: `verificaDati` lo segnala. */
export function valutaCondizione(se: string, giorno: { tipo: string }): boolean | null {
  const corrispondenza = /^tipo\s*==\s*(\w+)$/.exec(se.trim())
  return corrispondenza ? giorno.tipo === corrispondenza[1] : null
}

// ---------------------------------------------------------------------------
// Condizioni strutturate (campo "quando" delle regole in dati.json), per esempio
//   { "oppure": [ { "var": "distanzaKm", ">=": 20 }, { "var": "lungoDomenicale", "==": true } ] }

/** I dati di un giorno su cui si valutano le regole. */
export type Contesto = {
  tipo: string
  distanzaKm: number
  /** null se non indicata: ogni confronto sulla durata è falso. */
  durataMinuti: number | null
  minutiSopraRitmoMedio: number
  lungoDomenicale: boolean
  qualitaNelTesto: boolean
  riposo: boolean
  domaniRossoPesante: boolean
}

const variabili: Record<keyof Contesto, { etichetta: string; unita?: string }> = {
  tipo: { etichetta: 'giorno' },
  distanzaKm: { etichetta: 'distanza', unita: 'km' },
  durataMinuti: { etichetta: 'durata', unita: 'min' },
  minutiSopraRitmoMedio: { etichetta: 'minuti sopra il ritmo medio' },
  lungoDomenicale: { etichetta: 'è il lungo domenicale' },
  qualitaNelTesto: { etichetta: "il testo indica qualità (ripetute, salite, frazionato, medio, progressiva lunga)" },
  riposo: { etichetta: "è riposo (allenamento vuoto o 'riposo')" },
  domaniRossoPesante: { etichetta: 'il giorno dopo è ROSSO pesante' },
}

const operatori = ['==', '>=', '>', '<=', '<'] as const
type Operatore = (typeof operatori)[number]
const simboli: Record<Operatore, string> = { '==': '=', '>=': '≥', '>': '>', '<=': '≤', '<': '<' }

type Oggetto = Record<string, unknown>
const eOggetto = (v: unknown): v is Oggetto => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Errori di forma di una condizione: li usa verificaDati, così un JSON sbagliato ferma il build. */
export function validaQuando(quando: unknown, dove: string): string[] {
  if (!eOggetto(quando)) return [`${dove}: la condizione deve essere un oggetto`]
  if (quando.sempre === true) return []
  if (Array.isArray(quando.e)) return quando.e.flatMap((c, i) => validaQuando(c, `${dove}.e[${i}]`))
  if (Array.isArray(quando.oppure)) return quando.oppure.flatMap((c, i) => validaQuando(c, `${dove}.oppure[${i}]`))
  if ('non' in quando) return validaQuando(quando.non, `${dove}.non`)
  if (typeof quando.var === 'string') {
    if (!(quando.var in variabili)) return [`${dove}: variabile "${quando.var}" sconosciuta`]
    const usati = operatori.filter((o) => o in quando)
    if (usati.length !== 1) return [`${dove}: serve esattamente un operatore tra ${operatori.join(' ')}`]
    return []
  }
  return [`${dove}: forma della condizione non riconosciuta`]
}

export function valutaQuando(quando: unknown, contesto: Contesto): boolean {
  if (!eOggetto(quando)) return false
  if (quando.sempre === true) return true
  if (Array.isArray(quando.e)) return quando.e.every((c) => valutaQuando(c, contesto))
  if (Array.isArray(quando.oppure)) return quando.oppure.some((c) => valutaQuando(c, contesto))
  if ('non' in quando) return !valutaQuando(quando.non, contesto)
  const valore = contesto[quando.var as keyof Contesto]
  const operatore = operatori.find((o) => o in quando)
  if (operatore === undefined || valore === undefined) return false
  const atteso = quando[operatore]
  if (operatore === '==') return valore === atteso
  if (typeof valore !== 'number' || typeof atteso !== 'number') return false
  switch (operatore) {
    case '>=': return valore >= atteso
    case '>': return valore > atteso
    case '<=': return valore <= atteso
    case '<': return valore < atteso
  }
}

/** La condizione in italiano, per la pagina Calcoli e per spiegare le proposte. */
export function descriviQuando(quando: unknown, annidata = false): string {
  if (!eOggetto(quando)) return '?'
  if (quando.sempre === true) return 'in tutti gli altri casi'
  const elenco = (parti: unknown[], congiunzione: string) => {
    const testo = parti.map((c) => descriviQuando(c, true)).join(` ${congiunzione} `)
    return annidata ? `(${testo})` : testo
  }
  if (Array.isArray(quando.e)) return elenco(quando.e, 'e')
  if (Array.isArray(quando.oppure)) return elenco(quando.oppure, 'oppure')
  if ('non' in quando) return `non ${descriviQuando(quando.non, true)}`
  const variabile = variabili[quando.var as keyof Contesto]
  const operatore = operatori.find((o) => o in quando)
  if (!variabile || !operatore) return '?'
  const atteso = quando[operatore]
  if (typeof atteso === 'boolean') return atteso ? variabile.etichetta : `non ${variabile.etichetta}`
  if (quando.var === 'tipo') return `giorno ${atteso}`
  return `${variabile.etichetta} ${simboli[operatore]} ${atteso}${variabile.unita ? ` ${variabile.unita}` : ''}`
}
