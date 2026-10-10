// Schermata Nuova settimana (SPEC.md §3.3): si inseriscono gli allenamenti, il motore
// delle regole propone la giornata alimentare, la proposta si corregge a mano e si salva.
import { useState } from 'react'
import { dati, idAlternative, isTipoGiornata, type Giorno, type Settimana } from '../dati'
import { formatDataBreve, formatGiornoMese, formatNumero } from '../formato'
import { aggiungiGiorni, confrontoProteine, giornoDellaSettimana, totaleDelPiano } from '../giornata'
import { NumeroProteine } from '../componenti/NumeriPasto'
import { effettiLungoDomenicale, proponiSettimana, type GiornoInserito, type GiornoProposto, type Proposta } from '../motore'
import { link } from '../navigazione'
import { salvaSettimana, settimane, settimaneSovrapposte } from '../piano'
import { verificaDati } from '../verifica'
import { pastiUtente } from '../pastiUtente'
import { controllaVincoli } from '../vincoli'

type Riga = {
  allenamento: string
  km: string
  durata: string
  sopra: string
  /** undefined: deciso in automatico (domenica con abbastanza km). */
  lungo?: boolean
}

const rigaVuota: Riga = { allenamento: '', km: '', durata: '', sopra: '' }
const numero = (testo: string) => Number(testo.replace(',', '.')) || 0

function lungoAutomatico(data: string, km: number): boolean {
  const regola = dati.regole.lungoDomenicaleAutomatico
  return giornoDellaSettimana(data) === regola.giornoSettimana && km >= regola.distanzaKmMin
}

const campo =
  'w-full rounded-lg border border-bordo bg-superficie px-2.5 py-2 outline-none focus:border-cho'

