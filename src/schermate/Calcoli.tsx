// Pagina Calcoli: spiega i criteri con cui l'app propone la settimana.
// È generata dalle regole di dati.json, così dice sempre quello che l'app fa davvero.
import type { ReactNode } from 'react'
import { descriviQuando } from '../condizioni'
import { dati, isTipoGiornata } from '../dati'
import { formatNumero } from '../formato'
import { merendaMedia } from '../giornata'

const { regole } = dati

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-bordo bg-superficie p-4">
      <h2 className="text-lg font-bold">{titolo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Elenco({ voci }: { voci: { esito: ReactNode; quando: unknown; nota?: string }[] }) {
  return (
    <ol className="space-y-1.5">
      {voci.map((voce, i) => (
        <li key={i} className="flex gap-2">
          <span className="w-5 shrink-0 text-right font-semibold opacity-50">{i + 1}.</span>
          <span>
            <span className="font-semibold">{voce.esito}</span> se {descriviQuando(voce.quando)}
            {voce.nota && <span className="opacity-70"> — {voce.nota}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Tipo({ tipo }: { tipo: string }) {
  const info = isTipoGiornata(tipo) ? dati.tipiGiornata[tipo] : null
  return (
    <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: info?.colore }}>
      {tipo}
    </span>
  )
}

const Nota = ({ children }: { children: ReactNode }) => <p className="opacity-70">{children}</p>

export function Calcoli() {
  const testo = regole.riconoscimentoTesto
  const a = regole.assegnazionePasti
  const media = merendaMedia()

  return (
    <>
      <h1 className="text-xl font-bold">Calcoli</h1>
      <p className="mt-1 text-sm opacity-70">
        Come l'app propone la giornata alimentare quando inserisci una nuova settimana. Per ogni scelta si
        applica la prima regola dell'elenco che corrisponde. La proposta resta sempre modificabile a mano.
      </p>

      <div className="mt-4 space-y-3">
        <Sezione titolo="Tipo di giornata">
          <Elenco
            voci={[...regole.classificazioneGiornata]
              .sort((x, y) => x.priorita - y.priorita)
              .map((r) => ({ esito: <Tipo tipo={r.tipo} />, quando: r.quando }))}
          />
          <Nota>{regole.classificazioneNota}</Nota>
          <p>
            <span className="font-semibold">Dal testo dell'allenamento</span> si riconosce la qualità dalle parole{' '}
            {testo.paroleQualita.map((p) => `«${p}»`).join(', ')}, e una progressiva (
            {testo.paroleProgressiva.map((p) => `«${p}»`).join(', ')}) conta come qualità solo da{' '}
            {testo.progressivaLungaKmMin} km in su. Il riposo è un allenamento vuoto o con la parola{' '}
            {testo.paroleRiposo.map((p) => `«${p}»`).join(', ')}.
          </p>
          <Nota>{testo.nota}</Nota>
        </Sezione>

        <Sezione titolo="ROSSO pesante">
          <p>
            Un giorno è <span className="font-semibold">ROSSO pesante</span> se {descriviQuando(regole.rossoPesante.quando)}.
            Serve a decidere la colazione e il sabato di ricarica del giorno prima.
          </p>
          <p>
            La domenica con almeno {regole.lungoDomenicaleAutomatico.distanzaKmMin} km è proposta come{' '}
            <span className="font-semibold">lungo domenicale</span> (si può cambiare a mano).
          </p>
        </Sezione>

        <Sezione titolo="Colazione">
          <Elenco voci={regole.sceltaColazione.map((r) => ({ esito: r.colazione, quando: r.quando }))} />
        </Sezione>

        <Sezione titolo="Spuntino delle 10:30">
          <Elenco
            voci={regole.sceltaSpuntino.map((r) => ({
              esito: r.spuntino === 'soloFrutto' ? 'solo frutto' : r.spuntino,
              quando: r.quando,
            }))}
          />
        </Sezione>

        <Sezione titolo="Spuntino serale">
          <Elenco
            voci={regole.spuntinoSerale.map((r) => ({
              esito: r.valore ? ('obbligatorio' in r && r.obbligatorio ? 'sì, obbligatorio' : 'sì') : 'no',
              quando: r.quando,
              nota: 'motivo' in r ? r.motivo : undefined,
            }))}
          />
        </Sezione>

        <Sezione titolo="Gel in corsa">
          <Elenco
            voci={regole.gelInCorsa.map((r) => ({
              esito: `${r.grammiChoPerOra} g CHO/ora`,
              quando: r.quando,
              nota: 'nota' in r ? r.nota : undefined,
            }))}
          />
          <Nota>{regole.gelNota}</Nota>
          <p>I CHO dei gel non entrano mai nei totali del giorno.</p>
        </Sezione>

        <Sezione titolo="Sabato di ricarica">
          <p>
            Scatta se {descriviQuando(regole.sabatoRicarica.quando)}: {regole.sabatoRicarica.effetto}.
          </p>
          <Nota>Perché: {regole.sabatoRicarica.motivo}.</Nota>
          <p>
            Nei giorni di riposo la merenda è {dati.merendaRidotta.id} ({dati.merendaRidotta.composizione}).
          </p>
        </Sezione>

        <Sezione titolo="Pranzi e cene">
          <p>
            Pranzo: <span className="font-semibold">{a.pranzo}</span>, nella versione maggiorata nei giorni{' '}
            {a.maggioratoNeiGiorni.join(', ')} se esiste, ridotta nei giorni di riposo e piena nel sabato di
            ricarica.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {a.ceneDistribuite.map((c) => (
              <li key={c.cena}>
                <span className="font-semibold">{c.cena}</span> {c.volte} volte a settimana
                {c.nonConsecutive && ', mai in due giorni di fila'}, preferendo i giorni {c.preferenzaTipi.join(', ')}{' '}
                (prima il lungo domenicale)
              </li>
            ))}
            <li>
              gli altri giorni a rotazione tra <span className="font-semibold">{a.ceneARotazione.join(' e ')}</span>
            </li>
            <li>nei giorni di riposo la cena è ridotta (se non esiste la versione ridotta: {a.cenaRidottaDiRiserva})</li>
          </ul>
        </Sezione>

        <Sezione titolo="Totale del piano">
          <p>
            È la somma dei pasti del giorno. Se la merenda non è assegnata si aggiunge la media delle merende M1-M
            {dati.merende.length}: {formatNumero(media.cho)} g CHO e {formatNumero(media.kcal)} kcal.
          </p>
        </Sezione>

        <Sezione titolo="Giornata libera">
          <p>
            Il riepilogo del giorno è pollice verso, a meno che tutti i pasti liberi abbiano kcal, CHO e proteine e il
            totale resti entro ±{regole.giornataLibera.tolleranzaPercento}% da quello dei pasti del piano: allora conta
            come rispettata.
          </p>
        </Sezione>

        <Sezione titolo="Vincoli della settimana">
          <ul className="list-disc space-y-1 pl-5">
            {regole.vincoliSettimanali.map((v) => (
              <li key={v.id}>
                <span className="font-semibold first-letter:uppercase">{v.regola}</span>
                {v.motivo && <span className="opacity-70"> — {v.motivo}</span>}
              </li>
            ))}
          </ul>
        </Sezione>
      </div>
    </>
  )
}
