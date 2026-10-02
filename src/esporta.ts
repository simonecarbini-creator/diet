// Export dei dati: CSV per il medico (punto 8) e file di backup.
// Sull'iPhone apre il foglio di condivisione; altrove scarica il file.

const numero = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1, useGrouping: false })

/** CSV con il punto e virgola e la virgola decimale: si apre così com'è in Excel/Numbers italiani. */
export function csv(righe: (string | number | null)[][]): string {
  const cella = (v: string | number | null) => {
    if (v === null) return ''
    const testo = typeof v === 'number' ? numero.format(v) : v
    return /[;"\n]/.test(testo) ? `"${testo.replace(/"/g, '""')}"` : testo
  }
  // Il BOM fa riconoscere a Excel le lettere accentate.
  return '﻿' + righe.map((r) => r.map(cella).join(';')).join('\r\n')
}

export async function condividiFile(nome: string, contenuto: string, tipo: string): Promise<void> {
  const file = new File([contenuto], nome, { type: tipo })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nome })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
