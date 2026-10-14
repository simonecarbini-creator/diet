// Box "La giornata con questa cena": CHO e kcal del giorno, riga per riga rispetto al piano.
import { formatNumero, formatScarto } from '../formato'
import type { TargetGiorno, valutaAlternativa } from '../giornata'

/**
 * "La giornata con questa cena": CHO e kcal del giorno, in parole rispetto al piano.
 * Con `inCorso` (pasto ancora da comporre) stare sotto non e' un errore: blu, non rosso.
 */
export function BoxGiornata({
  titolo,
  totale,
  target,
  inCorso = false,
}: {
  titolo: string
  totale: ReturnType<typeof valutaAlternativa>
  target: TargetGiorno
  inCorso?: boolean
}) {
  const sottoCho = totale.cho < target.cho.da
  const sottoKcal = totale.kcal < target.kcal.da
  const righe = [
    { nome: 'CHO', valore: `${formatNumero(totale.cho)} g`, scarto: formatScarto(totale.cho - target.cho.piano, 'g'), dentro: totale.choDentro, sotto: sottoCho, piano: `${formatNumero(target.cho.piano)} g` },
    { nome: 'kcal', valore: formatNumero(totale.kcal), scarto: formatScarto(totale.kcal - target.kcal.piano, 'kcal'), dentro: totale.kcalDentro, sotto: sottoKcal, piano: formatNumero(target.kcal.piano) },
  ]
  const fuori = [
    !totale.choDentro && (sottoCho ? `CHO sotto il minimo di ${target.cho.da} g` : `CHO oltre il massimo di ${target.cho.a} g`),
    !totale.kcalDentro &&
      (sottoKcal ? `kcal sotto il minimo di ${formatNumero(target.kcal.da)}` : `kcal oltre il massimo di ${formatNumero(target.kcal.a)}`),
  ].filter(Boolean)
  // Rosso solo quando si va oltre; sotto, mentre si compone, e' "ancora da completare".
  const oltre = righe.some((r) => !r.dentro && !r.sotto)
  const stato = totale.nelTarget ? 'dentro' : inCorso && !oltre ? 'inCorso' : 'fuori'
  const colore = (r: (typeof righe)[number]) => (r.dentro ? 'text-ok' : inCorso && r.sotto ? 'text-pro' : 'text-ko')
  return (
    <div className={`mt-2 rounded-lg px-2.5 py-2 text-sm ${stato === 'dentro' ? 'bg-ok/10' : stato === 'inCorso' ? 'bg-pro/10' : 'bg-ko/10'}`}>
      <div className="text-xs font-semibold uppercase opacity-70">{titolo}</div>
      <ul className="mt-1 space-y-0.5">
        {righe.map((r) => (
          <li key={r.nome} className="flex items-baseline gap-2">
            <span className={`w-4 shrink-0 font-bold ${colore(r)}`}>{r.dentro ? '✓' : inCorso && r.sotto ? '…' : '✗'}</span>
            <span>
              <span className="font-bold tabular-nums">{r.valore}</span> {r.nome === 'kcal' ? 'kcal' : 'CHO'}:{' '}
              <span className={r.dentro ? '' : `font-semibold ${colore(r)}`}>
                {r.scarto === 'uguale' ? 'come il piano' : `${r.scarto} del piano`}
              </span>{' '}
              <span className="opacity-70">({r.piano})</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={`mt-1 font-semibold ${stato === 'dentro' ? 'text-ok' : stato === 'inCorso' ? 'text-pro' : 'text-ko'}`}>
        {stato === 'dentro'
          ? `Nel target: entro ±${target.margine}% del piano`
          : stato === 'inCorso'
            ? `Ancora sotto il target della giornata (${target.cho.da}–${target.cho.a} g CHO)`
            : `Fuori target: ${fuori.join(', ')}`}
      </div>
    </div>
  )
}
