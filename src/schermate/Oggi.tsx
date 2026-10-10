// Schermata Oggi (SPEC.md §3.1): cosa mangio adesso. Serve anche per il dettaglio di un
// giorno dalla Settimana o dal Mese, anche passato (per segnare i pasti in ritardo).
import { useEffect, useRef, useState } from 'react'
import { CardPasto } from '../componenti/CardPasto'
import { CardPastoLibero } from '../componenti/CardPastoLibero'
import { Conferma } from '../componenti/Conferma'
import { etichettePasti } from '../etichette'
import { formatData, formatNumero } from '../formato'
import { cercaGiorno, confrontoProteine, giornataEquivalente, proteineDelPiano, giornoDopo, indicePastoCorrente, totaliPasti, totaliSenza, vociDelGiorno } from '../giornata'
import { useStatiGiorni, useStatoGiorno } from '../statoGiorno'
import { settimane } from '../piano'
import { conteggiVincoli, vincoliSeraPrima, type PastiDelGiorno } from '../vincoli'
import type { ContestoSettimana } from '../componenti/CardPasto'
import { dati, isCategoriaConId, isTipoGiornata, type CategoriaPasto } from '../dati'

type Props = {
  data: string
  /** Ora corrente (HH:MM), solo se `data` è oggi: serve a evidenziare il pasto corrente. */
  ora: string | null
  /** Giorno passato: resta modificabile (si segna dopo), con un avviso. */
  passato?: boolean
}

