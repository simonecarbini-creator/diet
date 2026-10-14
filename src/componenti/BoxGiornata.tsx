// Box "La giornata con questa cena": CHO e kcal del giorno, riga per riga rispetto al piano.
import { formatNumero, formatScarto } from '../formato'
import type { TargetGiorno, valutaAlternativa } from '../giornata'

/** "La giornata con questa cena": CHO e kcal del giorno, in parole rispetto al piano. */
export function BoxGiornata({
  titolo,
  totale,
  target,
}: {
  titolo: string
  totale: ReturnType<typeof valutaAlternativa>
  target: TargetGiorno
}) {
  const righe = [
    { nome: 'CHO', valore: `${formatNumero(totale.cho)} g`, scarto: formatScarto(totale.cho - target.cho.piano, 'g'), dentro: totale.choDentro, piano: `${formatNumero(target.cho.piano)} g` },
    { nome: 'kcal', valore: formatNumero(totale.kcal), scarto: formatScarto(totale.kcal - target.kcal.piano, 'kcal'), dentro: totale.kcalDentro, piano: formatNumero(target.kcal.piano) },
  ]
  const fuori = [
    !totale.choDentro &&
      (totale.cho < target.cho.da ? `CHO sotto il minimo di ${target.cho.da} g` : `CHO oltre il massimo di ${target.cho.a} g`),
    !totale.kcalDentro &&
      (totale.kcal < target.kcal.da
        ? `kcal sotto il minimo di ${formatNumero(target.kcal.da)}`
        : `kcal oltre il massimo di ${formatNumero(target.kcal.a)}`),
  ].filter(Boolean)
  return (
    <div className={`mt-2 rounded-lg px-2.5 py-2 text-sm ${totale.nelTarget ? 'bg-ok/10' : 'bg-ko/10'}`}>
      <div className="text-xs font-semibold uppercase opacity-70">{titolo}</div>
      <ul className="mt-1 space-y-0.5">
        {righe.map((r) => (
          <li key={r.nome} className="flex items-baseline gap-2">
            <span className={`w-4 shrink-0 font-bold ${r.dentro ? 'text-ok' : 'text-ko'}`}>{r.dentro ? '✓' : '✗'}</span>
            <span>
              <span className="font-bold tabular-nums">{r.valore}</span> {r.nome === 'kcal' ? 'kcal' : 'CHO'}:{' '}
              <span className={r.dentro ? '' : 'font-semibold text-ko'}>
                {r.scarto === 'uguale' ? 'come il piano' : `${r.scarto} del piano`}
              </span>{' '}
              <span className="opacity-70">({r.piano})</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={`mt-1 font-semibold ${totale.nelTarget ? 'text-ok' : 'text-ko'}`}>
        {totale.nelTarget ? `Nel target: entro ±${target.margine}% del piano` : `Fuori target: ${fuori.join(', ')}`}
      </div>
    </div>
  )
}
