// Pasto al posto di quello del piano: libero (testo e valori facoltativi:
// senza, i CHO sono "ND") o composto con il calcolatore (alimenti e quantita', valori sempre noti).
// Il pasto composto si riconosce dal fondo azzurro, mostra i valori rispetto al pasto del piano
// e si modifica riaprendo il calcolatore con gli stessi alimenti.
import { useState } from 'react'
import { confrontaObiettivo, obiettivoDi, type ConfrontoNutriente } from '../calcolatore'
import type { CategoriaPasto } from '../dati'
import { formatNumero } from '../formato'
import { haValori, type PastoLibero, type VocePasto } from '../giornata'
import type { ContestoAvvisi } from '../vincoli'
import { Calcolatore } from './Calcolatore'
import { CorpoPasto } from './CorpoPasto'
import { NumeriPasto } from './NumeriPasto'
import type { ContestoGiornata } from './PannelloScelta'
import { bozzaDa, CampiPastoLibero, daBozza, type BozzaLibero } from './CampiPastoLibero'

type Props = {
  voce: VocePasto
  etichetta: string
  consumato: boolean
  onConsumato: (consumato: boolean) => void
  onSalva: (libero: PastoLibero) => void
  onRipristina: (categoria: CategoriaPasto) => void
  /** Per riaprire il calcolatore su un pasto composto. */
  calcolatore?: { nomeCategoria: string; idCategoria: string[]; giornata?: ContestoGiornata; contestoAvvisi?: ContestoAvvisi }
}

const etichette = { kcal: 'kcal', cho: 'CHO', proteine: 'PRO', grassi: 'grassi' } as const
const segni = { sopra: '▲', sotto: '▼', dentro: '✓' } as const

/** Kcal, CHO, PRO e grassi del pasto composto, con il segno rispetto al pasto del piano. */
function ValoriComposti({ confronti }: { confronti: ConfrontoNutriente[] }) {
  return (
    <div className="mx-4 mb-3 grid grid-cols-4 gap-1 rounded-lg bg-superficie/70 px-2 py-1.5 text-center text-xs">
      {confronti.map((c) => (
        <div key={c.nutriente}>
          <div className="font-semibold uppercase opacity-60">{etichette[c.nutriente]}</div>
          <div className="font-bold tabular-nums">
            {formatNumero(c.attuale)}{' '}
            <span
              className={c.esito === 'dentro' ? 'text-ok' : c.esito === 'sopra' ? 'text-ko' : 'text-pro'}
              aria-label={c.esito === 'dentro' ? 'nel target' : c.esito === 'sopra' ? 'sopra il piano' : 'sotto il piano'}
            >
              {segni[c.esito]}
            </span>
          </div>
          <div className="tabular-nums opacity-60">/ {formatNumero(c.obiettivo)}</div>
        </div>
      ))}
    </div>
  )
}

