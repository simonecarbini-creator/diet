import { useState } from 'react'
import { isCategoriaConId, type Vincolo } from '../dati'
import type { VocePasto } from '../giornata'
import { formatDifferenzaCho, formatNumero } from '../formato'
import { ElencoAlimenti } from './Alimenti'
import { etichettePasti } from '../etichette'
import { DifferenzaKcal } from './DifferenzaKcal'
import { PannelloScelta } from './PannelloScelta'
import { ContatoreSettimana, PromemoriaSera } from './Vincoli'
import { conteggiDelPasto, frazioneLimite, idBase, type ConteggioVincolo } from '../vincoli'

/** Contesto della settimana, solo per la cena: contatori e promemoria della sera. */
export type ContestoSettimana = {
  /** Conteggi dei vincoli settimanali, oggi compreso. */
  conteggi: Record<string, ConteggioVincolo>
  /** Conteggi degli altri giorni: per dire "con questa arrivi a…" nel pannello. */
  conteggiAltri: Record<string, ConteggioVincolo>
  promemoriaSera: Vincolo[]
  tipoDomani?: string
}


type Props = {
  voce: VocePasto
  corrente: boolean
  consumato: boolean
  tipoGiorno: string
  settimana?: ContestoSettimana
  onConsumato: (consumato: boolean) => void
  onScegli: (id: string | null) => void
  /** Diario: nota su cosa è stato mangiato davvero. */
  nota?: string
  onAnnota: (testo: string) => void
  /** Giornata libera, pasto ancora da decidere: si conferma (✓) o si toglie (✕). */
  sgarro?: { onConferma: () => void; onElimina: () => void }
}

export function CardPasto({
  voce,
  corrente,
  consumato,
  tipoGiorno,
  settimana,
  nota,
  onAnnota,
  sgarro,
  onConsumato,
  onScegli,
}: Props) {
  const [aperto, setAperto] = useState(false)
  const [pannello, setPannello] = useState(false)
  const [bozzaNota, setBozzaNota] = useState<string | null>(null)
  const { pasto, categoria, delPiano } = voce
  const etichetta = etichettePasti[categoria]
  const sceglibile = isCategoriaConId(categoria)
  // Codici del piano (STD, P1, C2, Mrid…) solo dove il calendario li assegna.
  const mostraCodice = isCategoriaConId(categoria) && categoria !== 'spuntino'
  // Se il nome ripete la categoria (es. "Pre-corsa"), meglio elencare gli alimenti.
  const titolo =
    pasto?.composizione ??
    (pasto?.nome === etichetta ? pasto.alimenti.map((a) => a.nome).join(' · ') : pasto?.nome)
  const sostituito = delPiano !== undefined
  // Vincoli con un limite settimanale che riguardano questo pasto (es. C2 → pesce grasso).
  const base = pasto && (categoria === 'pranzo' || categoria === 'cena') ? idBase(categoria, pasto.id) : null
  const contatori = base && settimana ? conteggiDelPasto(settimana.conteggi, base).filter((c) => frazioneLimite(c)) : []

  return (
    <article
      id={`pasto-${categoria}`}
      className={`scroll-mt-20 rounded-xl bg-superficie ${
        sgarro
          ? 'vibra border-2 border-dashed border-cho'
          : corrente
            ? 'border-2 border-cho'
            : 'border border-bordo'
      }`}
    >
      {/* Giornata libera: finché il pasto non è deciso, funzionano solo ✓ e ✕. */}
      <div className={`flex items-start ${sgarro ? 'pointer-events-none opacity-40' : ''}`} aria-hidden={sgarro ? true : undefined}>
        <div className="flex shrink-0 flex-col items-center gap-2 self-stretch py-4 pl-4 pr-1">
          <button
            type="button"
            onClick={() => onConsumato(!consumato)}
            disabled={!pasto}
            aria-pressed={consumato}
            aria-label={consumato ? `${etichetta}: consumato` : `Segna ${etichetta} come consumato`}
            className={pasto ? '' : 'opacity-30'}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${
                consumato ? 'border-cho bg-cho text-white' : 'border-bordo'
              }`}
            >
              {consumato && '✓'}
            </span>
          </button>
        </div>

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
              {nota && <span className="text-cho"> · nota</span>}
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
                <div className="text-sm">
                  <span className="opacity-70">{formatNumero(pasto.kcal)} kcal</span>
                  {delPiano && <DifferenzaKcal differenza={pasto.kcal - delPiano.kcal} />}
                  {pasto.proteine !== null && (
                    <span className="opacity-70"> · {formatNumero(pasto.proteine)} g proteine</span>
                  )}
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
                Da scegliere
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

      {sgarro && (
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <button
            type="button"
            onClick={sgarro.onConferma}
            aria-label={`Tieni ${etichetta} come da piano`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ok text-base font-bold text-white shadow"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={sgarro.onElimina}
            aria-label={`Togli ${etichetta} e scrivi cosa hai mangiato`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ko text-base font-bold text-white shadow"
          >
            ✕
          </button>
        </div>
      )}

      {pasto && (contatori.length > 0 || (settimana && settimana.promemoriaSera.length > 0)) && (
        <div className="space-y-2 px-4 pb-3">
          {contatori.map((c) => (
            <ContatoreSettimana key={c.vincolo.id} conteggio={c} />
          ))}
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

          <div className="border-t border-bordo pt-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase opacity-70">Diario: cosa ho mangiato davvero</span>
              <textarea
                rows={2}
                value={bozzaNota ?? nota ?? ''}
                onChange={(e) => setBozzaNota(e.target.value)}
                placeholder="Facoltativo, solo se diverso dal piano"
                className="mt-1 w-full resize-none rounded-lg border border-bordo bg-sfondo px-2.5 py-2 text-sm outline-none focus:border-cho"
              />
            </label>
            {bozzaNota !== null && bozzaNota.trim() !== (nota ?? '') && (
              <button
                type="button"
                onClick={() => {
                  onAnnota(bozzaNota)
                  setBozzaNota(null)
                }}
                className="mt-1 rounded-lg bg-cho px-3 py-1.5 text-sm font-semibold text-white"
              >
                Salva nota
              </button>
            )}
          </div>

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
            // Scelta fatta: la card si richiude e mostra il pasto scelto come le altre.
            setAperto(false)
          }}
        />
      )}
    </article>
  )
}
