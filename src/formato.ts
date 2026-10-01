const numero = new Intl.NumberFormat('it-IT')

export function formatNumero(valore: number): string {
  return numero.format(valore)
}

const dataLunga = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "2026-10-01" → "giovedì 1 ottobre" */
export function formatData(data: string): string {
  return dataLunga.format(comeDate(data))
}

/** 15 → "+15 g CHO", -15 → "−15 g CHO" (segno meno tipografico). */
export function formatDifferenzaCho(differenza: number): string {
  const segno = differenza > 0 ? '+' : '−'
  return `${segno}${formatNumero(Math.abs(differenza))} g CHO`
}

const dataBreve = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric' })
const giornoMese = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })

function comeDate(data: string): Date {
  const [anno, mese, giorno] = data.split('-').map(Number)
  return new Date(anno, mese - 1, giorno)
}

/** "2026-09-28" → "lun 28" */
export function formatDataBreve(data: string): string {
  return dataBreve.format(comeDate(data))
}

/** "2026-09-28" → "28 set" */
export function formatGiornoMese(data: string): string {
  return giornoMese.format(comeDate(data))
}

/** 90 → "+90 kcal", -90 → "−90 kcal" */
export function formatDifferenzaKcal(differenza: number): string {
  const segno = differenza > 0 ? '+' : '−'
  return `${segno}${formatNumero(Math.abs(differenza))} kcal`
}

const meseAnno = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' })

/** "2026-10" → "ottobre 2026" */
export function formatMese(mese: string): string {
  const [anno, numero] = mese.split('-').map(Number)
  return meseAnno.format(new Date(anno, numero - 1, 1))
}
