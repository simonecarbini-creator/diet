// Pasti e alternative: tutti i pasti del piano per categoria, con le loro versioni, e le
// alternative aggiunte dall'utente (salvate sul telefono, separate da dati.json).
import { useState } from 'react'
import { RiassuntoAlimenti } from '../componenti/Alimenti'
import { Conferma } from '../componenti/Conferma'
import { NumeriPasto } from '../componenti/NumeriPasto'
import { dati, dolci, idAlternative, trovaPasto, type CategoriaConId, type PastoRisolto } from '../dati'
import { condividiFile } from '../esporta'
import { formatNumero } from '../formato'
import { Evidenzia } from '../componenti/Evidenzia'
import { contiene } from '../ricerca'
import { aggiungiPastoUtente, eliminaPastoUtente, usePastiUtente, type PastoUtente } from '../pastiUtente'

const categorie: { id: CategoriaConId; titolo: string }[] = [
  { id: 'colazione', titolo: 'Colazioni' },
  { id: 'spuntino', titolo: 'Spuntini' },
  { id: 'pranzo', titolo: 'Pranzi' },
  { id: 'merenda', titolo: 'Merende' },
  { id: 'cena', titolo: 'Cene' },
  { id: 'spuntinoSerale', titolo: 'Spuntino serale' },
]

/** Fuori dal piano: sgarri (al posto di un pasto) e dolci (in aggiunta). Solo da consultare qui. */
type Scheda = CategoriaConId | 'sgarri' | 'dolci'
const schedeExtra: { id: Scheda; titolo: string; nota: string }[] = [
  { id: 'sgarri', titolo: 'Sgarri', nota: 'Al posto di un pasto, non in aggiunta: si scelgono da «Cambia» sul pranzo, sulla cena o sulla colazione.' },
  { id: 'dolci', titolo: 'Dolci', nota: 'Si aggiungono a un pasto, non lo sostituiscono: «+ Aggiungi un dolce» sul pranzo o sulla cena, e i loro CHO si sommano alla giornata.' },
]

function pastiExtra(scheda: 'sgarri' | 'dolci'): PastoRisolto[] {
  if (scheda === 'dolci') return dolci()
  const colazioni = idAlternative('colazione').map((id) => trovaPasto('colazione', id))
  const altri = dati.sgarri.map((s) => trovaPasto(s.momento.includes('pranzo') ? 'pranzo' : 'cena', s.id))
  return [...colazioni, ...altri].filter((p): p is PastoRisolto => !!p?.daSgarro)
}

/** Per pranzi e cene: i pasti principali a cui si possono aggiungere alternative. */
function pastiBase(categoria: CategoriaConId): { id: string; nome: string }[] {
  if (categoria === 'pranzo') return dati.pranzi.map((p) => ({ id: p.id, nome: p.nome }))
  if (categoria === 'cena') return dati.cene.map((c) => ({ id: c.id, nome: c.nome }))
  return []
}