export function CardPastoLibero({ voce, etichetta, consumato, onConsumato, onSalva, onRipristina, calcolatore }: Props) {
  const libero = voce.libero ?? { testo: '' }
  const daScrivere = libero.testo === ''
  const [bozza, setBozza] = useState<BozzaLibero | null>(daScrivere ? bozzaDa() : null)
  const [aperto, setAperto] = useState(false)
  const [componi, setComponi] = useState(false)
  const composto = libero.composto && libero.composto.length > 0 ? libero.composto : null
  // Il pasto del piano con cui si confronta (sotto il pasto libero c'e' ancora quello previsto).
  const delPiano = voce.delPiano ?? voce.pasto
  const obiettivo = obiettivoDi(delPiano)

  // Un pasto composto si modifica con il calcolatore, gli altri con il testo.
  const apriModifica = () => (composto && calcolatore ? setComponi(true) : setBozza(bozzaDa(libero)))

  if (bozza !== null) {
    return (
      <article id={`pasto-${voce.categoria}`} className="scroll-mt-20 rounded-xl border-2 border-dashed border-cho bg-superficie p-4">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
          {voce.orario} · {etichetta} · libero
        </div>
        <CampiPastoLibero bozza={bozza} onCambia={setBozza} autoFocus />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => (daScrivere ? onRipristina(voce.categoria) : setBozza(null))}
            className="rounded-xl border border-bordo p-2.5 font-medium"
          >
            {daScrivere ? 'Rimetti il pasto' : 'Annulla'}
          </button>
          <button
            type="button"
            disabled={bozza.testo.trim() === ''}
            onClick={() => {
              onSalva(daBozza(bozza))
              setBozza(null)
            }}
            className="rounded-xl bg-cho p-2.5 font-bold text-white disabled:opacity-40"
          >
            Salva
          </button>
        </div>
      </article>
    )
  }

  const conValori = haValori(libero)
  const confronti =
    composto && conValori
      ? confrontaObiettivo(obiettivo.valori, {
          kcal: libero.kcal ?? 0,
          cho: libero.cho ?? 0,
          proteine: libero.proteine ?? 0,
          grassi: libero.grassi ?? 0,
        }).filter((c) => c.nutriente !== 'grassi' || libero.grassi !== undefined)
      : null
  return (
    <article
      id={`pasto-${voce.categoria}`}
      className={`scroll-mt-20 rounded-xl border ${
        composto ? 'border-pro/40 bg-[color-mix(in_srgb,var(--pro)_7%,var(--superficie))]' : 'border-bordo bg-superficie'
      }`}
    >
      <CorpoPasto
        etichetta={etichetta}
        orario={voce.orario}
        dopoEtichetta={
          <>
            {' · '}
            {composto ? <span className="text-pro">composto da te</span> : <span className="text-ko">libero</span>}
          </>
        }
        consumato={consumato}
        onConsumato={onConsumato}
        onApri={() => setAperto(!aperto)}
        aperto={aperto}
        numeri={
          <NumeriPasto
            cho={conValori ? (libero.cho ?? 0) : null}
            proteine={conValori ? (libero.proteine ?? 0) : null}
            grassi={conValori ? (libero.grassi ?? null) : null}
            mancante="ND"
            grande
          />
        }
      >
        {/* Il testo di un pasto composto puo' essere lungo: due righe, tutto quando si apre. */}
        <div className={`font-semibold leading-snug ${aperto ? '' : 'line-clamp-2'}`}>{libero.testo}</div>
        <div className="mt-1 text-sm opacity-70">
          {composto
            ? `al posto di ${delPiano?.id ?? 'del pasto del piano'}`
            : conValori
              ? `${formatNumero(libero.kcal ?? 0)} kcal`
              : `al posto di ${voce.pasto?.id ?? 'del pasto del piano'}`}
        </div>
      </CorpoPasto>
      {confronti && <ValoriComposti confronti={confronti} />}
      {aperto && (
        <div className="grid grid-cols-2 gap-2 border-t border-bordo px-4 pb-4 pt-3">
          <button type="button" onClick={apriModifica} className="rounded-xl border border-bordo p-2.5 font-medium">
            Modifica
          </button>
          <button type="button" onClick={() => onRipristina(voce.categoria)} className="rounded-xl border border-bordo p-2.5 font-medium">
            Rimetti il pasto
          </button>
        </div>
      )}
      {componi && composto && calcolatore && (
        <Calcolatore
          nomeCategoria={calcolatore.nomeCategoria}
          iniziali={composto}
          obiettivo={obiettivo}
          idPasto={delPiano ? [delPiano.id, ...(delPiano.base ? [delPiano.base] : [])] : []}
          idCategoria={calcolatore.idCategoria}
          giornata={calcolatore.giornata}
          contestoAvvisi={calcolatore.contestoAvvisi}
          onChiudi={() => setComponi(false)}
          onUsa={(nuovo) => {
            setComponi(false)
            onSalva(nuovo)
          }}
        />
      )}
    </article>
  )
}
