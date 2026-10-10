// Pannello a tutto schermo per cambiare un pasto solo per oggi.
// Si seleziona un'alternativa (con alimenti e grammi già visibili) e poi si conferma.
// Il pannello è "guidato": dice dove arriva la giornata con ogni alternativa rispetto
// all'obiettivo di CHO del tipo di giornata, mette prima quelle nel target e sposta in
// "Altre versioni" quelle pensate per altri giorni (ridotte, maggiorate, altre colazioni).
import { useEffect, useState } from 'react'
import { dati, idAlternative, trovaPasto, type CategoriaConId, type PastoRisolto } from '../dati'
import { formatNumero, formatScarto } from '../formato'
import { haValori, targetGiorno, valutaAlternativa, type PastoLibero, type TargetGiorno, type VocePasto } from '../giornata'
import { RiassuntoAlimenti } from './Alimenti'
import { bozzaDa, CampiPastoLibero, daBozza, type BozzaLibero } from './CampiPastoLibero'
import { NumeriPasto } from './NumeriPasto'
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
  /** Merenda non ancora scelta: negli altri pasti è stimata con la media. */
  merendaStimata: boolean
  /** Altri pasti liberi senza valori: non entrano nella somma. */
  liberiSenzaValori: number
}

/** Selezione del pasto libero (non è un id di dati.json). */
const LIBERO = '#libero'

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
  /** Al posto del pasto, quello che si mangia davvero (come nella giornata libera). */
  onLibero: (libero: PastoLibero) => void
  onChiudi: () => void
}

