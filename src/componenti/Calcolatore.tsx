// Calcolatore del pasto: si sceglie alimento per alimento, con la quantita' sulla rotella,
// e il box in alto confronta in tempo reale kcal, CHO, proteine e grassi con il pasto del
// piano (tolleranze in dati.json → regole.calcolatore). Rosso se un valore esce, sopra o sotto.
import { useBloccoScorrimento } from '../bloccoScorrimento'
import { useCallback, useEffect, useState } from 'react'
import {
  confrontaObiettivo,
  descriviQuantita,
  fasciaDelPasto,
  pezziDa,
  unitaPratica,
  valoriPezzi,
  corrisponde,
  gruppiAlimenti,
  totaleComposto,
  trovaAlimento,
  unitaBreve,
  valoriAlimento,
  valoriSelettore,
  type ConfrontoNutriente,
  type Valori,
  type VoceComposta,
} from '../calcolatore'
import { categorieAlimenti, dati, type AlimentoBanca, type Nutriente } from '../dati'
import { formatNumero } from '../formato'
import { targetGiorno, valutaAlternativa, type PastoLibero } from '../giornata'
import { BoxGiornata } from './BoxGiornata'
import type { ContestoGiornata } from './PannelloScelta'
import { SelettoreQuantita } from './SelettoreQuantita'
import { avvisiAlimento, type AvvisoAlimento, type ContestoAvvisi } from '../vincoli'

const etichette: Record<Nutriente, string> = { kcal: 'kcal', cho: 'CHO', proteine: 'PRO', grassi: 'grassi' }
const unitaNutriente = (n: Nutriente) => (n === 'kcal' ? '' : ' g')

type Props = {
  /** Es. "pranzo". */
  nomeCategoria: string
  /** Alimenti gia' scelti (per modificare un pasto composto). */
  iniziali?: VoceComposta[]
  /** Il pasto con cui confrontarsi: quello del piano (o la merenda media). */
  obiettivo: { etichetta: string; valori: Partial<Valori> }
  /** Id del pasto del piano (e della sua base): i suoi alimenti vengono per primi. */
  idPasto: string[]
  /** Id di tutti i pasti della stessa categoria: i loro alimenti vengono subito dopo. */
  idCategoria: string[]
  giornata?: ContestoGiornata
  /** Per segnalare gli alimenti che andrebbero contro le regole della settimana. */
  contestoAvvisi?: ContestoAvvisi
  onUsa: (libero: PastoLibero) => void
  onChiudi: () => void
}

