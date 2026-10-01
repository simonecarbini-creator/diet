import { useState } from 'react'
import { isCategoriaConId, type Alimento, type CategoriaPasto } from '../dati'
import type { VocePasto } from '../giornata'
import { formatDifferenzaCho, formatNumero } from '../formato'
import { SceltaPasto } from './SceltaPasto'

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
  consumato: boolean
  tipoGiorno: string
  onConsumato: (consumato: boolean) => void
  onScegli: (id: string | null) => void
}

export function CardPasto({ voce, corrente, consumato, tipoGiorno, onConsumato, onScegli }: Props) {
  const [aperto, setAperto] = useState(false)
  const { pasto, categoria } = voce
  const etichetta = etichetteCategoria[categoria]
  const sceglibile = isCategoriaConId(categoria)
  // Codici del piano (STD, P1, C2, Mrid…) solo dove il calendario li assegna.
  const mostraCodice = sceglibile && categoria !== 'spuntino'
  // Se il nome ripete la categoria (es. "Pre-corsa"), meglio elencare gli alimenti.
  const titolo =
    pasto?.composizione ??
    (pasto?.nome === etichetta ? pasto.alimenti.map((a) => a.nome).join(' · ') : pasto?.nome)
  const sostituito = voce.delPiano !== undefined

  return (
    <article
      id={`pasto-${categoria}`}
      className={`scroll-mt-4 rounded-xl border bg-superficie ${
        corrente ? 'border-2 border-cho' : 'border-bordo'
      }`}
    >
      <div className="flex items-start">
        <button
          type="button"
          onClick={() => onConsumato(!consumato)}
          disabled={!pasto}
          aria-pressed={consumato}
          aria-label={consumato ? `${etichetta}: consumato` : `Segna ${etichetta} come consumato`}
          className="flex shrink-0 self-stretch py-4 pl-4 pr-1 disabled:opacity-30"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${
              consumato ? 'border-cho bg-cho text-white' : 'border-bordo'
            }`}
          >
            {consumato && '✓'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAperto(!aperto)}
          aria-expanded={aperto}
          className={`flex min-w-0 flex-1 items-start gap-3 py-4 pl-2 pr-4 text-left ${
            consumato ? 'opacity-60' : ''
          }`}
        >
          <div className="w-11 shrink-0 pt-0.5 text-sm tabular-nums opacity-70">{voce.orario}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {etichetta}
              {corrente && <span className="text-cho"> · adesso</span>}
              {consumato && ' · consumato'}
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
                {sostituito && (
                  <div className="text-sm font-semibold text-cho">
                    {voce.delPiano
                      ? `al posto di ${voce.delPiano.id}` +
                        (pasto.cho !== voce.delPiano.cho
                          ? ` · ${formatDifferenzaCho(pasto.cho - voce.delPiano.cho)}`
                          : '')
                      : 'scelta per oggi'}
                  </div>
                )}
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
      </div>

      {aperto && (
        <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
          {pasto?.modifiche && (
            <p className="rounded-lg border border-cho p-2 text-sm">
              <span className="font-semibold">Rispetto a {pasto.base}:</span> {pasto.modifiche}
            </p>
          )}
          {pasto?.quando && <p className="text-sm">Quando: {pasto.quando}</p>}
          {pasto && pasto.alimenti.length > 0 && (
            <div>
              {pasto.modifiche && (
                <div className="text-xs font-semibold uppercase opacity-70">
                  Alimenti di {pasto.base}, da modificare come sopra
                </div>
              )}
              <ElencoAlimenti alimenti={pasto.alimenti} />
            </div>
          )}
          {pasto?.varianti?.map((variante) => (
            <div key={variante.nome}>
              <div className="text-xs font-semibold uppercase opacity-70">
                Variante: {variante.nome}
              </div>
              <ElencoAlimenti alimenti={variante.alimenti} />
            </div>
          ))}
          {pasto?.note && <p className="text-sm opacity-70">{pasto.note}</p>}
          {sceglibile && (
            <div className="border-t border-bordo pt-3">
              <SceltaPasto
                categoria={categoria}
                voce={voce}
                tipoGiorno={tipoGiorno}
                onScegli={(id) => {
                  onScegli(id)
                  if (id !== null) setAperto(false)
                }}
              />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
