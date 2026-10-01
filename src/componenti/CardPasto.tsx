import { useState } from 'react'
import type { Alimento, CategoriaPasto } from '../dati'
import type { VocePasto } from '../giornata'
import { formatNumero } from '../formato'

const etichetteCategoria: Record<CategoriaPasto, string> = {
  preCorsa: 'Pre-corsa',
  colazione: 'Colazione',
  spuntino: 'Spuntino',
  pranzo: 'Pranzo',
  merenda: 'Merenda',
  cena: 'Cena',
  spuntinoSerale: 'Spuntino serale',
}

function quantita(alimento: Alimento): string {
  if (alimento.grammi != null) return `${formatNumero(alimento.grammi)} g`
  if (alimento.pezzi != null) return `${alimento.pezzi} pz`
  return ''
}

function ElencoAlimenti({ alimenti }: { alimenti: Alimento[] }) {
  return (
    <ul className="divide-y divide-bordo">
      {alimenti.map((alimento) => (
        <li key={alimento.nome} className="py-1.5">
          <div className="flex justify-between gap-3">
            <span>
              {alimento.aggiunto && <span className="font-semibold text-cho">+ </span>}
              {alimento.nome}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{quantita(alimento)}</span>
          </div>
          {alimento.note && <div className="text-sm opacity-70">{alimento.note}</div>}
          {alimento.sostituibileCon && (
            <div className="text-sm opacity-70">oppure: {alimento.sostituibileCon.join(' · ')}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

type Props = {
  voce: VocePasto
  corrente: boolean
}

export function CardPasto({ voce, corrente }: Props) {
  const [aperto, setAperto] = useState(false)
  const { pasto } = voce
  const etichetta = etichetteCategoria[voce.categoria]
  // Codici del piano (STD, P1, C2, Mrid…) solo dove il calendario li assegna.
  const mostraCodice = ['colazione', 'pranzo', 'cena', 'merenda'].includes(voce.categoria)
  // Se il nome ripete la categoria (es. "Pre-corsa"), meglio elencare gli alimenti.
  const titolo =
    pasto?.composizione ??
    (pasto?.nome === etichetta ? pasto.alimenti.map((a) => a.nome).join(' · ') : pasto?.nome)

  return (
    <article
      id={`pasto-${voce.categoria}`}
      className={`scroll-mt-4 rounded-xl border bg-superficie ${
        corrente ? 'border-cho border-2' : 'border-bordo'
      }`}
    >
      <button
        type="button"
        onClick={() => setAperto(!aperto)}
        disabled={!pasto}
        aria-expanded={aperto}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="w-11 shrink-0 pt-0.5 text-sm tabular-nums opacity-70">{voce.orario}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {etichetta}
            {corrente && <span className="text-cho"> · adesso</span>}
          </div>
          {pasto ? (
            <>
              <div className="font-semibold leading-snug">
                {titolo}
                {mostraCodice && (
                  <span className="ml-2 rounded bg-bordo px-1.5 py-0.5 text-xs font-medium">
                    {pasto.id}
                  </span>
                )}
              </div>
              <div className="text-sm opacity-70">
                {formatNumero(pasto.kcal)} kcal
                {pasto.proteine !== null && ` · ${formatNumero(pasto.proteine)} g proteine`}
              </div>
            </>
          ) : (
            <div className="font-semibold">Da scegliere</div>
          )}
        </div>
        <div className="shrink-0 text-right text-cho">
          <div className="text-3xl font-bold leading-none tabular-nums">
            {pasto ? formatNumero(pasto.cho) : '—'}
          </div>
          <div className="text-xs font-semibold">g CHO</div>
        </div>
      </button>

      {aperto && pasto && (
        <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
          {pasto.modifiche && (
            <p className="rounded-lg border border-cho p-2 text-sm">
              <span className="font-semibold">Rispetto a {pasto.base}:</span> {pasto.modifiche}
            </p>
          )}
          {pasto.quando && <p className="text-sm">Quando: {pasto.quando}</p>}
          {pasto.alimenti.length > 0 && (
            <div>
              {pasto.modifiche && (
                <div className="text-xs font-semibold uppercase opacity-70">
                  Alimenti di {pasto.base}, da modificare come sopra
                </div>
              )}
              <ElencoAlimenti alimenti={pasto.alimenti} />
            </div>
          )}
          {pasto.varianti?.map((variante) => (
            <div key={variante.nome}>
              <div className="text-xs font-semibold uppercase opacity-70">
                Variante: {variante.nome}
              </div>
              <ElencoAlimenti alimenti={variante.alimenti} />
            </div>
          ))}
          {pasto.note && <p className="text-sm opacity-70">{pasto.note}</p>}
        </div>
      )}
    </article>
  )
}