function BoxObiettivo({
  confronti,
  vuoto,
  fascia,
}: {
  confronti: ConfrontoNutriente[]
  vuoto: boolean
  /** Quanto puo' valere il pasto perche' la giornata resti nel target. */
  fascia?: { cho: { da: number; a: number }; kcal: { da: number; a: number } }
}) {
  const oltre = confronti.filter((c) => c.esito === 'sopra')
  const mancano = confronti.filter((c) => c.esito === 'sotto')
  // Neutro finche' e' vuoto, blu mentre si compone (sotto l'obiettivo), verde dentro, rosso solo oltre.
  const stato = vuoto ? 'vuoto' : oltre.length > 0 ? 'oltre' : mancano.length > 0 ? 'inCorso' : 'dentro'
  const bordo = { vuoto: 'border-bordo bg-sfondo', inCorso: 'border-pro bg-pro/10', dentro: 'border-ok bg-ok/10', oltre: 'border-ko bg-ko/10' }[stato]
  const elenco = (lista: ConfrontoNutriente[], assoluto = false) =>
    lista
      .map((c) => `${etichette[c.nutriente]} ${formatNumero(assoluto ? Math.abs(c.scarto) : c.scarto)}${c.nutriente === 'kcal' ? '' : ' g'}`)
      .join(' · ')
  return (
    <div className={`rounded-xl border-2 p-3 ${bordo}`}>
      <div className="grid grid-cols-4 gap-2 text-center">
        {confronti.map((c) => (
          <div key={c.nutriente}>
            <div className="text-xs font-semibold uppercase opacity-70">{etichette[c.nutriente]}</div>
            <div
              className={`font-bold leading-tight tabular-nums ${c.nutriente === 'cho' ? 'text-2xl' : 'text-xl'} ${
                c.esito === 'sopra' && !vuoto ? 'text-ko' : c.nutriente === 'cho' ? 'text-cho' : ''
              }`}
            >
              {formatNumero(c.attuale)}
            </div>
            <div className="text-xs tabular-nums opacity-70">
              / {formatNumero(c.obiettivo)}
              {unitaNutriente(c.nutriente)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold">
        {stato === 'vuoto' && <span className="opacity-70">Aggiungi gli alimenti: i totali crescono qui.</span>}
        {stato === 'dentro' && <span className="text-ok">✓ Nel target del pasto</span>}
        {oltre.length > 0 && <span className="block text-ko">Oltre: {elenco(oltre)}</span>}
        {mancano.length > 0 && !vuoto && <span className="block text-pro">Mancano: {elenco(mancano, true)}</span>}
      </p>
      {fascia && (
        <p className="mt-1 text-xs opacity-80">
          Perche' la giornata resti nel target questo pasto deve stare tra{' '}
          <span className="font-semibold">
            {formatNumero(fascia.cho.da)}–{formatNumero(fascia.cho.a)} g CHO
          </span>{' '}
          e {formatNumero(fascia.kcal.da)}–{formatNumero(fascia.kcal.a)} kcal.
        </p>
      )}
    </div>
  )
}

/** Le regole della settimana che riguardano l'alimento: sconsigliato (rosso) o informazione (verde). */
function Avvisi({ avvisi, compatti = false }: { avvisi: AvvisoAlimento[]; compatti?: boolean }) {
  if (avvisi.length === 0) return null
  return (
    <span className={`block ${compatti ? 'text-xs' : 'mt-2 space-y-1 text-sm'}`}>
      {avvisi.map((a) => (
        <span key={a.testo} className={`block font-semibold ${a.livello === 'sconsigliato' ? 'text-ko' : 'text-ok'}`}>
          {a.livello === 'sconsigliato' ? '⚠ Sconsigliato: ' : '✓ '}
          {a.testo}
        </span>
      ))}
    </span>
  )
}

/**
 * Foglio con la rotella: quantita' e valori di quell'alimento, poi Aggiungi o Togli.
 * Con un'unita' pratica (cucchiai, pezzi di frutta) la rotella conta quella e sotto si
 * correggono i grammi. Ogni cambiamento arriva subito al box del pasto (onCambia).
 */
function SceltaQuantita({
  alimento,
  iniziale,
  gia,
  avvisi,
  onCambia,
  onConferma,
  onTogli,
  onChiudi,
}: {
  alimento: AlimentoBanca
  iniziale: number
  gia: boolean
  avvisi: AvvisoAlimento[]
  onCambia: (quantita: number) => void
  onConferma: (quantita: number) => void
  onTogli: () => void
  onChiudi: () => void
}) {
  const u = unitaPratica(alimento)
  const [quantita, setQuantita] = useState(iniziale)
  const [pezzi, setPezzi] = useState(u ? pezziDa(u, iniziale) : 0)
  useEffect(() => onCambia(quantita), [quantita, onCambia])
  const v = valoriAlimento(alimento, quantita)
  const unita = unitaBreve(alimento)
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30" onClick={onChiudi}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alimento.nome}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-t-2xl bg-superficie px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-snug">{alimento.nome}</h3>
            <p className="text-xs opacity-70">
              per 100 {alimento.unita === 'ml' ? 'ml' : 'g'}: {formatNumero(alimento.per100.cho)} g CHO ·{' '}
              {formatNumero(alimento.per100.kcal)} kcal
              {alimento.unita === 'pz' && ` · 1 pz = ${formatNumero(alimento.grammiPerPezzo ?? 0)} g`}
            </p>
          </div>
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-2xl">
            ✕
          </button>
        </div>
        {alimento.nota && <p className="mt-1 text-xs opacity-70">{alimento.nota}</p>}
        <Avvisi avvisi={avvisi} />

        <div className="mt-3">
          {u ? (
            <SelettoreQuantita
              valori={valoriPezzi(u)}
              valore={pezzi}
              unita={u.singolare}
              unitaPlurale={u.plurale}
              onCambia={(p) => {
                setPezzi(p)
                setQuantita(Math.round(p * u.grammi))
              }}
            />
          ) : (
            <SelettoreQuantita valori={valoriSelettore(alimento)} valore={quantita} unita={unita} onCambia={setQuantita} />
          )}
        </div>
        {u && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setQuantita(Math.max(alimento.passo, quantita - alimento.passo))}
              aria-label="Meno grammi"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bordo text-lg font-bold"
            >
              −
            </button>
            <span className="min-w-24 text-center font-semibold tabular-nums">
              {formatNumero(quantita)} {unita}
            </span>
            <button
              type="button"
              onClick={() => setQuantita(quantita + alimento.passo)}
              aria-label="Piu' grammi"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bordo text-lg font-bold"
            >
              +
            </button>
          </div>
        )}
        {u && <p className="mt-1 text-center text-xs opacity-70">Peso medio: se hai pesato, correggi i grammi.</p>}

        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-sfondo p-2 text-center">
          {(['cho', 'kcal', 'proteine', 'grassi'] as const).map((n) => (
            <div key={n}>
              <div className="text-xs font-semibold uppercase opacity-70">{etichette[n]}</div>
              <div className={`font-bold tabular-nums ${n === 'cho' ? 'text-2xl text-cho' : 'text-lg'}`}>{formatNumero(Math.round(v[n]))}</div>
            </div>
          ))}
        </div>

        <div className={`mt-3 grid gap-2 ${gia ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {gia && (
            <button type="button" onClick={onTogli} className="rounded-xl border border-ko p-3.5 font-semibold text-ko">
              Togli
            </button>
          )}
          <button type="button" onClick={() => onConferma(quantita)} className="rounded-xl bg-cho p-3.5 text-lg font-bold text-white">
            {gia ? 'Aggiorna' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Calcolatore({ nomeCategoria, iniziali, obiettivo, idPasto, idCategoria, giornata, contestoAvvisi, onUsa, onChiudi }: Props) {
  const [voci, setVoci] = useState<VoceComposta[]>(iniziali ?? [])
  const [cerca, setCerca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [aperto, setAperto] = useState<AlimentoBanca | null>(null)
  // Quantita' che si sta scegliendo sulla rotella: il box del pasto la conta gia'.
  const [anteprima, setAnteprima] = useState<VoceComposta | null>(null)
  const chiudiScelta = () => {
    setAperto(null)
    setAnteprima(null)
  }

  // Sotto il calcolatore la pagina non deve scorrere.
  useBloccoScorrimento()

  const vociConAnteprima = anteprima
    ? voci.some((v) => v.id === anteprima.id)
      ? voci.map((v) => (v.id === anteprima.id ? anteprima : v))
      : [...voci, anteprima]
    : voci
  const totale = totaleComposto(vociConAnteprima)
  const confronti = confrontaObiettivo(obiettivo.valori, totale)
  const inRicerca = cerca.trim().length >= 2
  const filtra = (a: AlimentoBanca) => (!categoria || a.categoria === categoria) && (!inRicerca || corrisponde(a, cerca))
  const avvisiDi = (id: string) => (contestoAvvisi ? avvisiAlimento(id, contestoAvvisi) : [])
  const sconsigliato = (id: string) => avvisiDi(id).some((a) => a.livello === 'sconsigliato')
  // In ogni gruppo gli alimenti sconsigliati vanno in fondo (restano sceglibili).
  const gruppi = gruppiAlimenti(idPasto, idCategoria)
    .map((g) => ({
      ...g,
      alimenti: g.alimenti.filter(filtra).sort((a, b) => Number(sconsigliato(a.id)) - Number(sconsigliato(b.id))),
    }))
    .filter((g) => g.alimenti.length > 0)
  const titoli = {
    evidenza: dati.bancaAlimenti.inEvidenza.titolo,
    pasto: `Nel pasto ${obiettivo.etichetta}`,
    categoria: `Negli altri pasti (${nomeCategoria})`,
    altri: 'Altri alimenti',
  }
  const quantitaDi = (id: string) => voci.find((v) => v.id === id)?.quantita
  const target = giornata ? targetGiorno(giornata.piano) : null
  const fascia = target && giornata ? fasciaDelPasto(target, giornata.senzaQuesto) : undefined

  const idAperto = aperto?.id
  const anteprimaDi = useCallback((quantita: number) => {
    if (idAperto) setAnteprima({ id: idAperto, quantita })
  }, [idAperto])

  function usa() {
    const testo = voci
      .map((v) => {
        const a = trovaAlimento(v.id)
        return a ? `${a.nome} ${descriviQuantita(a, v.quantita)}` : ''
      })
      .filter(Boolean)
      .join(' · ')
    onUsa({
      testo,
      kcal: Math.round(totale.kcal),
      cho: Math.round(totale.cho),
      proteine: Math.round(totale.proteine),
      grassi: Math.round(totale.grassi),
      composto: voci,
    })
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Componi il ${nomeCategoria}`} className="fixed inset-0 z-[60] flex flex-col bg-sfondo">
      {/* Mentre si sceglie la quantita' il box resta sopra la velina e si aggiorna in tempo reale. */}
      <header className={`shrink-0 border-b border-bordo bg-superficie px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] ${aperto ? 'relative z-[71]' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Componi il pasto</h2>
            <p className="text-sm opacity-70">
              Obiettivo: {obiettivo.etichetta}. Blu finche' manca qualcosa, verde nel target, rosso se vai oltre.
            </p>
          </div>
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl">
            ✕
          </button>
        </div>
        <div className="mt-2">
          <BoxObiettivo confronti={confronti} vuoto={vociConAnteprima.length === 0} fascia={fascia} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {voci.length > 0 && (
          <section className="mb-4">
            <h3 className="mb-1 text-xs font-semibold uppercase opacity-70">Nel piatto</h3>
            <ul className="divide-y divide-bordo rounded-xl border border-bordo bg-superficie">
              {voci.map((v) => {
                const a = trovaAlimento(v.id)
                if (!a) return null
                return (
                  <li key={v.id} className="flex items-center gap-2 pl-3">
                    <button type="button" onClick={() => setAperto(a)} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {sconsigliato(a.id) && <span className="text-ko">⚠ </span>}
                        {a.nome}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums opacity-70">{descriviQuantita(a, v.quantita)}</span>
                      <span className="w-16 shrink-0 text-right font-bold tabular-nums text-cho">
                        {formatNumero(Math.round(valoriAlimento(a, v.quantita).cho))} g
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoci(voci.filter((x) => x.id !== v.id))}
                      aria-label={`Togli ${a.nome}`}
                      className="flex h-11 w-10 shrink-0 items-center justify-center opacity-50"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
            {target && giornata && (
              <BoxGiornata
                titolo="La giornata con questo pasto"
                totale={valutaAlternativa(giornata.senzaQuesto, { cho: Math.round(totale.cho), kcal: Math.round(totale.kcal) }, target)}
                target={target}
                inCorso
              />
            )}
          </section>
        )}

        <label className="relative block">
          <span className="sr-only">Cerca un alimento</span>
          <input
            type="search"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Cerca un alimento…"
            className="block w-full rounded-xl border border-bordo bg-superficie py-3 pl-10 pr-11 outline-none focus:border-cho [&::-webkit-search-cancel-button]:hidden"
          />
          {cerca && (
            <button
              type="button"
              onClick={() => setCerca('')}
              aria-label="Cancella la ricerca"
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg opacity-60"
            >
              ✕
            </button>
          )}
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </label>
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[null, ...categorieAlimenti()].map((c) => (
            <button
              key={c ?? 'tutte'}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                categoria === c ? 'border-cho bg-cho text-white' : 'border-bordo bg-superficie'
              }`}
            >
              {c ?? 'tutte'}
            </button>
          ))}
        </div>

        {gruppi.length === 0 && <p className="mt-4 text-sm opacity-70">Nessun alimento trovato.</p>}
        {gruppi.map((g) => (
          <section key={g.titolo} className="mt-4">
            <h3 className="mb-1 text-xs font-semibold uppercase opacity-70">{titoli[g.titolo]}</h3>
            <ul className="divide-y divide-bordo rounded-xl border border-bordo bg-superficie">
              {g.alimenti.map((a) => {
                const q = quantitaDi(a.id)
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => setAperto(a)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-snug">{a.nome}</span>
                        <span className="block text-xs opacity-70">
                          {formatNumero(a.per100.cho)} g CHO · {formatNumero(a.per100.kcal)} kcal per 100 {a.unita === 'ml' ? 'ml' : 'g'}
                        </span>
                        <Avvisi avvisi={avvisiDi(a.id)} compatti />
                      </span>
                      {q !== undefined ? (
                        <span className="shrink-0 rounded-full bg-cho px-2.5 py-1 text-sm font-bold text-white tabular-nums">
                          ✓ {descriviQuantita(a, q).split(' · ')[0]}
                        </span>
                      ) : (
                        <span className="shrink-0 text-2xl leading-none text-cho" aria-hidden="true">
                          +
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="shrink-0 border-t border-bordo bg-superficie px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          disabled={voci.length === 0}
          onClick={usa}
          className="w-full rounded-xl bg-cho p-4 text-lg font-bold text-white disabled:opacity-40"
        >
          {voci.length === 0 ? 'Scegli almeno un alimento' : `Usa per oggi · ${formatNumero(Math.round(totale.cho))} g CHO`}
        </button>
      </footer>

      {aperto && (
        <SceltaQuantita
          key={aperto.id}
          alimento={aperto}
          iniziale={quantitaDi(aperto.id) ?? aperto.quantitaTipica}
          gia={quantitaDi(aperto.id) !== undefined}
          avvisi={avvisiDi(aperto.id)}
          onChiudi={chiudiScelta}
          onCambia={anteprimaDi}
          onTogli={() => {
            setVoci(voci.filter((x) => x.id !== aperto.id))
            chiudiScelta()
          }}
          onConferma={(quantita) => {
            const esiste = voci.some((x) => x.id === aperto.id)
            setVoci(esiste ? voci.map((x) => (x.id === aperto.id ? { ...x, quantita } : x)) : [...voci, { id: aperto.id, quantita }])
            chiudiScelta()
          }}
        />
      )}
    </div>
  )
}
