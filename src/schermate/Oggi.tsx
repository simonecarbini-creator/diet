// Schermata Oggi (SPEC.md §3.1): cosa mangio adesso. Serve anche per il dettaglio di un
// giorno dalla Settimana o dal Mese, anche passato (per segnare i pasti in ritardo).
import { useEffect, useRef } from 'react'
import { CardPasto } from '../componenti/CardPasto'
import { CardPastoLibero } from '../componenti/CardPastoLibero'
import { RiepilogoGiornata } from '../componenti/RiepilogoGiornata'
import { etichettePasti } from '../etichette'
import { formatData, formatNumero } from '../formato'
import { cercaGiorno, grassiDelPiano, proteineDelPiano, giornoDopo, indicePastoCorrente, totaliPasti, totaliSenza, vociDelGiorno } from '../giornata'
import { useStatiGiorni, useStatoGiorno } from '../statoGiorno'
import { settimane } from '../piano'
import { conteggiVincoli, pastiEffettiviDi, vincoliSeraPrima, type PastiDelGiorno } from '../vincoli'
import type { ContestoSettimana } from '../componenti/CardPasto'
import { dati, idAlternative, isCategoriaConId, isTipoGiornata } from '../dati'

type Props = {
  data: string
  /** Ora corrente (HH:MM), solo se `data` è oggi: serve a evidenziare il pasto corrente. */
  ora: string | null
  /** Giorno passato: resta modificabile (si segna dopo). */
  passato?: boolean
}

export function Oggi({ data, ora, passato = false }: Props) {
  const trovato = cercaGiorno(data)
  const { stato, scegli, segnaConsumato, annota, pastoLibero, ripristinaPasto, dolce } = useStatoGiorno(data)
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
  // Solo i pasti spuntati: cresce in tempo reale man mano che si mangia.
  const consumati = totaliPasti(voci.filter((v) => stato.consumati.includes(v.categoria)))

  // Pranzi e cene della settimana (con sostituzioni salvate, senza i pasti liberi)
  // per i contatori dei vincoli settimanali (pesce grasso, formaggio, carne).
  const pastiEffettivi = (g: typeof giorno): PastiDelGiorno => pastiEffettiviDi(g, g.data === data ? stato : statiAltri[g.data])
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

      <div className="mt-4">
        <RiepilogoGiornata
          piano={{ kcal: giorno.kcal, cho: giorno.cho, proteine: proteineDelPiano(giorno), grassi: grassiDelPiano(giorno) }}
          consumati={consumati}
          liberiSenzaValori={consumati.pastiLiberi.length}
        />
      </div>

      {giorno.gelCho > 0 && (
        <p className="mt-3 rounded-xl border border-bordo bg-superficie p-3 text-sm">
          <span className="font-semibold">Gel in corsa: </span>
          <span className="font-bold text-cho">{formatNumero(giorno.gelCho)} g CHO</span>
          <span className="opacity-70"> · non inclusi nei totali</span>
        </p>
      )}

      {giorno.ricarica && (
        <section className="mt-3 rounded-xl border-2 border-cho p-3 text-sm">
          <p className="font-semibold">Ricarica: {dati.regole.sabatoRicarica.motivo}</p>
          <p className="mt-1">{dati.regole.sabatoRicarica.effetto}</p>
        </section>
      )}

      {giorno.note && <p className="mt-3 text-sm opacity-80">{giorno.note}</p>}

      <section className="mt-5 space-y-3">
        {voci.map((voce, i) => {
          const giornata = {
            tipo: giorno.tipo,
            ricarica: !!giorno.ricarica,
            senzaQuesto: totaliSenza(voci, voce.categoria),
            piano: { cho: giorno.cho, kcal: giorno.kcal },
            merendaStimata:
              voce.categoria !== 'merenda' && voci.some((v) => v.categoria === 'merenda' && !v.pasto && v.libero === undefined),
            liberiSenzaValori: totaliPasti(voci.filter((v) => v.categoria !== voce.categoria)).pastiLiberi.length,
          }
          const settimanaDelPasto =
            voce.categoria === 'cena' ? contesto : voce.categoria === 'pranzo' ? { ...contesto, promemoriaSera: [] } : undefined
          const categoria = voce.categoria
          return voce.libero !== undefined ? (
            <CardPastoLibero
              key={voce.categoria}
              voce={voce}
              etichetta={etichettePasti[voce.categoria]}
              consumato={stato.consumati.includes(voce.categoria)}
              onConsumato={(consumato) => segnaConsumato(voce.categoria, consumato)}
              onSalva={(libero) => pastoLibero(voce.categoria, libero)}
              onRipristina={ripristinaPasto}
              calcolatore={
                isCategoriaConId(categoria)
                  ? {
                      nomeCategoria: etichettePasti[categoria].toLowerCase(),
                      idCategoria: idAlternative(categoria),
                      giornata,
                      contestoAvvisi: {
                        categoria,
                        tipoGiorno: giorno.tipo,
                        tipoDomani: settimanaDelPasto?.tipoDomani,
                        conteggiAltri: settimanaDelPasto?.conteggiAltri,
                      },
                    }
                  : undefined
              }
            />
          ) : (
          <CardPasto
            key={voce.categoria}
            voce={voce}
            corrente={i === corrente}
            consumato={stato.consumati.includes(voce.categoria)}
            tipoGiorno={giorno.tipo}
            settimana={settimanaDelPasto}
            nota={stato.note?.[voce.categoria]}
            giornata={giornata}
            onAnnota={(testo) => annota(voce.categoria, testo)}
            onConsumato={(consumato) => segnaConsumato(voce.categoria, consumato)}
            onScegli={(id) => {
              if (isCategoriaConId(voce.categoria)) scegli(voce.categoria, id, voce.idPiano, id !== null && !futuro)
            }}
            onLibero={(libero) => pastoLibero(voce.categoria, libero, !futuro)}
            onDolce={voce.categoria === 'pranzo' || voce.categoria === 'cena' ? (id) => dolce(voce.categoria, id) : undefined}
          />
          )
        })}
      </section>

    </>
  )
}
