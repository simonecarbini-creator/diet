import { useState } from 'react'
import { useDiario } from '../diario'
import { isCategoriaConId, type Vincolo } from '../dati'
import type { PastoLibero, VocePasto } from '../giornata'
import { formatNumero, formatScarto } from '../formato'
import { ElencoAlimenti } from './Alimenti'
import { EtichettaProteina } from './EtichettaProteina'
import { CorpoPasto } from './CorpoPasto'
import { NumeriPasto } from './NumeriPasto'
import { etichettePasti } from '../etichette'
import { PannelloScelta, type ContestoGiornata } from './PannelloScelta'
import { SceltaDolce } from './SceltaDolce'
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
  /** Pasto libero scelto nel pannello al posto di quello del piano. */
  onLibero: (libero: PastoLibero) => void
  /** Diario: nota su cosa è stato mangiato davvero. */
  nota?: string
  onAnnota: (testo: string) => void
  /** Per il pannello di scelta: dove arriva la giornata con ogni alternativa. */
  giornata?: ContestoGiornata
  /** Pranzo e cena: aggiunge (id) o toglie (null) un dolce. */
  onDolce?: (id: string | null) => void
}

export function CardPasto({
  voce,
  corrente,
  consumato,
  tipoGiorno,
  settimana,
  nota,
  onAnnota,
  giornata,
  onConsumato,
  onScegli,
  onLibero,
  onDolce,
}: Props) {
  const [sceltaDolce, setSceltaDolce] = useState(false)
  const dolce = voce.dolce
  const diario = useDiario()
  const [aperto, setAperto] = useState(false)
  const [pannello, setPannello] = useState(false)
  const [bozzaNota, setBozzaNota] = useState<string | null>(null)
  const { pasto, categoria, delPiano } = voce
  const etichetta = etichettePasti[categoria]
  const sceglibile = isCategoriaConId(categoria)
  // Se il nome ripete la categoria (es. "Pre-corsa"), meglio elencare gli alimenti.
  const titolo =
    pasto?.composizione ??
    (pasto?.nome === etichetta ? pasto.alimenti.map((a) => a.nome).join(' · ') : pasto?.nome)
  const sostituito = delPiano !== undefined
  // Codici del piano (STD, P1, C2, Mrid…) solo dove il calendario li assegna.
  const mostraCodice = isCategoriaConId(categoria) && categoria !== 'spuntino'
  // Vincoli con un limite settimanale che riguardano questo pasto (es. C2 → pesce grasso).
  const base = pasto && (categoria === 'pranzo' || categoria === 'cena') ? idBase(categoria, pasto.id) : null
  const contatori = base && settimana ? conteggiDelPasto(settimana.conteggi, base).filter((c) => frazioneLimite(c)) : []

  return (
    <article
      id={`pasto-${categoria}`}
      className={`scroll-mt-20 rounded-xl bg-superficie ${corrente ? 'border-2 border-cho' : 'border border-bordo'}`}
    >
      <CorpoPasto
        etichetta={etichetta}
        orario={voce.orario}
        dopoEtichetta={
          <>
            {corrente && <span className="text-cho"> · adesso</span>}
            {diario && nota && <span className="text-cho"> · nota</span>}
          </>
        }
        consumato={consumato}
        spuntabile={!!pasto}
        onConsumato={onConsumato}
        // Senza pasto (merenda da scegliere) non c'è niente da aprire: si va dritti alla scelta.
        onApri={() => (pasto ? setAperto(!aperto) : sceglibile && setPannello(true))}
        aperto={pasto ? aperto : undefined}
        numeri={<NumeriPasto cho={pasto?.cho ?? null} proteine={pasto?.proteine ?? null} grassi={pasto?.grassi ?? null} grande />}
      >
        {pasto ? (
          <>
            <div className="line-clamp-2 font-semibold leading-snug">{titolo}</div>
            {(mostraCodice || pasto.proteina) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {mostraCodice && <span className="rounded bg-bordo px-1.5 py-0.5 text-xs font-medium">{pasto.id}</span>}
                <EtichettaProteina tipo={pasto.proteina} />
              </div>
            )}
            <div className="mt-1 text-sm opacity-70">{formatNumero(pasto.kcal)} kcal</div>
            {sostituito && (
              <div className="text-sm font-semibold text-cho">
                {delPiano
                  ? `al posto di ${delPiano.id}: ` +
                    (pasto.cho === delPiano.cho ? 'stessi CHO' : `${formatScarto(pasto.cho - delPiano.cho, 'g')} di CHO`) +
                    (pasto.kcal === delPiano.kcal ? '' : `, ${formatScarto(pasto.kcal - delPiano.kcal, 'kcal')}`)
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
      </CorpoPasto>

      {/* Il dolce aggiunto resta sempre in vista, con i suoi CHO e il totale con il pasto. */}
      {dolce && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg bg-sfondo px-3 py-2">
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">+ {dolce.nome}</div>
            <div className="opacity-70">
              {formatNumero(dolce.kcal)} kcal
              {pasto && ` · con il pasto ${formatNumero(pasto.cho + dolce.cho)} g CHO`}
            </div>
          </div>
          <NumeriPasto cho={dolce.cho} proteine={dolce.proteine} />
          {onDolce && (
            <button
              type="button"
              onClick={() => onDolce(null)}
              aria-label={`Togli ${dolce.nome}`}
              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-50"
            >
              ✕
            </button>
          )}
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
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs font-semibold uppercase opacity-70">
                  Variante: {variante.nome}
                  {variante.kcal !== undefined && <span className="normal-case"> · {formatNumero(variante.kcal)} kcal</span>}
                </div>
                {/* Con valori propri (es. spuntino serale con ricotta) i CHO si vedono subito. */}
                {variante.cho !== undefined && <NumeriPasto cho={variante.cho} proteine={variante.proteine ?? null} />}
              </div>
              <ElencoAlimenti alimenti={variante.alimenti} />
              {variante.note && <p className="text-sm opacity-70">{variante.note}</p>}
            </div>
          ))}
          {pasto.note && <p className="text-sm opacity-70">{pasto.note}</p>}

          {diario && (
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
          )}

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
          {onDolce && (
            <button
              type="button"
              onClick={() => setSceltaDolce(true)}
              className="w-full rounded-xl border border-dashed border-cho p-3 font-semibold text-cho"
            >
              {dolce ? 'Cambia il dolce' : '+ Aggiungi un dolce'}
            </button>
          )}
        </div>
      )}

      {sceltaDolce && onDolce && (
        <SceltaDolce
          nomePasto={etichetta.toLowerCase()}
          giornata={giornata}
          // La giornata con questo pasto ma senza il suo dolce (senzaQuesto comprende il dolce).
          giornataSenzaDolce={
            giornata && pasto
              ? {
                  cho: giornata.senzaQuesto.cho - (dolce?.cho ?? 0) + pasto.cho,
                  kcal: giornata.senzaQuesto.kcal - (dolce?.kcal ?? 0) + pasto.kcal,
                }
              : undefined
          }
          attuale={dolce?.id}
          onChiudi={() => setSceltaDolce(false)}
          onScegli={(id) => {
            onDolce(id)
            setSceltaDolce(false)
          }}
        />
      )}

      {pannello && sceglibile && (
        <PannelloScelta
          categoria={categoria}
          nomeCategoria={etichetta.toLowerCase()}
          voce={voce}
          tipoGiorno={tipoGiorno}
          conteggiAltri={settimana?.conteggiAltri}
          tipoDomani={settimana?.tipoDomani}
          giornata={giornata}
          onChiudi={() => setPannello(false)}
          onLibero={(libero) => {
            onLibero(libero)
            setPannello(false)
          }}
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
