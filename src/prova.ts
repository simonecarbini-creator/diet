// TEMPORANEO: #/prova riempie i giorni passati della settimana corrente con dati di
// esempio, per vedere i riepiloghi 👍 / 👎 / ND. Da togliere quando l'app è in uso.
import { scrivi } from './archivio'
import { dati } from './dati'
import { vociDelGiorno } from './giornata'
import type { StatoGiorno } from './statoGiorno'

export async function compilaDatiDiProva(oggi: string): Promise<void> {
  const settimana =
    dati.settimane.find((s) => s.dal <= oggi && oggi <= s.al) ?? dati.settimane[0]
  const [tutti, alcuni, nessuno] = settimana.giorni.filter((g) => g.data < oggi)

  if (tutti) {
    // Tutto spuntato, con merenda scelta e un pranzo cambiato → 👍
    const scelte = { merenda: 'M10', pranzo: 'P1' }
    const consumati = vociDelGiorno(tutti, scelte).map((v) => v.categoria)
    await scrivi<StatoGiorno>(`giorno:${tutti.data}`, { scelte, consumati })
  }
  if (alcuni) {
    // Solo i primi tre pasti spuntati → 👎
    const consumati = vociDelGiorno(alcuni).slice(0, 3).map((v) => v.categoria)
    await scrivi<StatoGiorno>(`giorno:${alcuni.data}`, { scelte: {}, consumati })
  }
  if (nessuno) {
    // Niente registrato → ND
    await scrivi<StatoGiorno>(`giorno:${nessuno.data}`, { scelte: {}, consumati: [] })
  }
}
