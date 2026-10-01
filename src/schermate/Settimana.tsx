// Schermata Settimana (SPEC.md §3.2): il calendario a colpo d'occhio e i vincoli settimanali.
import { dati, isTipoGiornata, type Giorno, type Settimana as TipoSettimana } from '../dati'
import { formatDataBreve, formatGiornoMese, formatNumero } from '../formato'
import { link } from '../navigazione'
import { esitoGiorno, type Esito } from '../giornata'
import { useStatiGiorni, type StatoGiorno } from '../statoGiorno'
import { controllaVincoli } from '../vincoli'

/** La settimana richiesta, altrimenti quella che contiene oggi, altrimenti l'ultima. */
function scegliSettimana(numero: number | null, oggi: string): TipoSettimana | undefined {
  return (
    dati.settimane.find((s) => s.numero === numero) ??
    dati.settimane.find((s) => s.dal <= oggi && oggi <= s.al) ??
    dati.settimane[dati.settimane.length - 1]
  )
}

function Codice({ id, cambiato }: { id: string; cambiato?: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
        cambiato ? 'border border-cho text-cho' : 'bg-bordo'
      }`}
    >
      {id}
      {cambiato && '*'}
    </span>
  )
}

const badgeEsito: Record<Esito, { simbolo: string; etichetta: string; classe: string }> = {
  rispettato: { simbolo: '👍', etichetta: 'piano rispettato', classe: 'bg-ok/15' },
  nonRispettato: { simbolo: '👎', etichetta: 'piano non rispettato', classe: 'bg-red-600/15' },
  nonDichiarato: { simbolo: 'ND', etichetta: 'pasti non registrati', classe: 'bg-bordo text-xs font-bold' },
}

/** Giorni passati: 👍 / 👎 / ND. Oggi: pasti spuntati finora. Giorni futuri: niente. */
function Riepilogo({ giorno, stato, oggi }: { giorno: Giorno; stato?: StatoGiorno; oggi: string }) {
  if (giorno.data > oggi) return null
  const { esito, fatti, totali } = esitoGiorno(giorno, stato ?? { scelte: {}, consumati: [] })
  if (giorno.data === oggi) {
    return (
      <span className="rounded-full bg-bordo px-2 py-0.5 text-xs font-bold tabular-nums text-testo" title="pasti spuntati oggi">
        {fatti}/{totali}
      </span>
    )
  }
  const badge = badgeEsito[esito]
  return (
    <span
      className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-testo ${badge.classe}`}
      title={badge.etichetta}
      aria-label={badge.etichetta}
    >
      {badge.simbolo}
    </span>
  )
}

function RigaGiorno({ giorno, stato, oggi }: { giorno: Giorno; stato?: StatoGiorno; oggi: string }) {
  const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
  const scelte = stato?.scelte ?? {}
  const pasti = [
    { id: scelte.colazione ?? giorno.colazione, cambiato: !!scelte.colazione },
    { id: scelte.pranzo ?? giorno.pranzo, cambiato: !!scelte.pranzo },
    { id: scelte.cena ?? giorno.cena, cambiato: !!scelte.cena },
  ]
  const merenda = scelte.merenda ?? giorno.merenda

  return (
    <li>
      <a
        href={link.giorno(giorno.data)}
        className={`flex gap-3 rounded-xl border bg-superficie p-3 ${
          giorno.data === oggi ? 'border-2 border-cho' : 'border-bordo'
        }`}
      >
        <div
          className="w-1.5 shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: tipo?.colore }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold first-letter:uppercase">{formatDataBreve(giorno.data)}</span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: tipo?.colore }}
            >
              {giorno.tipo}
            </span>
            {giorno.data === oggi && <span className="text-xs font-semibold uppercase text-cho">oggi</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm">{giorno.allenamento}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {pasti.map((pasto, i) => (
              <Codice key={i} id={pasto.id} cambiato={pasto.cambiato} />
            ))}
            {merenda && <Codice id={merenda} cambiato={!!scelte.merenda} />}
            {giorno.spuntinoSerale && (
              <span className="flex items-center gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-cho" aria-hidden="true" />
                serale
              </span>
            )}
            {giorno.gelCho > 0 && (
              <span className="text-xs">gel {formatNumero(giorno.gelCho)} g</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right text-cho">
          <div className="text-2xl font-bold leading-none tabular-nums">{formatNumero(giorno.cho)}</div>
          <div className="text-xs font-semibold">g CHO</div>
          <div className="mt-1 text-xs text-testo opacity-70">{formatNumero(giorno.kcal)} kcal</div>
          <div className="mt-2 flex justify-end">
            <Riepilogo giorno={giorno} stato={stato} oggi={oggi} />
          </div>
        </div>
      </a>
    </li>
  )
}

