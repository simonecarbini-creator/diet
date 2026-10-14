// Calcolatore del pasto: si compone un pasto alimento per alimento (banca dati di dati.json)
// e lo si confronta con il pasto del piano, nutriente per nutriente, con le tolleranze
// di dati.json (regole.calcolatore). Nessun valore nutrizionale qui: solo i conti.
import { alimentiBanca, dati, tolleranzeCalcolatore, type AlimentoBanca, type Nutriente } from './dati'
import { formatNumero } from './formato'
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

export type TitoloGruppo = 'evidenza' | 'pasto' | 'categoria' | 'altri'

/**
 * Prima i condimenti in evidenza (dati.json → bancaAlimenti.inEvidenza), poi gli alimenti del pasto
 * del piano, poi quelli degli altri pasti della categoria, poi tutti gli altri.
 */
export function gruppiAlimenti(idPasto: string[], idCategoria: string[]): { titolo: TitoloGruppo; alimenti: AlimentoBanca[] }[] {
  const ordinati = [...alimentiBanca()].sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  const inEvidenza = dati.bancaAlimenti.inEvidenza.alimenti
  const evidenza = inEvidenza.map((id) => ordinati.find((a) => a.id === id)).filter((a): a is AlimentoBanca => !!a)
  const tutti = ordinati.filter((a) => !inEvidenza.includes(a.id))
  const delPasto = tutti.filter((a) => a.usatoIn.some((id) => idPasto.includes(id)))
  const dellaCategoria = tutti.filter((a) => !delPasto.includes(a) && a.usatoIn.some((id) => idCategoria.includes(id)))
  const altri = tutti.filter((a) => !delPasto.includes(a) && !dellaCategoria.includes(a))
  return [
    { titolo: 'evidenza' as const, alimenti: evidenza },
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

// --- Unita' pratiche: cucchiai di olio, pezzi di frutta ---------------------------------

export type UnitaPratica = { singolare: string; plurale: string; grammi: number; passo: number }

/** Cucchiai o pezzi (dati.json → unitaPratica): la quantita' resta in grammi, i pezzi sono una guida. */
export function unitaPratica(alimento: AlimentoBanca): UnitaPratica | undefined {
  return 'unitaPratica' in alimento ? (alimento.unitaPratica as UnitaPratica | undefined) : undefined
}

/** Pezzi o cucchiai corrispondenti ai grammi, al passo dell'unita' (es. 125 g di banana → 1). */
export function pezziDa(u: UnitaPratica, grammi: number): number {
  return Math.max(u.passo, Math.round(grammi / u.grammi / u.passo) * u.passo)
}

export function valoriPezzi(u: UnitaPratica): number[] {
  return Array.from({ length: 20 }, (_, i) => Math.round((i + 1) * u.passo * 10) / 10)
}

/** "1 banana · 120 g", "1,5 cucchiai · 15 g", "3 pz", "120 g". */
export function descriviQuantita(alimento: AlimentoBanca, quantita: number): string {
  const u = unitaPratica(alimento)
  const base = `${formatNumero(quantita)} ${unitaBreve(alimento)}`
  if (!u) return base
  const pezzi = quantita / u.grammi
  const esatti = Math.abs(pezzi - pezziDa(u, quantita)) < 1e-9
  return `${esatti ? '' : '≈ '}${formatNumero(Math.round(pezzi * 10) / 10)} ${pezzi <= 1 ? u.singolare : u.plurale} · ${base}`
}

/**
 * Quanto puo' valere questo pasto perche' la giornata resti nel target: la fascia del giorno
 * meno gli altri pasti. Puo' essere sotto il pasto del piano se gli altri pasti sono saliti.
 */
export function fasciaDelPasto(
  target: { cho: { da: number; a: number }; kcal: { da: number; a: number } },
  senzaQuesto: { cho: number; kcal: number },
): { cho: { da: number; a: number }; kcal: { da: number; a: number } } {
  const fascia = (t: { da: number; a: number }, altri: number) => ({ da: Math.max(0, t.da - altri), a: Math.max(0, t.a - altri) })
  return { cho: fascia(target.cho, senzaQuesto.cho), kcal: fascia(target.kcal, senzaQuesto.kcal) }
}
