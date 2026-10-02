// Motore delle regole (SPEC.md §4): dagli allenamenti di una settimana propone tipo
// giornata, colazione, spuntino, spuntino serale, gel, merenda, pranzo e cena.
// Tutte le soglie e le scelte vengono da dati.json (regole); qui c'è solo come applicarle.
// Non importa dati.json: riceve i dati come parametro, così si prova anche con Node.
import { descriviQuando, valutaQuando, type Contesto } from './condizioni.ts'
import type { Dati } from './tipi/dati.generati'

/** Quello che si inserisce per ogni giorno nella schermata Nuova settimana. */
export type GiornoInserito = {
  data: string
  allenamento: string
  distanzaKm: number
  durataMinuti: number | null
  minutiSopraRitmoMedio: number
  lungoDomenicale: boolean
}

/** Un giorno proposto: stessa forma dei giorni di dati.json, esclusi i totali. */
export type GiornoProposto = {
  data: string
  allenamento: string
  distanzaKm: number
  tipo: string
  colazione: string
  spuntino: string
  pranzo: string
  cena: string
  merenda: string | null
  spuntinoSerale: boolean
  gelCho: number
  ricarica?: boolean
  lungoDomenicale?: boolean
}

export type Scelta =
  | 'tipo'
  | 'colazione'
  | 'spuntino'
  | 'spuntinoSerale'
  | 'gel'
  | 'ricarica'
  | 'merenda'
  | 'pranzo'
  | 'cena'

export type Proposta = {
  giorni: GiornoProposto[]
  /** Per ogni giorno, il perché di ogni scelta (per la schermata e per i Calcoli). */
  motivi: Partial<Record<Scelta, string>>[]
  avvisi: string[]
}

function contieneParola(testo: string, parole: string[]): boolean {
  return parole.some((parola) => new RegExp(`\\b${parola}`, 'i').test(testo))
}

/** Cosa si capisce dal testo libero dell'allenamento. */
export function leggiTesto(dati: Dati, allenamento: string, distanzaKm: number) {
  const r = dati.regole.riconoscimentoTesto
  const testo = allenamento.trim()
  return {
    riposo: testo === '' || contieneParola(testo, r.paroleRiposo),
    qualitaNelTesto:
      contieneParola(testo, r.paroleQualita) ||
      (contieneParola(testo, r.paroleProgressiva) && distanzaKm >= r.progressivaLungaKmMin),
  }
}

/** La prima regola dell'elenco la cui condizione è vera (l'ultima ha sempre "sempre"). */
function prima<T extends { quando: unknown }>(regole: T[], contesto: Contesto): T {
  return regole.find((r) => valutaQuando(r.quando, contesto)) ?? regole[regole.length - 1]
}

export function proponiSettimana(dati: Dati, inseriti: GiornoInserito[]): Proposta {
  const { regole } = dati
  const avvisi: string[] = []
  const motivi: Proposta['motivi'] = inseriti.map(() => ({}))

  // 1. Tipo di giornata.
  const classificazione = [...regole.classificazioneGiornata].sort((a, b) => a.priorita - b.priorita)
  const contesti: Contesto[] = inseriti.map((g, i) => {
    const contesto: Contesto = {
      tipo: '',
      distanzaKm: g.distanzaKm,
      durataMinuti: g.durataMinuti,
      minutiSopraRitmoMedio: g.minutiSopraRitmoMedio,
      lungoDomenicale: g.lungoDomenicale,
      domaniRossoPesante: false,
      ...leggiTesto(dati, g.allenamento, g.distanzaKm),
    }
    const regola = prima(classificazione, contesto)
    contesto.tipo = regola.tipo
    motivi[i].tipo = descriviQuando(regola.quando)
    return contesto
  })

  // 2. "ROSSO pesante" del giorno dopo (serve a colazione RID e sabato di ricarica).
  const pesante = contesti.map((c) => valutaQuando(regole.rossoPesante.quando, c))
  contesti.forEach((c, i) => (c.domaniRossoPesante = pesante[i + 1] ?? false))

  // 3. Scelte giorno per giorno.
  const giorni: GiornoProposto[] = inseriti.map((g, i) => {
    const c = contesti[i]
    const m = motivi[i]

    const colazione = prima(regole.sceltaColazione, c)
    m.colazione = descriviQuando(colazione.quando)

    const spuntino = prima(regole.sceltaSpuntino, c)
    m.spuntino = descriviQuando(spuntino.quando)

    const serale = prima(regole.spuntinoSerale, c)
    m.spuntinoSerale =
      descriviQuando(serale.quando) + ('motivo' in serale && serale.motivo ? ` — ${serale.motivo}` : '')

    const gel = prima(regole.gelInCorsa, c)
    let gelCho = 0
    if (gel.grammiChoPerOra > 0) {
      if (g.durataMinuti === null) {
        avvisi.push(`${g.data}: inserisci la durata per calcolare il gel (${gel.grammiChoPerOra} g/ora)`)
      } else {
        const unita = regole.gelGrammiPerUnita
        gelCho = Math.ceil((gel.grammiChoPerOra * g.durataMinuti) / 60 / unita) * unita
      }
    }
    m.gel = `${gel.grammiChoPerOra} g/ora: ${descriviQuando(gel.quando)}`

    const ricarica = valutaQuando(regole.sabatoRicarica.quando, c)
    if (ricarica) m.ricarica = regole.sabatoRicarica.motivo

    const merendaRidotta = valutaQuando(dati.merendaRidotta.quando, c)
    m.merenda = merendaRidotta ? descriviQuando(dati.merendaRidotta.quando) : 'da scegliere nel giorno'

    return {
      data: g.data,
      allenamento: g.allenamento,
      distanzaKm: g.distanzaKm,
      tipo: c.tipo,
      colazione: colazione.colazione,
      spuntino: spuntino.spuntino,
      pranzo: '',
      cena: '',
      merenda: merendaRidotta ? dati.merendaRidotta.id : null,
      spuntinoSerale: serale.valore,
      gelCho,
      ...(ricarica ? { ricarica: true } : {}),
      ...(g.lungoDomenicale ? { lungoDomenicale: true } : {}),
    }
  })

  assegnaPasti(dati, giorni, motivi)
  return { giorni, motivi, avvisi }
}