function RigaPasto({
  pasto,
  onElimina,
  cerca,
  categoria,
}: {
  pasto: PastoRisolto
  onElimina?: () => void
  /** Testo cercato: si evidenzia in codice, nome e alimenti. */
  cerca?: string
  /** Nei risultati della ricerca, la categoria del pasto. */
  categoria?: string
}) {
  // Alimenti (e loro alternative "oppure") che contengono il testo cercato.
  const alimentiTrovati = cerca
    ? pasto.alimenti.flatMap((a) => [a.nome, ...(a.sostituibileCon ?? [])]).filter((nome) => contiene(nome, cerca))
    : []
  const [aperto, setAperto] = useState(false)
  return (
    <li className="rounded-xl border border-bordo bg-superficie">
      <button type="button" onClick={() => setAperto(!aperto)} aria-expanded={aperto} className="flex w-full items-start gap-3 p-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded bg-bordo px-1.5 py-0.5 text-xs font-semibold">
              <Evidenzia testo={pasto.id} cerca={cerca} />
            </span>
            {categoria && <span className="text-xs font-semibold uppercase opacity-60">{categoria}</span>}
            {pasto.utente && <span className="text-xs font-semibold uppercase text-cho">tua</span>}
          </div>
          <div className="mt-1 font-semibold leading-snug">
            <Evidenzia testo={pasto.composizione ?? pasto.nome} cerca={cerca} />
          </div>
          {alimentiTrovati.length > 0 && (
            <div className="text-sm">
              contiene:{' '}
              {alimentiTrovati.map((nome, i) => (
                <span key={nome}>
                  {i > 0 && ', '}
                  <Evidenzia testo={nome} cerca={cerca} />
                </span>
              ))}
            </div>
          )}
          <div className="text-sm opacity-70">{formatNumero(pasto.kcal)} kcal</div>
        </div>
        <NumeriPasto cho={pasto.cho} proteine={pasto.proteine} />
      </button>
      {aperto && (
        <div className="space-y-2 border-t border-bordo px-3 pb-3 pt-2">
          {pasto.alimenti.length > 0 && <RiassuntoAlimenti alimenti={pasto.alimenti} />}
          {pasto.notaVersione && <p className="text-sm">{pasto.notaVersione}</p>}
          {pasto.note && <p className="text-sm opacity-70">{pasto.note}</p>}
          {onElimina && (
            <button type="button" onClick={onElimina} className="w-full rounded-lg border border-ko p-2 text-sm font-semibold text-ko">
              Elimina questa alternativa
            </button>
          )}
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------

type Bozza = {
  base: string | null
  nome: string
  kcal: string
  cho: string
  proteine: string
  alimenti: { nome: string; grammi: string }[]
  note: string
}

const numero = (t: string) => Number(t.replace(',', '.'))
const valido = (t: string) => t.trim() !== '' && Number.isFinite(numero(t)) && numero(t) >= 0
const campo = 'mt-1 block w-full min-w-0 rounded-lg border border-bordo bg-sfondo px-2.5 py-2 outline-none focus:border-cho'

function NuovaAlternativa({ categoria, onFatto }: { categoria: CategoriaConId; onFatto: () => void }) {
  const basi = pastiBase(categoria)
  const [bozza, setBozza] = useState<Bozza>({
    base: basi[0]?.id ?? null,
    nome: '',
    kcal: '',
    cho: '',
    proteine: '',
    alimenti: [{ nome: '', grammi: '' }],
    note: '',
  })
  const ok = bozza.nome.trim() !== '' && valido(bozza.kcal) && valido(bozza.cho) && valido(bozza.proteine)
  const aggiorna = (parziale: Partial<Bozza>) => setBozza({ ...bozza, ...parziale })

  async function salva() {
    await aggiungiPastoUtente({
      categoria,
      base: bozza.base,
      nome: bozza.nome.trim(),
      kcal: numero(bozza.kcal),
      cho: numero(bozza.cho),
      proteine: numero(bozza.proteine),
      alimenti: bozza.alimenti
        .filter((a) => a.nome.trim() !== '')
        .map((a) => ({ nome: a.nome.trim(), grammi: valido(a.grammi) ? numero(a.grammi) : null })),
      ...(bozza.note.trim() ? { note: bozza.note.trim() } : {}),
    })
    onFatto()
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-cho bg-superficie p-4">
      <h2 className="font-bold">Nuova alternativa</h2>
      {basi.length > 0 && (
        <label className="block">
          <span className="text-xs font-semibold uppercase opacity-70">Alternativa a</span>
          <select value={bozza.base ?? ''} onChange={(e) => aggiorna({ base: e.target.value })} className={`${campo} font-semibold`}>
            {basi.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        <span className="text-xs font-semibold uppercase opacity-70">Nome</span>
        <input value={bozza.nome} onChange={(e) => aggiorna({ nome: e.target.value })} placeholder="es. Riso, salmone e zucchine" className={campo} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['kcal', 'Kcal'],
            ['cho', 'g CHO'],
            ['proteine', 'g proteine'],
          ] as const
        ).map(([chiave, testo]) => (
          <label key={chiave} className="block min-w-0">
            <span className="text-xs font-semibold uppercase opacity-70">{testo}</span>
            <input inputMode="decimal" value={bozza[chiave]} onChange={(e) => aggiorna({ [chiave]: e.target.value })} className={`${campo} font-semibold`} />
          </label>
        ))}
      </div>

      <div>
        <span className="text-xs font-semibold uppercase opacity-70">Alimenti (facoltativi)</span>
        <ul className="mt-1 space-y-2">
          {bozza.alimenti.map((a, i) => (
            <li key={i} className="grid grid-cols-[1fr_5.5rem] gap-2">
              <input
                value={a.nome}
                placeholder="alimento"
                onChange={(e) => aggiorna({ alimenti: bozza.alimenti.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })}
                className={campo.replace('mt-1 ', '')}
              />
              <input
                inputMode="decimal"
                value={a.grammi}
                placeholder="g"
                onChange={(e) => aggiorna({ alimenti: bozza.alimenti.map((x, j) => (j === i ? { ...x, grammi: e.target.value } : x)) })}
                className={campo.replace('mt-1 ', '')}
              />
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => aggiorna({ alimenti: [...bozza.alimenti, { nome: '', grammi: '' }] })} className="mt-2 text-sm font-semibold text-cho">
          + Aggiungi un alimento
        </button>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase opacity-70">Nota (facoltativa)</span>
        <textarea rows={2} value={bozza.note} onChange={(e) => aggiorna({ note: e.target.value })} className={`${campo} resize-none`} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onFatto} className="rounded-xl border border-bordo p-3 font-medium">
          Annulla
        </button>
        <button type="button" disabled={!ok} onClick={() => void salva()} className="rounded-xl bg-cho p-3 font-bold text-white disabled:opacity-40">
          Salva
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function Pasti() {
  const tue = usePastiUtente()
  const [scheda, setScheda] = useState<Scheda>('pranzo')
  const extra = scheda === 'sgarri' || scheda === 'dolci' ? scheda : null
  const categoria: CategoriaConId = extra ? 'pranzo' : (scheda as CategoriaConId)
  const [nuova, setNuova] = useState(false)
  const [daEliminare, setDaEliminare] = useState<PastoUtente | null>(null)
  const [cerca, setCerca] = useState('')
  const inRicerca = cerca.trim().length >= 3
  // Da 3 lettere: cerca in tutte le categorie, per codice, nome e alimenti.
  const risultati = inRicerca
    ? categorie.flatMap((c) =>
        idAlternative(c.id)
          .map((id) => trovaPasto(c.id, id))
          .filter((p): p is PastoRisolto => p !== null)
          .filter(
            (p) =>
              contiene(p.id, cerca) ||
              contiene(p.composizione ?? p.nome, cerca) ||
              p.alimenti.some((a) => [a.nome, ...(a.sostituibileCon ?? [])].some((nome) => contiene(nome, cerca))),
          )
          .map((p) => ({ pasto: p, categoria: c.titolo })),
      ).concat(
        dolci()
          .filter((p) => contiene(p.id, cerca) || contiene(p.nome, cerca) || p.alimenti.some((a) => contiene(a.nome, cerca)))
          .map((p) => ({ pasto: p, categoria: 'Dolci' })),
      )
    : []

  const pasti = idAlternative(categoria)
    .map((id) => trovaPasto(categoria, id))
    .filter((p): p is PastoRisolto => p !== null)
  const basi = pastiBase(categoria)
  // Pranzi e cene: un gruppo per pasto base con le sue versioni.
  // Colazioni: un gruppo per tipo (STD, MAGG, RID); le tue alternative in fondo.
  const tipiColazione = Object.entries(dati.blocchi.tipiColazione)
  const gruppi =
    categoria === 'colazione'
      ? [
          ...tipiColazione.map(([tipo, info]) => ({
            titolo: `${info.nome} (${tipo})`,
            pasti: pasti.filter((p) => p.tipoColazione === tipo),
          })),
          { titolo: 'Le tue', pasti: pasti.filter((p) => !p.tipoColazione) },
        ].filter((g) => g.pasti.length > 0)
      : basi.length > 0
        ? basi.map((b) => ({ titolo: `${b.id} · ${b.nome}`, pasti: pasti.filter((p) => p.id === b.id || p.base === b.id) }))
        : [{ titolo: null, pasti }]
  const note = categoria === 'colazione' ? dati.noteColazioni : []

  return (
    <>
      <h1 className="text-xl font-bold">Pasti e alternative</h1>
      <p className="mt-1 text-sm opacity-70">
        I pasti del piano e le loro versioni. Le alternative che aggiungi tu restano sul telefono anche quando il piano
        si aggiorna, finiscono nel backup e compaiono tra le scelte di ogni giorno.
      </p>

      {/* Note del nutrizionista (dati.json → notePasti): la prima, sui pesi, sempre in vista. */}
      <p className="mt-3 rounded-xl bg-superficie p-3 text-sm">{dati.notePasti[0]}</p>
      {dati.notePasti.length > 1 && (
        <details className="mt-2 rounded-xl bg-superficie p-3 text-sm">
          <summary className="font-semibold">Da sapere sui pasti</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {dati.notePasti.slice(1).map((nota) => (
              <li key={nota}>{nota}</li>
            ))}
          </ul>
        </details>
      )}

      <label className="relative mt-3 block">
        <span className="sr-only">Cerca un pasto o un alimento</span>
        <input
          type="search"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Cerca un pasto o un alimento…"
          className="block w-full rounded-xl border border-bordo bg-superficie py-3 pl-10 pr-3 outline-none focus:border-cho"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </label>
      {cerca.trim().length > 0 && !inRicerca && (
        <p className="mt-1 text-xs opacity-70">Scrivi almeno 3 lettere.</p>
      )}

      {inRicerca ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold opacity-70">
            {risultati.length === 0 ? 'Nessun pasto trovato.' : `${risultati.length} ${risultati.length === 1 ? 'risultato' : 'risultati'}`}
          </h2>
          <ul className="space-y-2">
            {risultati.map(({ pasto, categoria: titolo }) => (
              <RigaPasto
                key={`${titolo}-${pasto.id}`}
                pasto={pasto}
                cerca={cerca}
                categoria={titolo}
                onElimina={pasto.utente ? () => setDaEliminare(tue.find((t) => t.id === pasto.id) ?? null) : undefined}
              />
            ))}
          </ul>
        </section>
      ) : (
      <>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...categorie, ...schedeExtra].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={scheda === c.id}
            onClick={() => {
              setScheda(c.id)
              setNuova(false)
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              scheda === c.id ? 'border-cho bg-cho text-white' : 'border-bordo bg-superficie'
            }`}
          >
            {c.titolo}
          </button>
        ))}
      </div>

      {extra ? (
        <>
          <p className="mt-4 rounded-xl bg-superficie p-3 text-sm">{schedeExtra.find((e) => e.id === extra)?.nota}</p>
          <ul className="mt-4 space-y-2">
            {pastiExtra(extra).map((p) => (
              <RigaPasto key={p.id} pasto={p} />
            ))}
          </ul>
        </>
      ) : (
      <>
      <div className="mt-4">
        {nuova ? (
          <NuovaAlternativa categoria={categoria} onFatto={() => setNuova(false)} />
        ) : (
          <button type="button" onClick={() => setNuova(true)} className="w-full rounded-xl border-2 border-dashed border-cho p-3 font-semibold text-cho">
            + Aggiungi un'alternativa
          </button>
        )}
      </div>

      {note.length > 0 && (
        <details className="mt-4 rounded-xl bg-superficie p-3 text-sm">
          <summary className="font-semibold">Da sapere sulle colazioni</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {note.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-4 space-y-5">
        {gruppi.map((g, i) => (
          <section key={i}>
            {g.titolo && <h2 className="mb-2 font-bold">{g.titolo}</h2>}
            <ul className="space-y-2">
              {g.pasti.map((p) => (
                <RigaPasto
                  key={p.id}
                  pasto={p}
                  onElimina={p.utente ? () => setDaEliminare(tue.find((t) => t.id === p.id) ?? null) : undefined}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      </>
      )}
      </>
      )}

      {tue.length > 0 && (
        <button
          type="button"
          onClick={() => void condividiFile('diet-alternative.json', JSON.stringify(tue, null, 2), 'application/json')}
          className="mt-6 w-full rounded-xl border border-bordo bg-superficie p-3 font-medium"
        >
          Esporta le tue alternative (JSON)
        </button>
      )}

      {daEliminare && (
        <Conferma
          titolo={`Elimina ${daEliminare.id}`}
          etichettaConferma="Elimina"
          distruttiva
          onAnnulla={() => setDaEliminare(null)}
          onConferma={() => {
            void eliminaPastoUtente(daEliminare.id)
            setDaEliminare(null)
          }}
        >
          «{daEliminare.nome}» non sarà più tra le scelte. Nei giorni in cui l'avevi scelta tornerà il pasto del piano.
        </Conferma>
      )}
    </>
  )
}
