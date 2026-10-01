// Le regole di "Da ricordare" mostrate dove si sceglie: contatore settimanale sulle cene
// con limiti (C2, C4) e promemoria della sera prima di un giorno pesante.
import { useState } from 'react'
import type { Vincolo } from '../dati'
import { formatDataBreve } from '../formato'
import { frazioneLimite, oltreMassimo, vincoliDelPasto, type ConteggioPasto } from '../vincoli'
import { Popup } from './Popup'

function coloreStato(conteggio: ConteggioPasto): string {
  if (oltreMassimo(conteggio)) return 'text-red-600'
  if (conteggio.minimo !== undefined && conteggio.volte >= conteggio.minimo) return 'text-ok'
  return ''
}

function ElencoRegole({ vincoli }: { vincoli: Vincolo[] }) {
  return (
    <ul className="space-y-2">
      {vincoli.map((vincolo) => (
        <li key={vincolo.id} className="rounded-lg bg-sfondo p-3">
          <div className="font-medium first-letter:uppercase">{vincolo.regola}</div>
          {vincolo.motivo && <div className="text-sm opacity-70">Perché: {vincolo.motivo}</div>}
        </li>
      ))}
    </ul>
  )
}

type PropsContatore = {
  id: string
  nome: string
  conteggio: ConteggioPasto
}

/** Riga "C4 questa settimana: 2/3 max ⓘ" che apre il dettaglio della regola. */
export function ContatoreSettimana({ id, nome, conteggio }: PropsContatore) {
  const [aperto, setAperto] = useState(false)
  const frazione = frazioneLimite(conteggio)
  if (!frazione) return null
  const limite = conteggio.massimo ?? conteggio.minimo

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-sfondo px-3 py-2 text-left text-sm"
      >
        <span>
          {id} questa settimana:{' '}
          <span className={`font-bold ${coloreStato(conteggio)}`}>{frazione}</span>
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold opacity-70">
          i
        </span>
      </button>
      {aperto && (
        <Popup titolo={`${id} · ${nome}`} onChiudi={() => setAperto(false)}>
          <p>
            Questa settimana:{' '}
            <span className={`font-bold ${coloreStato(conteggio)}`}>
              {conteggio.volte} {conteggio.volte === 1 ? 'volta' : 'volte'}
            </span>{' '}
            ({conteggio.massimo !== undefined ? 'massimo' : 'minimo'} {limite})
          </p>
          {conteggio.giorni.length > 0 && (
            <p className="text-sm opacity-70">
              Giorni: {conteggio.giorni.map(formatDataBreve).join(', ')}
            </p>
          )}
          <ElencoRegole vincoli={vincoliDelPasto(id)} />
        </Popup>
      )}
    </>
  )
}

/** Avviso visibile sulla cena quando il giorno dopo richiede attenzione (es. crucifere). */
export function PromemoriaSera({ vincoli, tipoDomani }: { vincoli: Vincolo[]; tipoDomani: string }) {
  return (
    <>
      {vincoli.map((vincolo) => (
        <div key={vincolo.id} className="rounded-lg border border-cho px-3 py-2 text-sm">
          <span className="font-semibold">Domani è {tipoDomani}:</span> {vincolo.regola}
          {vincolo.motivo && <span className="opacity-70"> — {vincolo.motivo}</span>}
        </div>
      ))}
    </>
  )
}
