// Pannello a tutto schermo per cambiare un pasto solo per oggi.
// Si seleziona un'alternativa (con alimenti e grammi già visibili) e poi si conferma.
// Il pannello è "guidato": dice dove arriva la giornata con ogni alternativa rispetto
// all'obiettivo di CHO del tipo di giornata, mette prima quelle nel target e sposta in
// "Altre versioni" quelle pensate per altri giorni (ridotte, maggiorate, altre colazioni).
import { useEffect, useState } from 'react'
import { dati, idAlternative, trovaPasto, type CategoriaConId, type PastoRisolto } from '../dati'
import { formatDifferenzaCho, formatNumero } from '../formato'
import { targetGiorno, valutaAlternativa, type VocePasto } from '../giornata'
import { RiassuntoAlimenti } from './Alimenti'
import { DifferenzaKcal } from './DifferenzaKcal'
import { RigaScorrevole } from './RigaScorrevole'
import { conteggiDelPasto, frazioneLimite, nomeVincolo, oltreMassimo, type ConteggioVincolo } from '../vincoli'

/** "questo pranzo", "questa cena"…: per le frasi sul totale della giornata. */
const questo: Record<CategoriaConId, string> = {
  colazione: 'questa colazione',
  spuntino: 'questo spuntino',
  pranzo: 'questo pranzo',
  merenda: 'questa merenda',
  cena: 'questa cena',
}

/** "senzaYogurt" → "senza yogurt" */
function etichettaTag(tag: string): string {
  return tag.replace(/([A-Z])/g, ' $1').toLowerCase()
}

export type ContestoGiornata = {
  tipo: string
  ricarica: boolean
  /** CHO e kcal del giorno senza questo pasto (vedi totaliSenza in giornata.ts). */
  senzaQuesto: { cho: number; kcal: number }
  /** Il piano del giorno: il riferimento per la tolleranza. */
  piano: { cho: number; kcal: number }
}

type Props = {
  categoria: CategoriaConId
  /** Nome della categoria per i titoli, es. "pranzo". */
  nomeCategoria: string
  voce: VocePasto
  tipoGiorno: string
  /** Pranzi e cene: i vincoli settimanali contati negli altri giorni della settimana. */
  conteggiAltri?: Record<string, ConteggioVincolo>
  /** Per dire dove arriva la giornata con ogni alternativa. */
  giornata?: ContestoGiornata
  onScegli: (id: string | null) => void
  onChiudi: () => void
}

/**
 * È un'alternativa "per oggi"? Colazioni: dello stesso tipo (STD, MAGG, RID) di quella del piano.
 * Altri pasti: le versioni normali sempre; ridotte e maggiorate solo se è quella del piano,
 * o le ridotte nei GRIGIO (non di ricarica) e le maggiorate nei ROSSO.
 */
function adattaAOggi(opzione: PastoRisolto, piano: PastoRisolto | null, giornata?: ContestoGiornata): boolean {
  if (opzione.utente) return true
  if (opzione.tipoColazione) return !piano?.tipoColazione || opzione.tipoColazione === piano.tipoColazione
  if (!opzione.versione) return true
  if (opzione.versione === piano?.versione) return true
  if (opzione.versione === 'ridotto') return giornata?.tipo === 'GRIGIO' && !giornata.ricarica
  return giornata?.tipo === 'ROSSO'
}

