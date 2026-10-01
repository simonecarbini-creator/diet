import { formatDifferenzaKcal } from '../formato'

/** Differenza di kcal rispetto al pasto del piano: rossa se aumentano, verde se calano. */
export function DifferenzaKcal({ differenza }: { differenza: number }) {
  if (differenza === 0) return null
  return (
    <span className={`font-semibold ${differenza > 0 ? 'text-ko' : 'text-ok'}`}>
      {' '}({formatDifferenzaKcal(differenza)})
    </span>
  )
}
