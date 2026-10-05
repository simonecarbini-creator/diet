// Pannello a tutto schermo per cambiare un pasto solo per oggi.
// Si seleziona un'alternativa (con alimenti e grammi già visibili) e poi si conferma.
// Il pannello è "guidato": dice dove arriva la giornata con ogni alternativa rispetto
// all'obiettivo di CHO del tipo di giornata, mette prima quelle nel target e sposta in
// "Altre versioni" quelle pensate per altri giorni (ridotte, maggiorate, altre colazioni).
import { useEffect, useState } from 'react'
import { dati, idAlternative, trovaPasto, type CategoriaConId, type PastoRisolto } from '../dati'
import { formatDifferenzaCho, formatNumero } from '../formato'
import { targetCho, type VocePasto } from '../giornata'
import { RiassuntoAlimenti } from './Alimenti'
import { DifferenzaKcal } from './DifferenzaKcal'
import { conteggiDelPasto, frazioneLimite, nomeVincolo, oltreMassimo, type ConteggioVincolo } from '../vincoli'

/** "senzaYogurt" → "senza yogurt" */
function etichettaTag(tag: string): string {
  return tag.replace(/([A-Z])/g, ' $1').toLowerCase()
}

export type ContestoGiornata = {
  tipo: string
  ricarica: boolean
  /** CHO del giorno senza questo pasto (vedi choSenza in giornata.ts). */
  choSenzaQuesto: number
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
  const visibili = pasti.filter((p) => filtri.every((f) => p.tags?.includes(f)))

  const sostituito = voce.delPiano !== undefined
  // Riferimento per la differenza di CHO: il pasto del piano, se il piano lo indica.
  const piano = sostituito ? (voce.delPiano ?? null) : voce.pasto
  const riferimento = voce.idPiano !== null ? piano : null
  const differenza = (pasto: PastoRisolto) => (riferimento ? pasto.cho - riferimento.cho : 0)
  const scelta = pasti.find((p) => p.id === selezionato)
  const daConfermare = scelta && scelta.id !== voce.pasto?.id

  // Dove arriva la giornata con ogni alternativa, rispetto all'obiettivo del tipo di giornata.
  const target = giornata ? targetCho(giornata.tipo) : null
  const totaleCon = (p: PastoRisolto) => (giornata ? giornata.choSenzaQuesto + p.cho : null)
  const nelTarget = (p: PastoRisolto) => {
    const totale = totaleCon(p)
    return target && totale !== null ? totale >= target.da && totale <= target.a : true
  }

  const principali = visibili
    .filter((p) => adattaAOggi(p, piano, giornata))
    .sort((a, b) => Number(nelTarget(b)) - Number(nelTarget(a)))
  const altre = visibili.filter((p) => !adattaAOggi(p, piano, giornata))

  function rigaOpzione(opzione: PastoRisolto, secondaria: boolean) {
    const attivo = opzione.id === selezionato
    const ammesso = !opzione.soloTipiGiornata || opzione.soloTipiGiornata.includes(tipoGiorno)
    const diff = differenza(opzione)
    const conteggi = conteggiAltri ? conteggiDelPasto(conteggiAltri, opzione.base ?? opzione.id) : []
    const totale = totaleCon(opzione)
    return (
      <li key={opzione.id}>
        <button
          type="button"
          disabled={!ammesso}
          aria-pressed={attivo}
          onClick={() => setSelezionato(opzione.id)}
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
          {target && totale !== null && ammesso && (
            <p className={`mt-1 text-sm font-semibold ${nelTarget(opzione) ? 'text-ok' : 'text-ko'}`}>
              {nelTarget(opzione)
                ? `✓ giornata a ${formatNumero(totale)} g CHO, nel target`
                : `giornata a ${formatNumero(totale)} g CHO, fuori target`}
            </p>
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
            <span className="opacity-70">{formatNumero(opzione.kcal)} kcal</span>
            {riferimento && <DifferenzaKcal differenza={opzione.kcal - riferimento.kcal} />}
            <span className="text-xs opacity-70">
              {opzione.tags && opzione.tags.length > 0 && ` · ${opzione.tags.map(etichettaTag).join(' · ')}`}
              {!ammesso && ` · solo nei giorni ${opzione.soloTipiGiornata?.join(' e ')}`}
            </span>
          </p>
        </button>
      </li>
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
        {target && giornata && (
          <p className="mt-1 text-xs opacity-70">
            Obiettivo di oggi ({giornata.tipo}): {target.min}–{target.max} g CHO, con margine ±{target.margine}%
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