export function PannelloScelta({
  categoria,
  nomeCategoria,
  voce,
  tipoGiorno,
  conteggiAltri,
  giornata,
  onScegli,
  onChiudi,
}: Props) {
  const [selezionato, setSelezionato] = useState<string | null>(voce.pasto?.id ?? null)
  const [filtri, setFiltri] = useState<string[]>([])
  // Alternative nascoste con lo swipe: solo finché il pannello è aperto.
  const [nascoste, setNascoste] = useState<string[]>([])
  const [ripristinate, setRipristinate] = useState<string[]>([])
  // Accenno allo swipe: all'apertura e, se dopo 6 secondi non si è fatto nulla, ancora una volta.
  const [accenno, setAccenno] = useState(1)
  const [interagito, setInteragito] = useState(false)
  useEffect(() => {
    if (interagito) return
    const timer = setTimeout(() => setAccenno(2), 6000)
    return () => clearTimeout(timer)
  }, [interagito])
  function nascondi(id: string) {
    setInteragito(true)
    setNascoste((n) => [...n, id])
    setRipristinate((r) => r.filter((x) => x !== id))
    if (selezionato === id) setSelezionato(voce.pasto?.id ?? null)
  }
  function ripristina(id: string) {
    setNascoste((n) => n.filter((x) => x !== id))
    setRipristinate((r) => [...r, id])
  }

  // Sotto il pannello la pagina non deve scorrere.
  useEffect(() => {
    const precedente = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = precedente
    }
  }, [])

  const pasti = idAlternative(categoria)
    .map((id) => trovaPasto(categoria, id))
    .filter((p): p is PastoRisolto => p !== null)
  const tuttiTag = [...new Set(pasti.flatMap((p) => p.tags ?? []))]
  const visibili = pasti.filter((p) => !nascoste.includes(p.id) && filtri.every((f) => p.tags?.includes(f)))

  const sostituito = voce.delPiano !== undefined
  // Riferimento per la differenza di CHO: il pasto del piano, se il piano lo indica.
  const piano = sostituito ? (voce.delPiano ?? null) : voce.pasto
  const riferimento = voce.idPiano !== null ? piano : null
  const differenza = (pasto: PastoRisolto) => (riferimento ? pasto.cho - riferimento.cho : 0)
  const scelta = pasti.find((p) => p.id === selezionato)
  const daConfermare = scelta && scelta.id !== voce.pasto?.id

  // Dove arriva la giornata con ogni alternativa: nel target se CHO e kcal restano entro
  // il margine di dati.json rispetto al piano di oggi.
  const target = giornata ? targetGiorno(giornata.piano) : null
  const valuta = (p: PastoRisolto) => (giornata && target ? valutaAlternativa(giornata.senzaQuesto, p, target) : null)
  const nelTarget = (p: PastoRisolto) => valuta(p)?.nelTarget ?? true

  const principali = visibili
    .filter((p) => adattaAOggi(p, piano, giornata))
    .sort((a, b) => Number(nelTarget(b)) - Number(nelTarget(a)))
  const altre = visibili.filter((p) => !adattaAOggi(p, piano, giornata))

  function rigaOpzione(opzione: PastoRisolto, secondaria: boolean) {
    const attivo = opzione.id === selezionato
    const ammesso = !opzione.soloTipiGiornata || opzione.soloTipiGiornata.includes(tipoGiorno)
    const diff = differenza(opzione)
    const conteggi = conteggiAltri ? conteggiDelPasto(conteggiAltri, opzione.base ?? opzione.id) : []
    const totale = valuta(opzione)
    return (
      <RigaScorrevole
        key={opzione.id}
        onNascondi={() => nascondi(opzione.id)}
        accenno={opzione.id === principali[0]?.id && !interagito ? accenno : 0}
        ripristinata={ripristinate.includes(opzione.id)}
      >
        <button
          type="button"
          disabled={!ammesso}
          aria-pressed={attivo}
          onClick={() => {
            setSelezionato(opzione.id)
            setInteragito(true)
          }}
          className={`w-full rounded-xl border bg-superficie p-3 text-left disabled:opacity-40 ${
            attivo ? 'border-cho outline-2 outline-cho' : 'border-bordo'
          } ${secondaria && !attivo ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="rounded bg-bordo px-1.5 py-0.5 text-xs font-semibold">{opzione.id}</span>
                {!opzione.composizione && <span className="font-semibold">{opzione.nome}</span>}
                {opzione.id === voce.idPiano && (
                  <span className="text-xs font-semibold uppercase opacity-70">nel piano</span>
                )}
                {sostituito && opzione.id === voce.pasto?.id && (
                  <span className="text-xs font-semibold uppercase text-cho">scelto per oggi</span>
                )}
              </div>
              {opzione.composizione && <p className="mt-1 font-medium leading-snug">{opzione.composizione}</p>}
            </div>
            <div className="shrink-0 text-right text-cho">
              <div className="text-2xl font-bold leading-none tabular-nums">{formatNumero(opzione.cho)}</div>
              <div className="text-xs font-semibold">
                {riferimento && diff !== 0 ? formatDifferenzaCho(diff) : 'g CHO'}
              </div>
            </div>
          </div>

          {opzione.alimenti.length > 0 && (
            <div className="mt-2">
              <RiassuntoAlimenti alimenti={opzione.alimenti} />
            </div>
          )}
          {opzione.notaVersione && <p className="mt-1 text-sm">{opzione.notaVersione}</p>}
          {target && totale && ammesso && (
            <div className={`mt-2 rounded-lg px-2.5 py-2 text-sm ${totale.nelTarget ? 'bg-ok/10' : 'bg-ko/10'}`}>
              <div className="text-xs font-semibold uppercase opacity-70">Giornata con {questo[categoria]}</div>
              <div>
                CHO <span className={`font-bold ${totale.choDentro ? '' : 'text-ko'}`}>{formatNumero(totale.cho)}</span> /{' '}
                {formatNumero(target.cho.piano)} g del piano · kcal{' '}
                <span className={`font-bold ${totale.kcalDentro ? '' : 'text-ko'}`}>{formatNumero(totale.kcal)}</span> /{' '}
                {formatNumero(target.kcal.piano)}
              </div>
              <div className={`font-semibold ${totale.nelTarget ? 'text-ok' : 'text-ko'}`}>
                {totale.nelTarget
                  ? `✓ nel target (piano ±${target.margine}%)`
                  : `✗ fuori target: ${[
                      !totale.choDentro &&
                        (totale.cho < target.cho.da ? `CHO sotto ${target.cho.da} g` : `CHO sopra ${target.cho.a} g`),
                      !totale.kcalDentro &&
                        (totale.kcal < target.kcal.da
                          ? `kcal sotto ${formatNumero(target.kcal.da)}`
                          : `kcal sopra ${formatNumero(target.kcal.a)}`),
                    ]
                      .filter(Boolean)
                      .join(', ')}`}
              </div>
            </div>
          )}
          {conteggi.map((conteggio) => {
            const conQuesta = conteggio.volte + 1
            const frazione = frazioneLimite(conteggio, conQuesta)
            if (!frazione) return null
            return (
              <p
                key={conteggio.vincolo.id}
                className={`mt-1 text-sm font-semibold ${oltreMassimo(conteggio, conQuesta) ? 'text-ko' : ''}`}
              >
                Con questa, {nomeVincolo(conteggio.vincolo)} questa settimana: {frazione}
                {oltreMassimo(conteggio, conQuesta) && ' · supereresti il massimo'}
              </p>
            )
          })}
          <p className="mt-1 text-sm">
            <span className="opacity-70">
              {questo[categoria].charAt(0).toUpperCase() + questo[categoria].slice(1)}: {formatNumero(opzione.kcal)} kcal
            </span>
            {riferimento && <DifferenzaKcal differenza={opzione.kcal - riferimento.kcal} />}
            <span className="text-xs opacity-70">
              {opzione.tags && opzione.tags.length > 0 && ` · ${opzione.tags.map(etichettaTag).join(' · ')}`}
              {!ammesso && ` · solo nei giorni ${opzione.soloTipiGiornata?.join(' e ')}`}
            </span>
          </p>
        </button>
      </RigaScorrevole>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${voce.idPiano === null ? 'Scegli' : 'Cambia'} ${nomeCategoria}`}
      className="fixed inset-0 z-50 flex flex-col bg-sfondo"
    >
      <header className="shrink-0 border-b border-bordo bg-superficie px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {voce.idPiano === null ? 'Scegli' : 'Cambia'} {nomeCategoria}
            </h2>
            <p className="text-sm opacity-70">Vale solo per oggi: il piano non cambia.</p>
          </div>
          <button
            type="button"
            onClick={onChiudi}
            aria-label="Chiudi"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
          >
            ✕
          </button>
        </div>
        {riferimento && (
          <p className="mt-2 text-sm">
            Nel piano: <span className="font-semibold">{riferimento.id}</span>{' '}
            {riferimento.composizione ?? riferimento.nome} ·{' '}
            <span className="font-bold text-cho">{formatNumero(riferimento.cho)} g CHO</span>
          </p>
        )}
        {target && (
          <p className="mt-1 text-xs opacity-70">
            Piano di oggi: {formatNumero(target.cho.piano)} g CHO · {formatNumero(target.kcal.piano)} kcal. Nel target
            (±{target.margine}%): {target.cho.da}–{target.cho.a} g CHO e {formatNumero(target.kcal.da)}–
            {formatNumero(target.kcal.a)} kcal
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tuttiTag.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tuttiTag.map((tag) => {
              const attivo = filtri.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={attivo}
                  onClick={() => setFiltri(attivo ? filtri.filter((f) => f !== tag) : [...filtri, tag])}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    attivo ? 'border-cho bg-cho text-white' : 'border-bordo bg-superficie'
                  }`}
                >
                  {etichettaTag(tag)}
                </button>
              )
            })}
          </div>
        )}

        <p className="mb-2 text-xs opacity-70">
          <span className="freccia-swipe font-bold">←</span> Scorri a sinistra per nascondere quelle che non puoi
          preparare
          {nascoste.length > 0 ? '; tocca una nascosta per rimetterla.' : '.'}
        </p>
        {nascoste.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="opacity-70">Nascoste:</span>
            {nascoste.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => ripristina(id)}
                aria-label={`Ripristina ${id}`}
                className="rounded-full border border-bordo bg-superficie px-3 py-1 font-semibold"
              >
                {id} ↺
              </button>
            ))}
          </div>
        )}

        <ul className="space-y-2">{principali.map((p) => rigaOpzione(p, false))}</ul>

        {altre.length > 0 && (
          <details className="mt-4">
            <summary className="py-2 text-sm font-semibold opacity-70">
              Altre versioni ({altre.length}): pensate per altri tipi di giornata
            </summary>
            <ul className="mt-2 space-y-2">{altre.map((p) => rigaOpzione(p, true))}</ul>
          </details>
        )}

        {categoria === 'merenda' && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm opacity-70">
            {dati.merendaNote.map((nota) => (
              <li key={nota}>{nota}</li>
            ))}
          </ul>
        )}
      </div>

      <footer className="shrink-0 space-y-2 border-t border-bordo bg-superficie px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {daConfermare ? (
          <button
            type="button"
            onClick={() => onScegli(scelta.id)}
            className="w-full rounded-xl bg-cho p-4 text-lg font-bold text-white"
          >
            {scelta.id === voce.idPiano ? `Torna al piano (${scelta.id})` : `Usa ${scelta.id} per oggi`}
            {riferimento && differenza(scelta) !== 0 && ` · ${formatDifferenzaCho(differenza(scelta))}`}
          </button>
        ) : (
          <p className="py-2 text-center text-sm opacity-70">Tocca un'alternativa per selezionarla</p>
        )}
        {sostituito && !daConfermare && (
          <button
            type="button"
            onClick={() => onScegli(null)}
            className="w-full rounded-xl border border-bordo p-3 font-medium"
          >
            {voce.idPiano === null ? 'Annulla la scelta' : `Torna al piano (${voce.idPiano})`}
          </button>
        )}
      </footer>
    </div>
  )
}
