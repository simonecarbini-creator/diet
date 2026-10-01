import type { Alimento } from '../dati'
import { formatNumero } from '../formato'

function quantita(alimento: Alimento): string {
  if (alimento.grammi != null) return `${formatNumero(alimento.grammi)} g`
  if (alimento.pezzi != null) return `${alimento.pezzi} pz`
  return ''
}

/** Lista completa, nella card aperta. */
export function ElencoAlimenti({ alimenti }: { alimenti: Alimento[] }) {
  return (
    <ul className="divide-y divide-bordo">
      {alimenti.map((alimento) => (
        <li key={alimento.nome} className={`py-1.5 ${alimento.rimosso ? 'opacity-50' : ''}`}>
          <div className="flex justify-between gap-3">
            <span className={alimento.rimosso ? 'line-through' : ''}>
              {alimento.aggiunto && <span className="font-semibold text-cho">+ </span>}
              {alimento.nome}
            </span>
            <span className="shrink-0 text-right font-medium tabular-nums">
              {alimento.rimosso ? (
                'tolto'
              ) : (
                <>
                  <span className={alimento.grammiBase != null ? 'font-bold text-cho' : ''}>
                    {quantita(alimento)}
                  </span>
                  {alimento.grammiBase != null && (
                    <span className="block text-xs font-normal opacity-70">
                      invece di {formatNumero(alimento.grammiBase)} g
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          {!alimento.rimosso && alimento.note && <div className="text-sm opacity-70">{alimento.note}</div>}
          {!alimento.rimosso && alimento.sostituibileCon && (
            <div className="text-sm opacity-70">oppure: {alimento.sostituibileCon.join(' · ')}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Riga compatta "Pasta 120 g · Legumi 230 g · …", nel pannello delle alternative. */
export function RiassuntoAlimenti({ alimenti }: { alimenti: Alimento[] }) {
  return (
    <p className="text-sm leading-relaxed">
      {alimenti.map((alimento, i) => (
        <span key={alimento.nome}>
          {i > 0 && <span className="opacity-50"> · </span>}
          {alimento.rimosso ? (
            <span className="line-through opacity-50">{alimento.nome}</span>
          ) : (
            <span className={alimento.grammiBase != null || alimento.aggiunto ? 'font-semibold' : ''}>
              {alimento.aggiunto && '+ '}
              {alimento.nome}
              {quantita(alimento) && (
                <span className="whitespace-nowrap font-semibold"> {quantita(alimento)}</span>
              )}
            </span>
          )}
        </span>
      ))}
    </p>
  )
}
