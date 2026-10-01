import { useState } from 'react'
import { dati, isCategoriaConId, type CategoriaPasto, type Vincolo } from '../dati'
import type { VocePasto } from '../giornata'
import { formatDifferenzaCho, formatNumero } from '../formato'
import { ElencoAlimenti } from './Alimenti'
import { PannelloScelta } from './PannelloScelta'
import { ContatoreSettimana, PromemoriaSera } from './Vincoli'
import { idBase, type ConteggioPasto } from '../vincoli'

/** Contesto della settimana, solo per la cena: contatori e promemoria della sera. */
export type ContestoSettimana = {
  /** Conteggi della settimana, oggi compreso. */
  conteggi: Record<string, ConteggioPasto>
  /** Conteggi degli altri giorni: per dire "con questa arrivi a…" nel pannello. */
  conteggiAltri: Record<string, ConteggioPasto>
  promemoriaSera: Vincolo[]
  tipoDomani?: string
}

const etichetteCategoria: Record<CategoriaPasto, string> = {
  preCorsa: 'Pre-corsa',
  colazione: 'Colazione',
  spuntino: 'Spuntino',
  pranzo: 'Pranzo',
  merenda: 'Merenda',
  cena: 'Cena',
  spuntinoSerale: 'Spuntino serale',
}

type Props = {
  voce: VocePasto
  corrente: boolean
  consumato: boolean
  tipoGiorno: string
  solaLettura: boolean
  settimana?: ContestoSettimana
  onConsumato: (consumato: boolean) => void
  onScegli: (id: string | null) => void
}

export function CardPasto({
  voce,
  corrente,
  consumato,
  tipoGiorno,
  solaLettura,
  settimana,
  onConsumato,
  onScegli,
}: Props) {
  const [aperto, setAperto] = useState(false)
  const [pannello, setPannello] = useState(false)
  const { pasto, categoria, delPiano } = voce
  const etichetta = etichetteCategoria[categoria]
  const sceglibile = !solaLettura && isCategoriaConId(categoria)
  // Codici del piano (STD, P1, C2, Mrid…) solo dove il calendario li assegna.
  const mostraCodice = isCategoriaConId(categoria) && categoria !== 'spuntino'
  // Se il nome ripete la categoria (es. "Pre-corsa"), meglio elencare gli alimenti.
  const titolo =
    pasto?.composizione ??
    (pasto?.nome === etichetta ? pasto.alimenti.map((a) => a.nome).join(' · ') : pasto?.nome)
  const sostituito = delPiano !== undefined
  const base = pasto && categoria === 'cena' ? idBase('cena', pasto.id) : null
  const conteggio = base ? settimana?.conteggi[base] : undefined
  const nomeBase = dati.cene.find((c) => c.id === base)?.nome ?? ''

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
          disabled={!pasto || solaLettura}
          aria-pressed={consumato}
          aria-label={consumato ? `${etichetta}: consumato` : `Segna ${etichetta} come consumato`}
          className={`flex shrink-0 self-stretch py-4 pl-4 pr-1 ${pasto ? '' : 'opacity-30'}`}
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
          // Senza pasto (merenda da scegliere) non c'è niente da aprire: si va dritti alla scelta.
          onClick={() => (pasto ? setAperto(!aperto) : sceglibile && setPannello(true))}
          aria-expanded={pasto ? aperto : undefined}
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
                    {delPiano
                      ? `al posto di ${delPiano.id}` +
                        (pasto.cho !== delPiano.cho
                          ? ` · ${formatDifferenzaCho(pasto.cho - delPiano.cho)}`
                          : '')
                      : 'scelta per oggi'}
                  </div>
                )}
              </>
            ) : (
              <div className="font-semibold">
                {solaLettura ? 'Non scelta' : 'Da scegliere'}
                {sceglibile && <span className="text-cho"> ›</span>}
              </div>
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

      {pasto && (conteggio || (settimana && settimana.promemoriaSera.length > 0)) && (
        <div className="space-y-2 px-4 pb-3">
          {base && conteggio && <ContatoreSettimana id={base} nome={nomeBase} conteggio={conteggio} />}
          {settimana?.tipoDomani && (
            <PromemoriaSera vincoli={settimana.promemoriaSera} tipoDomani={settimana.tipoDomani} />
          )}
        </div>
      )}

      {aperto && pasto && (
        <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
          {delPiano && (
            <p className="text-sm">
              Nel piano: <span className="font-semibold">{delPiano.id}</span>{' '}
              {delPiano.composizione ?? delPiano.nome} · {formatNumero(delPiano.cho)} g CHO
            </p>
          )}
          {pasto.notaVersione && (
            <p className="rounded-lg border border-cho p-2 text-sm">{pasto.notaVersione}</p>
          )}
          {pasto.quando && <p className="text-sm">Quando: {pasto.quando}</p>}
          {pasto.alimenti.length > 0 && <ElencoAlimenti alimenti={pasto.alimenti} />}
          {pasto.varianti?.map((variante) => (
            <div key={variante.nome}>
              <div className="text-xs font-semibold uppercase opacity-70">
                Variante: {variante.nome}
              </div>
              <ElencoAlimenti alimenti={variante.alimenti} />
            </div>
          ))}
          {pasto.note && <p className="text-sm opacity-70">{pasto.note}</p>}

          {sceglibile && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPannello(true)}
                className="flex-1 rounded-xl border border-cho p-3 font-semibold text-cho"
              >
                Cambia {etichetta.toLowerCase()}
              </button>
              {sostituito && (
                <button
                  type="button"
                  onClick={() => onScegli(null)}
                  className="flex-1 rounded-xl border border-bordo p-3 font-medium"
                >
                  {voce.idPiano === null ? 'Annulla scelta' : `Torna a ${voce.idPiano}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {pannello && sceglibile && (
        <PannelloScelta
          categoria={categoria}
          nomeCategoria={etichetta.toLowerCase()}
          voce={voce}
          tipoGiorno={tipoGiorno}
          conteggiAltri={settimana?.conteggiAltri}
          onChiudi={() => setPannello(false)}
          onScegli={(id) => {
            onScegli(id)
            setPannello(false)
            // Dopo la scelta si vedono subito alimenti e grammi del nuovo pasto.
            setAperto(id !== null || voce.idPiano !== null)
          }}
        />
      )}
    </article>
  )
}