type Props = {
  numero: number | null
  oggi: string
}

export function Settimana({ numero, oggi }: Props) {
  const settimana = scegliSettimana(numero, oggi)
  const giorni = settimana?.giorni ?? []
  const stati = useStatiGiorni(giorni.map((g) => g.data))

  if (!settimana) {
    return <p>Nessuna settimana nel piano.</p>
  }

  const indice = dati.settimane.indexOf(settimana)
  const precedente = dati.settimane[indice - 1]
  const successiva = dati.settimane[indice + 1]
  const pastiEffettivi = Object.fromEntries(
    giorni.map((g) => [
      g.data,
      { pranzo: stati[g.data]?.scelte.pranzo ?? g.pranzo, cena: stati[g.data]?.scelte.cena ?? g.cena },
    ]),
  )
  const esiti = controllaVincoli(giorni, pastiEffettivi)
  const cambiamenti = giorni.some((g) => Object.keys(stati[g.data]?.scelte ?? {}).length > 0)

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        {precedente ? (
          <a href={link.settimana(precedente.numero)} aria-label="Settimana precedente" className="p-2 text-2xl">
            ‹
          </a>
        ) : (
          <span className="w-10" />
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold">Settimana {settimana.numero}</h1>
          <p className="text-sm opacity-70">
            {formatGiornoMese(settimana.dal)} – {formatGiornoMese(settimana.al)} · {settimana.kmTotali} km
          </p>
        </div>
        {successiva ? (
          <a href={link.settimana(successiva.numero)} aria-label="Settimana successiva" className="p-2 text-2xl">
            ›
          </a>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <ul className="mt-4 space-y-2">
        {giorni.map((giorno) => (
          <RigaGiorno key={giorno.data} giorno={giorno} stato={stati[giorno.data]} oggi={oggi} />
        ))}
      </ul>
      <p className="mt-2 text-xs opacity-70">
        Codici: colazione · pranzo · cena · merenda. CHO e kcal sono quelli del piano.
        {cambiamenti && ' * = cambiato per quel giorno.'} 👍 tutti i pasti spuntati · 👎 solo
        alcuni · ND nessuno.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Vincoli della settimana</h2>
        <ul className="mt-2 divide-y divide-bordo rounded-xl border border-bordo bg-superficie">
          {esiti.map((esito) => (
            <li key={esito.id} className="flex gap-3 p-3">
              <span
                className={`text-lg leading-none ${esito.rispettato ? 'text-ok' : 'text-cho'}`}
                aria-label={esito.rispettato ? 'rispettato' : 'da controllare'}
              >
                {esito.rispettato ? '✓' : '⚠'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{esito.testo}</span>
                  <span className="shrink-0 text-sm opacity-70">{esito.limite}</span>
                </div>
                {esito.dettaglio && <div className="text-sm text-cho">{esito.dettaglio}</div>}
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 font-semibold">Da ricordare</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {dati.regole.vincoliSettimanali.map((vincolo) => (
            <li key={vincolo.id}>
              <span className="font-medium first-letter:uppercase">{vincolo.regola}</span>
              {vincolo.motivo && <span className="opacity-70"> — {vincolo.motivo}</span>}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