export function Oggi({ data, ora, passato = false }: Props) {
  const trovato = cercaGiorno(data)
  const { stato, scegli, segnaConsumato, annota, impostaSgarro, confermaPasto, pastoLibero, ripristinaPasto, dolce } =
    useStatoGiorno(data)
  const [daTogliere, setDaTogliere] = useState<CategoriaPasto | null>(null)
  const [chiudiLibera, setChiudiLibera] = useState(false)
  const giorniSettimana = trovato?.settimana.giorni ?? []
  const statiAltri = useStatiGiorni(giorniSettimana.map((g) => g.data).filter((d) => d !== data))
  const voci = trovato ? vociDelGiorno(trovato.giorno, stato.scelte, stato.liberi, stato.dolci) : []
  const corrente = ora !== null && voci.length > 0 ? indicePastoCorrente(voci, ora) : null
  // Scegliere un pasto lo spunta come consumato, ma non nei giorni futuri (lì si sta solo pianificando).
  const futuro = ora === null && !passato
  const categoriaCorrente = corrente !== null ? voci[corrente].categoria : null

  // Porta il pasto corrente in cima solo all'apertura, non a ogni cambio d'ora.
  const scorrimentoFatto = useRef(false)
  useEffect(() => {
    if (categoriaCorrente && !scorrimentoFatto.current) {
      scorrimentoFatto.current = true
      document.getElementById(`pasto-${categoriaCorrente}`)?.scrollIntoView({ block: 'start' })
    }
  }, [categoriaCorrente])

  if (!trovato) {
    const tutti = settimane().flatMap((s) => s.giorni.map((g) => g.data)).sort()
    return (
      <section className="rounded-xl border border-bordo bg-superficie p-4">
        <h1 className="text-xl font-bold first-letter:uppercase">{formatData(data)}</h1>
        <p className="mt-2">Nessun giorno del piano per questa data.</p>
        {tutti.length > 0 && (
          <p className="mt-1 text-sm opacity-70">
            Il piano copre dal {formatData(tutti[0])} al {formatData(tutti[tutti.length - 1])}.
          </p>
        )}
      </section>
    )
  }

  const { giorno } = trovato
  const tipo = isTipoGiornata(giorno.tipo) ? dati.tipiGiornata[giorno.tipo] : null
  const confronto = confrontoProteine(proteineDelPiano(giorno), giorno.tipo)
  // Solo i pasti spuntati: cresce in tempo reale man mano che si mangia.
  const consumati = totaliPasti(voci.filter((v) => stato.consumati.includes(v.categoria)))

  // Pranzi e cene della settimana (con sostituzioni salvate, senza i pasti liberi)
  // per i contatori dei vincoli settimanali (pesce grasso, formaggio, carne).
  const pastiEffettivi = (g: typeof giorno): PastiDelGiorno => {
    const s = g.data === data ? stato : statiAltri[g.data]
    return {
      pranzo: s?.liberi?.pranzo !== undefined ? null : (s?.scelte.pranzo ?? g.pranzo),
      cena: s?.liberi?.cena !== undefined ? null : (s?.scelte.cena ?? g.cena),
    }
  }
  const tipoDomani = cercaGiorno(giornoDopo(data))?.giorno.tipo
  const contesto: ContestoSettimana = {
    conteggi: conteggiVincoli(giorniSettimana, pastiEffettivi),
    conteggiAltri: conteggiVincoli(
      giorniSettimana.filter((g) => g.data !== data),
      pastiEffettivi,
    ),
    promemoriaSera: vincoliSeraPrima(tipoDomani),
    tipoDomani,
  }

  return (
    <>
      {passato && (
        <p className="mb-3 rounded-xl bg-superficie px-3 py-2 text-sm">
          <span className="font-semibold">Giorno passato:</span> puoi ancora segnare i pasti, sceglierli o cambiarli.
        </p>
      )}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold first-letter:uppercase">{formatData(giorno.data)}</h1>
          <span
            className="rounded-md px-2 py-0.5 text-sm font-semibold text-white"
            style={{ backgroundColor: tipo?.colore }}
          >
            {giorno.tipo}
          </span>
          {tipo && <span className="text-sm opacity-70">{tipo.etichetta}</span>}
        </div>
        <p className="mt-1">{giorno.allenamento}</p>
        {giorno.lungoDomenicale && (
          <p className="mt-1 text-sm font-semibold">Lungo domenicale</p>
        )}
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Piano</div>
          <div className="text-4xl font-bold leading-tight tabular-nums text-cho">
            {formatNumero(giorno.cho)}
            <span className="ml-1 text-base">g CHO</span>
          </div>
          <div className="text-sm">
            <span className="opacity-70">{formatNumero(giorno.kcal)} kcal · </span>
            <span className="font-semibold text-pro">{formatNumero(proteineDelPiano(giorno))} g pro</span>
          </div>
          {confronto && (
            <div className="mt-0.5 text-xs">
              <span className="opacity-70">target pro {confronto.min}–{confronto.max} g · </span>
              <span className={`whitespace-nowrap font-semibold ${confronto.esito === 'dentro' ? 'text-ok' : ''}`}>
                {confronto.esito === 'dentro'
                  ? 'nel target'
                  : `${formatNumero(Math.abs(confronto.scarto))} g ${confronto.esito === 'sopra' ? 'sopra' : 'sotto'}`}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Consumati finora</div>
          <div className="text-4xl font-bold leading-tight tabular-nums text-cho">
            {formatNumero(consumati.cho)}
            <span className="ml-1 text-base">g CHO</span>
          </div>
          <div className="text-sm">
            <span className="opacity-70">{formatNumero(consumati.kcal)} kcal · </span><span className="font-semibold text-pro">{formatNumero(consumati.proteine)} g pro</span>
          </div>
          {consumati.pastiLiberi.length > 0 && (
            <div className="mt-1 text-xs font-semibold text-ko">
              + {consumati.pastiLiberi.length} {consumati.pastiLiberi.length === 1 ? 'pasto libero' : 'pasti liberi'} ND
            </div>
          )}
        </div>
      </section>

      <label className={`mt-3 flex items-start gap-3 rounded-xl border bg-superficie p-3 ${stato.sgarro ? 'border-2 border-dashed border-cho' : 'border-bordo'}`}>
        <input
          type="checkbox"
          checked={!!stato.sgarro}
          onChange={(e) => {
            if (e.target.checked) impostaSgarro(true)
            else if (Object.keys(stato.liberi ?? {}).length > 0) setChiudiLibera(true)
            else impostaSgarro(false)
          }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--cho)]"
        />
        <span>
          <span className="block font-semibold">Giornata libera</span>
          <span className="block text-xs opacity-70">
            Decidi pasto per pasto: ✓ lo tieni come da piano, ✕ lo togli e scrivi cosa hai mangiato.
          </span>
        </span>
      </label>

      {stato.sgarro && Object.keys(stato.liberi ?? {}).length > 0 && giornataEquivalente(giorno, stato) && (
        <p className="mt-2 rounded-xl bg-ok/15 px-3 py-2 text-sm">
          Giornata libera, ma con totali equivalenti al piano (entro ±{dati.regole.giornataLibera.tolleranzaPercento}% su
          kcal, CHO e proteine): conta come rispettata.
        </p>
      )}

      {(giorno.gelCho > 0 || giorno.spuntinoSerale) && (
        <section className="mt-3 space-y-1 rounded-xl border border-bordo bg-superficie p-3 text-sm">
          {giorno.gelCho > 0 && (
            <p>
              <span className="font-semibold">Gel in corsa: </span>
              <span className="font-bold text-cho">{formatNumero(giorno.gelCho)} g CHO</span>
              <span className="opacity-70"> · non inclusi nei totali</span>
            </p>
          )}
          {giorno.spuntinoSerale && (
            <p>
              <span className="font-semibold">Spuntino serale previsto</span>
            </p>
          )}
        </section>
      )}

      {giorno.ricarica && (
        <section className="mt-3 rounded-xl border-2 border-cho p-3 text-sm">
          <p className="font-semibold">Ricarica: {dati.regole.sabatoRicarica.motivo}</p>
          <p className="mt-1">{dati.regole.sabatoRicarica.effetto}</p>
        </section>
      )}

      {giorno.note && <p className="mt-3 text-sm opacity-80">{giorno.note}</p>}

      <section className="mt-5 space-y-3">
        {voci.map((voce, i) =>
          voce.libero !== undefined ? (
            <CardPastoLibero
              key={voce.categoria}
              voce={voce}
              etichetta={etichettePasti[voce.categoria]}
              consumato={stato.consumati.includes(voce.categoria)}
              onConsumato={(consumato) => segnaConsumato(voce.categoria, consumato)}
              onSalva={(libero) => pastoLibero(voce.categoria, libero)}
              onRipristina={ripristinaPasto}
            />
          ) : (
          <CardPasto
            key={voce.categoria}
            voce={voce}
            corrente={i === corrente}
            consumato={stato.consumati.includes(voce.categoria)}
            tipoGiorno={giorno.tipo}
            settimana={
              voce.categoria === 'cena'
                ? contesto
                : voce.categoria === 'pranzo'
                  ? { ...contesto, promemoriaSera: [] }
                  : undefined
            }
            nota={stato.note?.[voce.categoria]}
            giornata={{
              tipo: giorno.tipo,
              ricarica: !!giorno.ricarica,
              senzaQuesto: totaliSenza(voci, voce.categoria),
              piano: { cho: giorno.cho, kcal: giorno.kcal },
              merendaStimata:
                voce.categoria !== 'merenda' && voci.some((v) => v.categoria === 'merenda' && !v.pasto && v.libero === undefined),
              liberiSenzaValori: totaliPasti(voci.filter((v) => v.categoria !== voce.categoria)).pastiLiberi.length,
            }}
            onAnnota={(testo) => annota(voce.categoria, testo)}
            onConsumato={(consumato) => segnaConsumato(voce.categoria, consumato)}
            onScegli={(id) => {
              if (isCategoriaConId(voce.categoria)) scegli(voce.categoria, id, voce.idPiano, id !== null && !futuro)
            }}
            onLibero={(libero) => pastoLibero(voce.categoria, libero, !futuro)}
            onDolce={voce.categoria === 'pranzo' || voce.categoria === 'cena' ? (id) => dolce(voce.categoria, id) : undefined}
            sgarro={
              stato.sgarro && !(stato.confermati ?? []).includes(voce.categoria)
                ? { onConferma: () => confermaPasto(voce.categoria), onElimina: () => setDaTogliere(voce.categoria) }
                : undefined
            }
          />
          ),
        )}
      </section>

      {daTogliere && (
        <Conferma
          titolo={`Togli ${etichettePasti[daTogliere].toLowerCase()}`}
          etichettaConferma="Togli"
          distruttiva
          onAnnulla={() => setDaTogliere(null)}
          onConferma={() => {
            pastoLibero(daTogliere, { testo: '' })
            setDaTogliere(null)
          }}
        >
          Al posto del pasto del piano scriverai cosa hai mangiato. Se non ne inserisci i valori, i suoi CHO restano ND.
        </Conferma>
      )}
      {chiudiLibera && (
        <Conferma
          titolo="Giornata normale"
          etichettaConferma="Conferma"
          distruttiva
          onAnnulla={() => setChiudiLibera(false)}
          onConferma={() => {
            impostaSgarro(false)
            setChiudiLibera(false)
          }}
        >
          Togliendo la giornata libera tornano i pasti del piano e si cancellano i pasti liberi che hai scritto.
        </Conferma>
      )}
    </>
  )
}
