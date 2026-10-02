// Cambia piano: mostra l'obiettivo attivo (es. Maratona di Firenze) e permette di
// sceglierne un altro, una nuova gara o il mantenimento. Lo storico resta visibile.
import { useState } from 'react'
import { formatData } from '../formato'
import { giorniA, impostaObiettivo, obiettivi, useObiettivo, type Obiettivo } from '../obiettivo'

function descrizione(obiettivo: Obiettivo): string {
  return obiettivo.tipo === 'gara' ? `${obiettivo.nome} · ${formatData(obiettivo.data)}` : 'Mantenimento'
}

const campo = 'mt-1 block w-full min-w-0 appearance-none rounded-xl border border-bordo bg-sfondo px-3 py-3 outline-none focus:border-cho'

export function CambiaPiano({ oggi }: { oggi: string }) {
  const attivo = useObiettivo()
  const [tipo, setTipo] = useState<'gara' | 'mantenimento'>('gara')
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [conferma, setConferma] = useState(false)

  const mancano = attivo.tipo === 'gara' ? giorniA(oggi, attivo.data) : null
  const conclusa = mancano !== null && mancano < 0
  const valido = tipo === 'mantenimento' || (nome.trim() !== '' && data !== '')
  const precedenti = obiettivi().slice(0, -1).reverse()

  async function imposta() {
    await impostaObiettivo(
      tipo === 'gara' ? { tipo, nome: nome.trim(), data, dal: oggi } : { tipo, dal: oggi },
    )
    setConferma(false)
    setNome('')
    setData('')
  }

  return (
    <>
      <h1 className="text-xl font-bold">Cambia piano</h1>

      <section className="mt-4 rounded-xl border-2 border-cho bg-superficie p-4">
        <div className="text-xs font-semibold uppercase text-cho">Piano attivo</div>
        <div className="mt-1 text-xl font-bold">{attivo.tipo === 'gara' ? attivo.nome : 'Mantenimento'}</div>
        {attivo.tipo === 'gara' && (
          <p className="first-letter:uppercase">
            {formatData(attivo.data)}
            {mancano !== null && mancano > 0 && <span className="font-semibold"> · −{mancano} giorni</span>}
            {mancano === 0 && <span className="font-semibold"> · è oggi!</span>}
            {conclusa && <span className="font-semibold text-cho"> · conclusa</span>}
          </p>
        )}
        <p className="mt-1 text-sm opacity-70">Attivo dal {formatData(attivo.dal)}</p>
      </section>

      {conclusa && (
        <p className="mt-3 rounded-xl bg-cho/15 p-3 text-sm font-medium">
          La gara è passata: scegli il prossimo obiettivo, oppure il mantenimento.
        </p>
      )}

      <section className="mt-4 rounded-xl border border-bordo bg-superficie p-4">
        <h2 className="font-bold">Nuovo obiettivo</h2>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-sfondo p-1" role="radiogroup">
          {(['gara', 'mantenimento'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-lg py-2 font-semibold ${tipo === t ? 'bg-superficie text-cho shadow' : 'opacity-70'}`}
            >
              {t === 'gara' ? 'Una gara' : 'Mantenimento'}
            </button>
          ))}
        </div>

        {tipo === 'gara' ? (
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase opacity-70">Nome della gara</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="es. Maratona di Roma" className={campo} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase opacity-70">Data</span>
              <input type="date" value={data} min={oggi} onChange={(e) => setData(e.target.value)} className={`${campo} h-[3.1rem] text-left`} />
            </label>
          </div>
        ) : (
          <p className="mt-3 text-sm opacity-70">Nessuna gara in vista: l'header mostra "Mantenimento".</p>
        )}

        <p className="mt-3 text-xs opacity-70">
          Cambia l'obiettivo e il conto alla rovescia. I pasti e le regole restano quelli di dati.json,
          preparati dal nutrizionista: per un piano nuovo serve il suo file aggiornato.
        </p>

        {conferma ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">
              Chiudere «{descrizione(attivo)}» e attivare «
              {tipo === 'gara' ? `${nome.trim()} · ${formatData(data)}` : 'Mantenimento'}»?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConferma(false)} className="rounded-xl border border-bordo p-3 font-medium">
                Annulla
              </button>
              <button type="button" onClick={() => void imposta()} className="rounded-xl bg-cho p-3 font-bold text-white">
                Conferma
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={!valido}
            onClick={() => setConferma(true)}
            className="mt-3 w-full rounded-xl bg-cho p-3.5 font-bold text-white disabled:opacity-40"
          >
            Imposta come piano attivo
          </button>
        )}
      </section>

      {precedenti.length > 0 && (
        <section className="mt-4">
          <h2 className="font-bold">Piani precedenti</h2>
          <ul className="mt-2 divide-y divide-bordo rounded-xl border border-bordo bg-superficie">
            {precedenti.map((o, i) => (
              <li key={i} className="p-3 text-sm">
                <div className="font-semibold">{descrizione(o)}</div>
                <div className="opacity-70">dal {formatData(o.dal)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