function assegnaPasti(dati: Dati, giorni: GiornoProposto[], motivi: Proposta['motivi']) {
  const a = dati.regole.assegnazionePasti
  const grigio = (g: GiornoProposto) => g.tipo === 'GRIGIO'
  const versioneGrigio = (g: GiornoProposto) => (g.ricarica ? a.ricarica : a.giornoGrigio)

  // Pranzo: quello di base, maggiorato nei giorni indicati, ridotto nei GRIGIO non di ricarica.
  const pranzo = dati.pranzi.find((p) => p.id === a.pranzo)
  giorni.forEach((g, i) => {
    g.pranzo = a.pranzo
    motivi[i].pranzo = `${a.pranzo} di base`
    if (pranzo?.maggiorato && a.maggioratoNeiGiorni.includes(g.tipo)) {
      g.pranzo = pranzo.maggiorato.id
      motivi[i].pranzo = `maggiorato nei giorni ${a.maggioratoNeiGiorni.join(', ')}`
    }
    if (grigio(g) && versioneGrigio(g).pranzo === 'ridotto' && pranzo?.ridotto) {
      g.pranzo = pranzo.ridotto.id
      motivi[i].pranzo = 'ridotto nei giorni di riposo'
    }
    if (grigio(g) && g.ricarica) motivi[i].pranzo = 'pieno: sabato di ricarica'
  })

  // Cene con un numero di volte a settimana (C2, C4), poi le altre a rotazione.
  const cene: (string | null)[] = giorni.map(() => null)
  for (const distribuita of a.ceneDistribuite) {
    const ammessi = dati.cene.find((c) => c.id === distribuita.cena)?.soloTipiGiornata
    const ordine = giorni
      .map((g, i) => ({ g, i }))
      .filter(({ g }) => distribuita.preferenzaTipi.includes(g.tipo) && (!ammessi || ammessi.includes(g.tipo)))
      .sort(
        (x, y) =>
          Number(!!y.g.lungoDomenicale) - Number(!!x.g.lungoDomenicale) ||
          distribuita.preferenzaTipi.indexOf(x.g.tipo) - distribuita.preferenzaTipi.indexOf(y.g.tipo) ||
          x.i - y.i,
      )
    let assegnate = 0
    for (const { i } of ordine) {
      if (assegnate >= distribuita.volte) break
      if (cene[i] !== null) continue
      if (distribuita.nonConsecutive && (cene[i - 1] === distribuita.cena || cene[i + 1] === distribuita.cena)) continue
      cene[i] = distribuita.cena
      motivi[i].cena = `${distribuita.cena} ${distribuita.volte} volte a settimana, preferendo i giorni ${distribuita.preferenzaTipi.join(', ')}`
      assegnate++
    }
  }
  let turno = 0
  giorni.forEach((_, i) => {
    if (cene[i] !== null) return
    cene[i] = a.ceneARotazione[turno++ % a.ceneARotazione.length]
    motivi[i].cena = `a rotazione tra ${a.ceneARotazione.join(' e ')}`
  })

  giorni.forEach((g, i) => {
    let cena = cene[i] as string
    if (grigio(g) && versioneGrigio(g).cena === 'ridotto') {
      cena = dati.cene.find((c) => c.id === cena)?.ridotto?.id ?? a.cenaRidottaDiRiserva
      motivi[i].cena = `ridotta nei giorni di riposo (${motivi[i].cena})`
    }
    g.cena = cena
  })
}

/** Cosa cambia segnando il lungo domenicale, letto dalle regole (per spiegarlo nel modulo). */
export function effettiLungoDomenicale(dati: Dati): { colazione: string; gelPerOra: number } {
  const contesto: Contesto = {
    tipo: 'ROSSO',
    distanzaKm: 0,
    durataMinuti: null,
    minutiSopraRitmoMedio: 0,
    lungoDomenicale: true,
    qualitaNelTesto: false,
    riposo: false,
    domaniRossoPesante: false,
  }
  return {
    colazione: prima(dati.regole.sceltaColazione, contesto).colazione,
    gelPerOra: prima(dati.regole.gelInCorsa, contesto).grammiChoPerOra,
  }
}
