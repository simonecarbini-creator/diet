// Applica il motore alla settimana 4 e la confronta con quella compilata dal nutrizionista.
// Le durate e i minuti sopra ritmo sono stime: in dati.json non ci sono.
import dati from '../dati.json' with { type: 'json' }
import { proponiSettimana, type GiornoInserito } from '../src/motore.ts'

const stime: Record<string, { durata: number | null; sopra: number }> = {
  '2026-09-28': { durata: 80, sopra: 0 },
  '2026-09-29': { durata: 78, sopra: 10 },
  '2026-09-30': { durata: 90, sopra: 60 },
  '2026-10-01': { durata: 80, sopra: 0 },
  '2026-10-02': { durata: 62, sopra: 18 },
  '2026-10-03': { durata: null, sopra: 0 },
  '2026-10-04': { durata: 112, sopra: 45 },
}
const settimana = dati.settimane[0]
const inseriti: GiornoInserito[] = settimana.giorni.map((g) => ({
  data: g.data,
  allenamento: g.allenamento,
  distanzaKm: g.distanzaKm,
  durataMinuti: stime[g.data].durata,
  minutiSopraRitmoMedio: stime[g.data].sopra,
  lungoDomenicale: !!(g as { lungoDomenicale?: boolean }).lungoDomenicale,
}))
const { giorni, avvisi } = proponiSettimana(dati as never, inseriti)
const campi = ['tipo', 'colazione', 'spuntino', 'pranzo', 'cena', 'merenda', 'spuntinoSerale', 'gelCho', 'ricarica'] as const
let uguali = 0, totali = 0
for (const [i, g] of giorni.entries()) {
  const atteso = settimana.giorni[i] as Record<string, unknown>
  const diff = campi.filter((c) => (atteso[c] ?? false) !== ((g as Record<string, unknown>)[c] ?? false))
  totali += campi.length; uguali += campi.length - diff.length
  console.log(g.data, g.tipo.padEnd(6), diff.length === 0 ? 'uguale' : diff.map((c) => `${c}: nutr=${atteso[c] ?? '-'} app=${(g as Record<string, unknown>)[c] ?? '-'}`).join(' | '))
}
console.log(`coincidenze ${uguali}/${totali}`)
if (avvisi.length) console.log('avvisi:', avvisi)
