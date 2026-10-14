// Calcolatore del pasto: si compone un pasto alimento per alimento (banca dati di dati.json)
// e lo si confronta con il pasto del piano, nutriente per nutriente, con le tolleranze
// di dati.json (regole.calcolatore). Nessun valore nutrizionale qui: solo i conti.
import { alimentiBanca, tolleranzeCalcolatore, type AlimentoBanca, type Nutriente } from './dati'
import { contiene } from './ricerca'

export const NUTRIENTI: Nutriente[] = ['kcal', 'cho', 'proteine', 'grassi']

export type Valori = Record<Nutriente, number>
/** Un alimento scelto: quantita' nell'unita' dell'alimento (g, ml o pezzi). */
export type VoceComposta = { id: string; quantita: number }

export function trovaAlimento(id: string): AlimentoBanca | undefined {
  return alimentiBanca().find((a) => a.id === id)
}

/** Grammi (o ml) di una quantita': per gli alimenti a pezzi si moltiplica per il peso del pezzo. */
export function grammiDi(alimento: AlimentoBanca, quantita: number): number {
  return alimento.unita === 'pz' ? quantita * (alimento.grammiPerPezzo ?? 0) : quantita
}

export function valoriAlimento(alimento: AlimentoBanca, quantita: number): Valori {
  const fattore = grammiDi(alimento, quantita) / 100
  return {
    kcal: alimento.per100.kcal * fattore,
    cho: alimento.per100.cho * fattore,
    proteine: alimento.per100.proteine * fattore,
    grassi: alimento.per100.grassi * fattore,
  }
}

/** Somma esatta (senza arrotondare le singole voci); si arrotonda solo per mostrarla. */
export function totaleComposto(voci: VoceComposta[]): Valori {
  const totale: Valori = { kcal: 0, cho: 0, proteine: 0, grassi: 0 }
  for (const voce of voci) {
    const alimento = trovaAlimento(voce.id)
    if (!alimento) continue
    const v = valoriAlimento(alimento, voce.quantita)
    for (const n of NUTRIENTI) totale[n] += v[n]
  }
  return totale
}

export type Esito = 'dentro' | 'sopra' | 'sotto'
export type ConfrontoNutriente = {
  nutriente: Nutriente
  obiettivo: number
  attuale: number
  /** Scarto massimo accettato: il piu' grande tra la percentuale e il minimo in grammi. */
  limite: number
  /** attuale - obiettivo, arrotondato. */
  scarto: number
  esito: Esito
}

/** Confronto con l'obiettivo; i nutrienti senza obiettivo (es. grassi mancanti) non si confrontano. */
export function confrontaObiettivo(obiettivo: Partial<Valori>, attuale: Valori): ConfrontoNutriente[] {
  const tolleranze = tolleranzeCalcolatore()
  return NUTRIENTI.flatMap((nutriente) => {
    const valore = obiettivo[nutriente]
    if (valore === undefined) return []
    const t = tolleranze[nutriente]
    const limite = Math.max((valore * t.percento) / 100, t.minimoGrammi ?? 0)
    const scarto = Math.round(attuale[nutriente]) - valore
    const esito: Esito = scarto > limite ? 'sopra' : scarto < -limite ? 'sotto' : 'dentro'
    return [{ nutriente, obiettivo: valore, attuale: Math.round(attuale[nutriente]), limite, scarto, esito }]
  })
}

/** Prima gli alimenti del pasto del piano, poi quelli degli altri pasti della categoria, poi tutti. */
export function gruppiAlimenti(idPasto: string[], idCategoria: string[]): { titolo: 'pasto' | 'categoria' | 'altri'; alimenti: AlimentoBanca[] }[] {
  const tutti = [...alimentiBanca()].sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  const delPasto = tutti.filter((a) => a.usatoIn.some((id) => idPasto.includes(id)))
  const dellaCategoria = tutti.filter((a) => !delPasto.includes(a) && a.usatoIn.some((id) => idCategoria.includes(id)))
  const altri = tutti.filter((a) => !delPasto.includes(a) && !dellaCategoria.includes(a))
  return [
    { titolo: 'pasto' as const, alimenti: delPasto },
    { titolo: 'categoria' as const, alimenti: dellaCategoria },
    { titolo: 'altri' as const, alimenti: altri },
  ].filter((g) => g.alimenti.length > 0)
}

/** Ricerca per nome e sinonimi (senza accenti, maiuscole indifferenti). */
export function corrisponde(alimento: AlimentoBanca, cerca: string): boolean {
  return contiene(alimento.nome, cerca) || alimento.sinonimi.some((s) => contiene(s, cerca))
}

export function unitaBreve(alimento: AlimentoBanca): string {
  return alimento.unita === 'pz' ? 'pz' : alimento.unita
}

/** Valori del selettore: dal passo fino a 4 volte la porzione tipica (almeno 20 passi). */
export function valoriSelettore(alimento: AlimentoBanca): number[] {
  const passo = alimento.passo
  const massimo = Math.max(alimento.quantitaTipica * 4, passo * 20)
  const valori: number[] = []
  for (let v = passo; v <= massimo + 1e-9; v += passo) valori.push(Math.round(v * 10) / 10)
  return valori
}
