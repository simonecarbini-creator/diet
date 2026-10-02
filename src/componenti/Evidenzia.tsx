import { occorrenze } from '../ricerca'

/** Il testo con le lettere cercate evidenziate in rosa. */
export function Evidenzia({ testo, cerca }: { testo: string; cerca?: string }) {
  const parti = cerca ? occorrenze(testo, cerca) : []
  if (parti.length === 0) return <>{testo}</>
  const pezzi = []
  let da = 0
  parti.forEach(([inizio, fine], i) => {
    if (inizio > da) pezzi.push(<span key={`t${i}`}>{testo.slice(da, inizio)}</span>)
    pezzi.push(
      <mark key={`m${i}`} className="rounded-sm bg-cho/20 font-bold text-cho">
        {testo.slice(inizio, fine)}
      </mark>,
    )
    da = fine
  })
  if (da < testo.length) pezzi.push(<span key="fine">{testo.slice(da)}</span>)
  return <>{pezzi}</>
}
