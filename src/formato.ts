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
  const [anno, mese, giorno] = data.split('-').map(Number)
  return dataLunga.format(new Date(anno, mese - 1, giorno))
}

/** 15 → "+15 g CHO", -15 → "−15 g CHO" (segno meno tipografico). */
export function formatDifferenzaCho(differenza: number): string {
  const segno = differenza > 0 ? '+' : '−'
  return `${segno}${formatNumero(Math.abs(differenza))} g CHO`
}