/** "La giornata con questa cena": CHO e kcal del giorno, in parole rispetto al piano. */
function BoxGiornata({
  titolo,
  totale,
  target,
}: {
  titolo: string
  totale: ReturnType<typeof valutaAlternativa>
  target: TargetGiorno
}) {
  const righe = [
    { nome: 'CHO', valore: `${formatNumero(totale.cho)} g`, scarto: formatScarto(totale.cho - target.cho.piano, 'g'), dentro: totale.choDentro, piano: `${formatNumero(target.cho.piano)} g` },
    { nome: 'kcal', valore: formatNumero(totale.kcal), scarto: formatScarto(totale.kcal - target.kcal.piano, 'kcal'), dentro: totale.kcalDentro, piano: formatNumero(target.kcal.piano) },
  ]
  const fuori = [
    !totale.choDentro &&
      (totale.cho < target.cho.da ? `CHO sotto il minimo di ${target.cho.da} g` : `CHO oltre il massimo di ${target.cho.a} g`),
    !totale.kcalDentro &&
      (totale.kcal < target.kcal.da
        ? `kcal sotto il minimo di ${formatNumero(target.kcal.da)}`
        : `kcal oltre il massimo di ${formatNumero(target.kcal.a)}`),
  ].filter(Boolean)
  return (
    <div className={`mt-2 rounded-lg px-2.5 py-2 text-sm ${totale.nelTarget ? 'bg-ok/10' : 'bg-ko/10'}`}>
      <div className="text-xs font-semibold uppercase opacity-70">{titolo}</div>
      <ul className="mt-1 space-y-0.5">
        {righe.map((r) => (
          <li key={r.nome} className="flex items-baseline gap-2">
            <span className={`w-4 shrink-0 font-bold ${r.dentro ? 'text-ok' : 'text-ko'}`}>{r.dentro ? '✓' : '✗'}</span>
            <span>
              <span className="font-bold tabular-nums">{r.valore}</span> {r.nome === 'kcal' ? 'kcal' : 'CHO'}:{' '}
              <span className={r.dentro ? '' : 'font-semibold text-ko'}>
                {r.scarto === 'uguale' ? 'come il piano' : `${r.scarto} del piano`}
              </span>{' '}
              <span className="opacity-70">({r.piano})</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={`mt-1 font-semibold ${totale.nelTarget ? 'text-ok' : 'text-ko'}`}>
        {totale.nelTarget ? `Nel target: entro ±${target.margine}% del piano` : `Fuori target: ${fuori.join(', ')}`}
      </div>
    </div>
  )
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
  onLibero,
  onChiudi,
}: Props) {
  const [bozzaLibero, setBozzaLibero] = useState<BozzaLibero>(bozzaDa())
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
  // Filtri dai pasti del piano: gli sgarri hanno una sezione loro.
  const tuttiTag = [...new Set(pasti.filter((p) => !p.daSgarro).flatMap((p) => p.tags ?? []))]
  const visibili = pasti.filter((p) => !nascoste.includes(p.id) && filtri.every((f) => p.tags?.includes(f)))

  const sostituito = voce.delPiano !== undefined
  // Riferimento per la differenza di CHO: il pasto del piano, se il piano lo indica.
  const piano = sostituito ? (voce.delPiano ?? null) : voce.pasto
  const riferimento = voce.idPiano !== null ? piano : null
  const differenza = (pasto: PastoRisolto) => (riferimento ? pasto.cho - riferimento.cho : 0)
  const scelta = pasti.find((p) => p.id === selezionato)
  const daConfermare = scelta && scelta.id !== voce.pasto?.id
  const liberoSelezionato = selezionato === LIBERO
  const libero = daBozza(bozzaLibero)

  // Dove arriva la giornata con ogni alternativa: nel target se CHO e kcal restano entro
  // il margine di dati.json rispetto al piano di oggi.
  const target = giornata ? targetGiorno(giornata.piano) : null
  const valuta = (p: PastoRisolto) => (giornata && target ? valutaAlternativa(giornata.senzaQuesto, p, target) : null)
  const nelTarget = (p: PastoRisolto) => valuta(p)?.nelTarget ?? true
  // Con il pasto del piano: spiega perché la giornata può essere già sopra o sotto il piano.
  const conPiano = riferimento ? valuta(riferimento) : null

  // Ordine: il pasto del piano sempre primo, poi quelli nel target, poi quelli fuori target.
  // Gli sgarri hanno una sezione a parte, in fondo.
  const ordine = (p: PastoRisolto) => (p.id === voce.idPiano ? 0 : nelTarget(p) ? 1 : 2)
  const pianificabili = visibili.filter((p) => !p.daSgarro)
  const principali = pianificabili
    .filter((p) => adattaAOggi(p, piano, giornata))
    .sort((a, b) => ordine(a) - ordine(b))
  const altre = pianificabili.filter((p) => !adattaAOggi(p, piano, giornata))
  const sgarri = visibili.filter((p) => p.daSgarro).sort((a, b) => ordine(a) - ordine(b))

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
          // Attenuate solo nel contenuto: il fondo resta pieno, altrimenti sotto traspare il rosso di "Nascondi".
          className={`w-full rounded-xl border-2 p-3 text-left disabled:[&>*]:opacity-40 ${
            // Selezionata: bordo rosa spesso e fondo rosato pieno (sotto c'è il rosso di "Nascondi").
            attivo ? 'border-cho bg-[color-mix(in_srgb,var(--cho)_9%,var(--superficie))]' : 'border-bordo bg-superficie'
          } ${secondaria && !attivo ? '[&>*]:opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {attivo && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cho text-xs font-bold text-white" aria-hidden="true">
                    ✓
                  </span>
                )}
                <span className="rounded bg-bordo px-1.5 py-0.5 text-xs font-semibold">{opzione.id}</span>
                {!opzione.composizione && <span className="font-semibold">{opzione.nome}</span>}
                {opzione.id === voce.idPiano && (
                  <span className="rounded-full border border-current px-2 py-0.5 text-xs font-semibold uppercase">nel piano</span>
                )}
                {sostituito && opzione.id === voce.pasto?.id && (
                  <span className="text-xs font-semibold uppercase text-cho">scelto per oggi</span>
                )}
              </div>
              {opzione.composizione && <p className="mt-1 font-medium leading-snug">{opzione.composizione}</p>}
            </div>
            <div className="shrink-0 text-right">
              <NumeriPasto cho={opzione.cho} proteine={opzione.proteine} />
              {riferimento && opzione.id !== riferimento.id && (
                <div className="mt-0.5 text-xs text-testo opacity-70">
                  {diff === 0 ? `come ${riferimento.id}` : `${formatScarto(diff, 'g')} di ${riferimento.id}`}
                </div>
              )}
            </div>
          </div>

          {opzione.alimenti.length > 0 && (
            <div className="mt-2">
              <RiassuntoAlimenti alimenti={opzione.alimenti} />
            </div>
          )}
          {opzione.notaVersione && <p className="mt-1 text-sm">{opzione.notaVersione}</p>}
          {target && totale && ammesso && (
            <BoxGiornata titolo={`La giornata con ${questo[categoria]}`} totale={totale} target={target} />
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
              {riferimento &&
                opzione.id !== riferimento.id &&
                (opzione.kcal === riferimento.kcal
                  ? `, come ${riferimento.id}`
                  : `, ${formatScarto(opzione.kcal - riferimento.kcal, 'kcal')} di ${riferimento.id}`)}
            </span>
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
        {target && giornata && (
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="opacity-70">
              Piano di oggi: {formatNumero(target.cho.piano)} g CHO · {formatNumero(target.kcal.piano)} kcal. Nel target
              (±{target.margine}%): {target.cho.da}–{target.cho.a} g CHO e {formatNumero(target.kcal.da)}–
              {formatNumero(target.kcal.a)} kcal.
            </p>
            <p className="opacity-70">
              Gli altri pasti di oggi fanno {formatNumero(giornata.senzaQuesto.cho)} g CHO e{' '}
              {formatNumero(giornata.senzaQuesto.kcal)} kcal
              {giornata.merendaStimata && ' (merenda non scelta: contata come media delle merende)'}
              {giornata.liberiSenzaValori > 0 && ` (${giornata.liberiSenzaValori} pasto libero senza valori non contato)`}.
            </p>
            {conPiano && riferimento && (
              <p className={conPiano.nelTarget ? 'opacity-70' : 'font-semibold text-ko'}>
                Con {riferimento.id} del piano la giornata arriva a {formatNumero(conPiano.cho)} g CHO
                {conPiano.nelTarget
                  ? '.'
                  : `: già fuori target per quello che è cambiato negli altri pasti (${formatScarto(conPiano.cho - target.cho.piano, 'g')} del piano).`}
              </p>
            )}
          </div>
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

        <p className="mb-2 text-sm">
          <span className="font-bold text-cho">
            <span className="freccia-swipe">←</span> Scorri a sinistra
          </span>{' '}
          per nascondere quelle che non puoi preparare
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

        {/* Pasto libero: come nella giornata libera, testo e (se si conoscono) kcal, CHO e proteine. */}
        <div
          className={`mt-2 rounded-xl border-2 border-dashed p-3 ${
            liberoSelezionato ? 'border-cho bg-[color-mix(in_srgb,var(--cho)_9%,var(--superficie))]' : 'border-contorno bg-superficie'
          }`}
        >
          <button
            type="button"
            aria-pressed={liberoSelezionato}
            onClick={() => {
              setSelezionato(LIBERO)
              setInteragito(true)
            }}
            className="flex w-full items-center gap-2 text-left"
          >
            {liberoSelezionato && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cho text-xs font-bold text-white" aria-hidden="true">
                ✓
              </span>
            )}
            <span className="font-semibold">Pasto libero</span>
            <span className="text-sm opacity-70">scrivi cosa mangi</span>
          </button>
          {liberoSelezionato && (
            <>
              <CampiPastoLibero bozza={bozzaLibero} onCambia={setBozzaLibero} autoFocus />
              {target && giornata && haValori(libero) ? (
                <BoxGiornata
                  titolo={`La giornata con ${questo[categoria]}`}
                  totale={valutaAlternativa(giornata.senzaQuesto, { cho: libero.cho ?? 0, kcal: libero.kcal ?? 0 }, target)}
                  target={target}
                />
              ) : (
                <p className="mt-2 text-sm opacity-70">
                  Senza kcal, CHO e proteine il pasto resta ND: non entra nei totali della giornata.
                </p>
              )}
            </>
          )}
        </div>

        {altre.length > 0 && (
          <details className="mt-4">
            <summary className="py-2 text-sm font-semibold opacity-70">
              Altre versioni ({altre.length}): pensate per altri tipi di giornata
            </summary>
            <ul className="mt-2 space-y-2">{altre.map((p) => rigaOpzione(p, true))}</ul>
          </details>
        )}

        {sgarri.length > 0 && (
          <details className="mt-2" open={sgarri.some((p) => p.id === voce.pasto?.id) || undefined}>
            <summary className="py-2 text-sm font-semibold opacity-70">
              Sgarri ({sgarri.length}): al posto {categoria === 'pranzo' ? 'del pranzo' : `della ${nomeCategoria}`}, fuori dal piano
            </summary>
            <ul className="mt-2 space-y-2">{sgarri.map((p) => rigaOpzione(p, false))}</ul>
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
        {liberoSelezionato ? (
          <button
            type="button"
            disabled={libero.testo === ''}
            onClick={() => onLibero(libero)}
            className="w-full rounded-xl bg-cho p-4 text-lg font-bold text-white disabled:opacity-40"
          >
            {libero.testo === '' ? 'Scrivi cosa mangi' : 'Usa il pasto libero per oggi'}
          </button>
        ) : daConfermare ? (
          <button
            type="button"
            onClick={() => onScegli(scelta.id)}
            className="w-full rounded-xl bg-cho p-4 text-lg font-bold text-white"
          >
            {scelta.id === voce.idPiano ? `Torna al piano (${scelta.id})` : `Usa ${scelta.id} per oggi`}
          </button>
        ) : (
          <p className="py-2 text-center text-sm opacity-70">Tocca un'alternativa per selezionarla</p>
        )}
        {sostituito && !daConfermare && !liberoSelezionato && (
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