function Etichetta({ testo, children }: { testo: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-semibold uppercase opacity-70">{testo}</span>
      {children}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Passo 1: gli allenamenti

function Inserimento({
  dal,
  righe,
  onDal,
  onRiga,
  onCalcola,
  onImporta,
}: {
  dal: string
  righe: Riga[]
  onDal: (dal: string) => void
  onRiga: (i: number, riga: Riga) => void
  onCalcola: () => void
  onImporta: (giorni: GiornoProposto[]) => void
}) {
  const [json, setJson] = useState('')
  const effetti = effettiLungoDomenicale(dati)
  const [erroreJson, setErroreJson] = useState<string | null>(null)

  function importa() {
    try {
      const letto: unknown = JSON.parse(json)
      const giorni = Array.isArray(letto) ? letto : (letto as { giorni?: unknown }).giorni
      if (!Array.isArray(giorni) || giorni.length === 0) throw new Error('serve un elenco "giorni"')
      onImporta(giorni as GiornoProposto[])
      setErroreJson(null)
    } catch (e) {
      setErroreJson(`JSON non valido: ${(e as Error).message}`)
    }
  }

  return (
    <>
      <Etichetta testo="Dal (lunedì)">
        <input type="date" value={dal} onChange={(e) => e.target.value && onDal(e.target.value)} className={`${campo} mt-1 h-11 py-0 leading-[2.75rem]`} />
      </Etichetta>

      <ul className="mt-4 space-y-3">
        {righe.map((riga, i) => {
          const data = aggiungiGiorni(dal, i)
          const lungo = riga.lungo ?? lungoAutomatico(data, numero(riga.km))
          return (
            <li key={data} className="rounded-xl border border-bordo bg-superficie p-3">
              <div className="font-bold first-letter:uppercase">
                {formatDataBreve(data)} {formatGiornoMese(data).split(' ')[1]}
              </div>
              <textarea
                rows={2}
                placeholder="es. Ripetute: risc. 4 km + 10x1000 rec 2' + 1 km defaticamento (vuoto = riposo)"
                value={riga.allenamento}
                onChange={(e) => onRiga(i, { ...riga, allenamento: e.target.value })}
                className={`${campo} mt-2 resize-none`}
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Etichetta testo="Km">
                  <input inputMode="decimal" value={riga.km} onChange={(e) => onRiga(i, { ...riga, km: e.target.value })} className={`${campo} mt-1`} />
                </Etichetta>
                <Etichetta testo="Durata min">
                  <input inputMode="numeric" value={riga.durata} onChange={(e) => onRiga(i, { ...riga, durata: e.target.value })} className={`${campo} mt-1`} />
                </Etichetta>
                <Etichetta testo="Min sopra ritmo">
                  <input inputMode="numeric" value={riga.sopra} onChange={(e) => onRiga(i, { ...riga, sopra: e.target.value })} className={`${campo} mt-1`} />
                </Etichetta>
              </div>
              {/* Solo la domenica (o se già segnato): è il lungo della settimana, con le sue regole. */}
              {(giornoDellaSettimana(data) === dati.regole.lungoDomenicaleAutomatico.giornoSettimana || lungo) && (
                <div className="mt-2 rounded-lg bg-sfondo p-2">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={lungo}
                      onChange={(e) => onRiga(i, { ...riga, lungo: e.target.checked })}
                      className="h-5 w-5 accent-[var(--cho)]"
                    />
                    Lungo domenicale
                  </label>
                  <p className="mt-1 text-xs opacity-70">
                    Colazione {effetti.colazione}, gel a {effetti.gelPerOra} g CHO/ora (protocollo gara) e cena
                    C2 di preferenza. Si spunta da solo da {dati.regole.lungoDomenicaleAutomatico.distanzaKmMin} km.
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <button type="button" onClick={onCalcola} className="mt-4 w-full rounded-xl bg-cho p-4 text-lg font-bold text-white">
        Calcola la proposta
      </button>
      <p className="mt-2 text-center text-xs opacity-70">
        Durata e minuti sopra ritmo sono facoltativi: senza durata il gel non si calcola.
      </p>

      <details className="mt-6 rounded-xl border border-bordo bg-superficie p-3">
        <summary className="font-semibold">Hai già la settimana in JSON?</summary>
        <textarea
          rows={6}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{ "giorni": [ { "data": "2026-10-05", "allenamento": "...", ... } ] }'
          className={`${campo} mt-2 font-mono text-xs`}
        />
        {erroreJson && <p className="mt-1 text-sm text-ko">{erroreJson}</p>}
        <button type="button" onClick={importa} className="mt-2 w-full rounded-lg border border-bordo p-2.5 font-medium">
          Importa e rivedi
        </button>
      </details>
    </>
  )
}

// ---------------------------------------------------------------------------
// Passo 2: la proposta, modificabile

function Selettore({
  testo,
  valore,
  opzioni,
  onCambia,
}: {
  testo: string
  valore: string
  opzioni: { valore: string; etichetta: string }[]
  onCambia: (valore: string) => void
}) {
  return (
    <Etichetta testo={testo}>
      <select value={valore} onChange={(e) => onCambia(e.target.value)} className={`${campo} mt-1 font-semibold`}>
        {opzioni.map((o) => (
          <option key={o.valore} value={o.valore}>
            {o.etichetta}
          </option>
        ))}
      </select>
    </Etichetta>
  )
}

const opzioniDi = (ids: string[]) => ids.map((id) => ({ valore: id, etichetta: id }))
const SENZA_MERENDA = '—'

function GiornoDellaProposta({
  giorno,
  motivi,
  onCambia,
}: {
  giorno: GiornoProposto
  motivi: Proposta['motivi'][number]
  onCambia: (giorno: GiornoProposto) => void
}) {
  const [perche, setPerche] = useState(false)
  const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
  const totale = totaleDelPiano(giorno)
  const voci = Object.entries(motivi).filter(([, testo]) => testo)

  return (
    <li className="rounded-xl border border-bordo bg-superficie p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold first-letter:uppercase">{formatDataBreve(giorno.data)}</span>
            {giorno.ricarica && <span className="text-xs font-semibold uppercase text-cho">ricarica</span>}
            {giorno.lungoDomenicale && <span className="text-xs font-semibold uppercase opacity-70">lungo</span>}
          </div>
          <p className="line-clamp-2 text-sm opacity-80">{giorno.allenamento || 'Riposo'}</p>
        </div>
        <div className="shrink-0 text-right text-cho">
          <div className="text-2xl font-bold leading-none tabular-nums">{formatNumero(totale.cho)}</div>
          <div className="text-xs font-semibold">g CHO</div>
          <NumeroProteine proteine={totale.proteine} confronto={confrontoProteine(totale.proteine, giorno.tipo)} />
          <div className="text-xs text-testo opacity-70">{formatNumero(totale.kcal)} kcal</div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Etichetta testo="Tipo">
          <select
            value={giorno.tipo}
            onChange={(e) => onCambia({ ...giorno, tipo: e.target.value })}
            className={`${campo} mt-1 font-bold text-white`}
            style={{ backgroundColor: tipo?.colore }}
          >
            {Object.keys(dati.tipiGiornata).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Etichetta>
        <Selettore testo="Colazione" valore={giorno.colazione} opzioni={opzioniDi(idAlternative('colazione'))} onCambia={(v) => onCambia({ ...giorno, colazione: v })} />
        <Selettore
          testo="Spuntino"
          valore={giorno.spuntino}
          opzioni={idAlternative('spuntino').map((id) => ({ valore: id, etichetta: id === 'soloFrutto' ? 'frutto' : id }))}
          onCambia={(v) => onCambia({ ...giorno, spuntino: v })}
        />
        <Selettore testo="Pranzo" valore={giorno.pranzo} opzioni={opzioniDi(idAlternative('pranzo'))} onCambia={(v) => onCambia({ ...giorno, pranzo: v })} />
        <Selettore testo="Cena" valore={giorno.cena} opzioni={opzioniDi(idAlternative('cena'))} onCambia={(v) => onCambia({ ...giorno, cena: v })} />
        <Selettore
          testo="Merenda"
          valore={giorno.merenda ?? SENZA_MERENDA}
          opzioni={[{ valore: SENZA_MERENDA, etichetta: 'da scegliere' }, ...opzioniDi(idAlternative('merenda'))]}
          onCambia={(v) => onCambia({ ...giorno, merenda: v === SENZA_MERENDA ? null : v })}
        />
        <Etichetta testo="Gel g CHO">
          <input
            inputMode="numeric"
            value={giorno.gelCho}
            onChange={(e) => onCambia({ ...giorno, gelCho: numero(e.target.value) })}
            className={`${campo} mt-1 font-semibold`}
          />
        </Etichetta>
        <label className="col-span-2 flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={giorno.spuntinoSerale}
            onChange={(e) => onCambia({ ...giorno, spuntinoSerale: e.target.checked })}
            className="h-5 w-5 accent-[var(--cho)]"
          />
          Spuntino serale
        </label>
      </div>
      {giorno.merenda === null && (
        <p className="mt-1 text-xs opacity-70">Il totale include una merenda media: si sceglie nel giorno.</p>
      )}

      {voci.length > 0 && (
        <button type="button" onClick={() => setPerche(!perche)} className="mt-2 text-sm font-semibold text-cho">
          {perche ? 'Nascondi il perché' : 'Perché queste scelte?'}
        </button>
      )}
      {perche && (
        <dl className="mt-1 space-y-1 text-sm">
          {voci.map(([scelta, testo]) => (
            <div key={scelta}>
              <dt className="inline font-semibold">{scelta}: </dt>
              <dd className="inline opacity-80">{testo}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------

export function NuovaSettimana() {
  const elenco = settimane()
  const ultima = elenco[elenco.length - 1]
  const [dal, setDal] = useState(() => (ultima ? aggiungiGiorni(ultima.al, 1) : dati.aggiornato))
  const [righe, setRighe] = useState<Riga[]>(() => Array.from({ length: 7 }, () => rigaVuota))
  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [salvataggio, setSalvataggio] = useState<string | null>(null)

  function calcola() {
    const inseriti: GiornoInserito[] = righe.map((riga, i) => {
      const data = aggiungiGiorni(dal, i)
      const km = numero(riga.km)
      return {
        data,
        allenamento: riga.allenamento.trim(),
        distanzaKm: km,
        durataMinuti: riga.durata.trim() ? numero(riga.durata) : null,
        minutiSopraRitmoMedio: numero(riga.sopra),
        lungoDomenicale: riga.lungo ?? lungoAutomatico(data, km),
      }
    })
    setProposta(proponiSettimana(dati, inseriti))
    window.scrollTo(0, 0)
  }

  if (!proposta) {
    return (
      <>
        <h1 className="text-xl font-bold">Nuova settimana</h1>
        <p className="mt-1 text-sm opacity-70">
          Inserisci gli allenamenti della scheda: l'app propone la giornata alimentare di ogni giorno con le
          regole del piano. Prima di salvare puoi cambiare tutto.
        </p>
        <div className="mt-4">
          <Inserimento
            dal={dal}
            righe={righe}
            onDal={setDal}
            onRiga={(i, riga) => setRighe(righe.map((r, j) => (j === i ? riga : r)))}
            onCalcola={calcola}
            onImporta={(giorni) => {
              setDal(giorni[0].data)
              setProposta({ giorni, motivi: giorni.map(() => ({})), avvisi: [] })
            }}
          />
        </div>
      </>
    )
  }

  const { giorni } = proposta
  const giorniCompleti: Giorno[] = giorni.map((g) => ({ ...g, ...totaleDelPiano(g) }))
  const sovrapposte = settimaneSovrapposte({ numero: 0, dal: giorni[0].data, al: giorni[giorni.length - 1].data, kmTotali: 0, giorni: giorniCompleti })
  const numeroSettimana = sovrapposte[0]?.numero ?? (ultima ? ultima.numero + 1 : 1)
  const nuova: Settimana = {
    numero: numeroSettimana,
    dal: giorni[0].data,
    al: giorni[giorni.length - 1].data,
    kmTotali: Math.round(giorni.reduce((s, g) => s + g.distanzaKm, 0)),
    giorni: giorniCompleti,
  }
  const errori = verificaDati({ ...dati, settimane: [nuova] }, pastiUtente().map((p) => p.id))
  const esiti = controllaVincoli(
    giorniCompleti,
    Object.fromEntries(giorni.map((g) => [g.data, { pranzo: g.pranzo, cena: g.cena }])),
  )

  async function salva() {
    setSalvataggio('Salvataggio…')
    await salvaSettimana(nuova)
    // replace: tornando indietro non si riapre il modulo già salvato
    window.location.replace(link.settimana(nuova.numero))
  }

  return (
    <>
      <button type="button" onClick={() => setProposta(null)} className="mb-3 py-1 font-medium text-cho">
        ‹ Modifica gli allenamenti
      </button>
      <h1 className="text-xl font-bold">Settimana {nuova.numero}: proposta</h1>
      <p className="text-sm opacity-70">
        {formatGiornoMese(nuova.dal)} – {formatGiornoMese(nuova.al)} · {nuova.kmTotali} km · tocca un campo per
        cambiarlo
      </p>

      {proposta.avvisi.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl border border-cho p-3 text-sm">
          {proposta.avvisi.map((avviso) => (
            <li key={avviso}>{avviso}</li>
          ))}
        </ul>
      )}
      {sovrapposte.length > 0 && (
        <p className="mt-3 rounded-xl border border-cho p-3 text-sm">
          Salvando sostituisci la settimana {sovrapposte.map((s) => s.numero).join(', ')} con le stesse date.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {giorni.map((giorno, i) => (
          <GiornoDellaProposta
            key={giorno.data}
            giorno={giorno}
            motivi={proposta.motivi[i] ?? {}}
            onCambia={(nuovo) =>
              setProposta({ ...proposta, giorni: giorni.map((g, j) => (j === i ? nuovo : g)) })
            }
          />
        ))}
      </ul>

      <section className="mt-5">
        <h2 className="font-bold">Vincoli della settimana</h2>
        <ul className="mt-2 divide-y divide-bordo rounded-xl border border-bordo bg-superficie">
          {esiti.map((esito) => (
            <li key={esito.id} className="flex gap-3 p-3 text-sm">
              <span className={esito.rispettato ? 'text-ok' : 'text-cho'}>{esito.rispettato ? '✓' : '⚠'}</span>
              <span className="flex-1">{esito.testo}</span>
              <span className="opacity-70">{esito.limite}</span>
            </li>
          ))}
        </ul>
      </section>

      {errori.length > 0 && (
        <ul className="mt-4 rounded-xl border-2 border-ko p-3 text-sm text-ko">
          {errori.map((errore) => (
            <li key={errore}>{errore}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void salva()}
        disabled={errori.length > 0 || salvataggio !== null}
        className="mt-5 w-full rounded-xl bg-cho p-4 text-lg font-bold text-white disabled:opacity-40"
      >
        {salvataggio ?? 'Salva la settimana'}
      </button>
    </>
  )
}
