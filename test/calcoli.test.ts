// Test dei calcoli che decidono cosa e quanto si mangia (CHO per il bolo, kcal, target).
// Girano dentro `npm run build`: se uno fallisce, l'app non viene pubblicata.
// I valori attesi sono ricavati a mano da dati.json, non copiati dall'output dell'app.
import { describe, expect, it } from 'vitest'
import { dati, idAlternative, trovaPasto, type CategoriaConId } from '../src/dati'
import {
  cercaGiorno,
  esitoGiorno,
  giornataEquivalente,
  merendaMedia,
  targetGiorno,
  totaliPasti,
  totaliSenza,
  valutaAlternativa,
  vociDelGiorno,
} from '../src/giornata'
import { proponiSettimana, type GiornoInserito } from '../src/motore'
import { verificaDati } from '../src/verifica'
import { formatScarto } from '../src/formato'
import { conteggiVincoli, controllaVincoli } from '../src/vincoli'

function giorno(data: string) {
  const trovato = cercaGiorno(data)
  if (!trovato) throw new Error(`giorno ${data} non trovato nel piano`)
  return trovato.giorno
}

describe('dati.json', () => {
  it('è coerente (codici dei pasti, regole, vincoli)', () => {
    expect(verificaDati(dati)).toEqual([])
  })
})

describe('valori dei pasti: quelli mostrati sono quelli di dati.json', () => {
  const categorie: CategoriaConId[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena']

  it('ogni alternativa ha CHO e kcal validi', () => {
    for (const categoria of categorie) {
      for (const id of idAlternative(categoria)) {
        const pasto = trovaPasto(categoria, id)
        expect(pasto, `${categoria} ${id}`).not.toBeNull()
        expect(Number.isFinite(pasto!.cho) && pasto!.cho >= 0, `${id} cho`).toBe(true)
        expect(Number.isFinite(pasto!.kcal) && pasto!.kcal > 0, `${id} kcal`).toBe(true)
      }
    }
  })

  it.each([
    ['colazione', 'STD', 90, 700],
    ['colazione', 'MAGG', 121, 840],
    ['colazione', 'RID', 62, 590],
    ['colazione', 'B1', 95, 680],
    ['colazione', 'B1+', 125, 822],
    ['colazione', 'B1rid', 71, 562],
    ['pranzo', 'P1', 154, 1030],
    ['pranzo', 'P1rid', 104, 790],
    ['pranzo', 'P3+', 133, 1130],
    ['pranzo', 'P8-fiocchi', 150, 1090],
    ['cena', 'C1rid', 64, 640],
    ['cena', 'C3', 79, 770],
    ['cena', 'C3+', 99, 870],
    ['merenda', 'M2', 62, 360],
    ['merenda', 'Mrid', 18, 160],
  ] as const)('%s %s: %i g CHO, %i kcal', (categoria, id, cho, kcal) => {
    const pasto = trovaPasto(categoria, id)
    expect(pasto?.cho).toBe(cho)
    expect(pasto?.kcal).toBe(kcal)
  })

  it('le versioni ridotte e maggiorate hanno i grammi giusti', () => {
    const alimento = (categoria: CategoriaConId, id: string, nome: string) =>
      trovaPasto(categoria, id)?.alimenti.find((a) => a.nome === nome)
    expect(alimento('pranzo', 'P1rid', 'Pasta')).toMatchObject({ grammi: 80, grammiBase: 120 })
    expect(alimento('pranzo', 'P1rid', 'Pane')).toMatchObject({ rimosso: true })
    expect(alimento('pranzo', 'P3+', 'Patate')).toMatchObject({ grammi: 450, grammiBase: 350 })
    expect(alimento('cena', 'C3+', 'Pane')).toMatchObject({ grammi: 140, grammiBase: 100 })
    expect(alimento('cena', 'C1rid', 'Patate')).toMatchObject({ grammi: 200, grammiBase: 300 })
  })

  it('le colazioni sanno a che tipo appartengono', () => {
    expect(trovaPasto('colazione', 'B4')?.tipoColazione).toBe('STD')
    expect(trovaPasto('colazione', 'B4+')?.tipoColazione).toBe('MAGG')
    expect(trovaPasto('colazione', 'B4rid')?.tipoColazione).toBe('RID')
  })
})

describe('totali della giornata', () => {
  it('lunedì 5 ottobre: 368 g CHO e 2755 kcal di pasti, merenda da scegliere', () => {
    const totali = totaliPasti(vociDelGiorno(giorno('2026-10-05')))
    expect(totali.cho).toBe(368)
    expect(totali.kcal).toBe(2755)
    expect(totali.pastiMancanti).toEqual(['merenda'])
  })

  it('venerdì 9 ottobre con C3+: 415 g CHO e 3265 kcal', () => {
    const totali = totaliPasti(vociDelGiorno(giorno('2026-10-09')))
    expect(totali.cho).toBe(415)
    expect(totali.kcal).toBe(3265)
  })

  it('sabato 10 ottobre (GRIGIO): niente pre-corsa, 346 g CHO e 2625 kcal', () => {
    const voci = vociDelGiorno(giorno('2026-10-10'))
    expect(voci.some((v) => v.categoria === 'preCorsa')).toBe(false)
    const totali = totaliPasti(voci)
    expect(totali.cho).toBe(346)
    expect(totali.kcal).toBe(2625)
  })

  it('una merenda scelta entra nel totale', () => {
    const totali = totaliPasti(vociDelGiorno(giorno('2026-10-05'), { merenda: 'M2' }))
    expect(totali.cho).toBe(368 + 62)
    expect(totali.pastiMancanti).toEqual([])
  })

  it('i consumati finora sommano solo i pasti spuntati', () => {
    const voci = vociDelGiorno(giorno('2026-10-05')).filter((v) => ['preCorsa', 'colazione'].includes(v.categoria))
    expect(totaliPasti(voci).cho).toBe(25 + 90)
  })

  it('il gel non entra mai nei totali', () => {
    // Domenica 11: 160 g di gel nel piano, che non devono comparire nella somma dei pasti.
    const totali = totaliPasti(vociDelGiorno(giorno('2026-10-11')))
    expect(totali.cho).toBe(422)
  })

  it('merenda media (stima del piano): 57 g CHO e 368 kcal', () => {
    expect(merendaMedia()).toEqual({ cho: 57, kcal: 368 })
  })
})

describe('target quando si cambia un pasto', () => {
  const target = targetGiorno({ cho: 426, kcal: 3110 })

  it('piano 426 g CHO / 3110 kcal: nel target da 405 a 447 g e da 2955 a 3266 kcal', () => {
    expect(target.cho).toEqual({ piano: 426, da: 405, a: 447 })
    expect(target.kcal).toEqual({ piano: 3110, da: 2955, a: 3266 })
  })

  it('i bordi della fascia sono inclusi', () => {
    expect(valutaAlternativa({ cho: 0, kcal: 3000 }, { cho: 405, kcal: 0 }, target).choDentro).toBe(true)
    expect(valutaAlternativa({ cho: 0, kcal: 3000 }, { cho: 404, kcal: 0 }, target).choDentro).toBe(false)
    expect(valutaAlternativa({ cho: 0, kcal: 3000 }, { cho: 448, kcal: 0 }, target).choDentro).toBe(false)
  })

  it('serve stare dentro sia con i CHO sia con le kcal', () => {
    const fuoriKcal = valutaAlternativa({ cho: 300, kcal: 2000 }, { cho: 126, kcal: 100 }, target)
    expect(fuoriKcal.choDentro).toBe(true)
    expect(fuoriKcal.nelTarget).toBe(false)
  })

  describe('pranzo di lunedì 5 ottobre (piano P2)', () => {
    const voci = vociDelGiorno(giorno('2026-10-05'))
    const senza = totaliSenza(voci, 'pranzo')

    it('senza pranzo: 277 g CHO e 2093 kcal (merenda stimata compresa)', () => {
      expect(senza).toEqual({ cho: 368 - 148 + 57, kcal: 2755 - 1030 + 368 })
    })

    it.each([
      ['P2', 425, true],
      ['P1', 431, true],
      ['P3', 385, false],
      ['P4', 402, false],
      ['P8', 457, false],
    ] as const)('%s porta la giornata a %i g CHO (nel target: %s)', (id, cho, nel) => {
      const risultato = valutaAlternativa(senza, trovaPasto('pranzo', id)!, target)
      expect(risultato.cho).toBe(cho)
      expect(risultato.nelTarget).toBe(nel)
    })
  })
})

describe('giornata libera', () => {
  const lunedi = giorno('2026-10-05')
  const libera = (pranzo: object) => ({ scelte: {}, consumati: [], sgarro: true, liberi: { pranzo } })

  it('pasto libero con valori vicini al piano: equivalente', () => {
    expect(giornataEquivalente(lunedi, libera({ testo: 'poke', kcal: 1050, cho: 150, proteine: 40 }))).toBe(true)
  })

  it('pasto libero con troppi pochi CHO: non equivalente', () => {
    expect(giornataEquivalente(lunedi, libera({ testo: 'insalata', kcal: 1030, cho: 120, proteine: 40 }))).toBe(false)
  })

  it('pasto libero senza valori: non equivalente (CHO non noti)', () => {
    expect(giornataEquivalente(lunedi, libera({ testo: 'pizza' }))).toBe(false)
  })

  it('esito: libera non equivalente = non rispettato', () => {
    expect(esitoGiorno(lunedi, libera({ testo: 'pizza' })).esito).toBe('nonRispettato')
  })
})

describe('cena del 6 ottobre (piano 424 g CHO · 3240 kcal, cena C2)', () => {
  const martedi = giorno('2026-10-06')
  const voci = vociDelGiorno(martedi)
  const target = targetGiorno({ cho: martedi.cho, kcal: martedi.kcal })
  // Senza cena: pre-corsa 25 + STD 90 + spuntino intero 22 + P1 154 + merenda media 57 = 348 g;
  // 110 + 700 + 255 + 1030 + 368 = 2463 kcal.
  const senza = totaliSenza(voci, 'cena')

  it('gli altri pasti fanno 348 g CHO e 2463 kcal', () => {
    expect(senza).toEqual({ cho: 348, kcal: 2463 })
  })
  it('target: 403–445 g CHO e 3078–3402 kcal', () => {
    expect([target.cho.da, target.cho.a, target.kcal.da, target.kcal.a]).toEqual([403, 445, 3078, 3402])
  })
  it('con C2 del piano: 423 g e 3253 kcal, nel target', () => {
    expect(valutaAlternativa(senza, trovaPasto('cena', 'C2')!, target)).toMatchObject({ cho: 423, kcal: 3253, nelTarget: true })
  })
  it('C10 (70 g, 779 kcal: 5 g e 11 kcal in meno di C2): 418 g e 3242 kcal, nel target', () => {
    expect(valutaAlternativa(senza, trovaPasto('cena', 'C10')!, target)).toMatchObject({ cho: 418, kcal: 3242, nelTarget: true })
  })
  it('se gli altri pasti salgono a 379 g, anche C10 (−5 g) porta la giornata a 449 g: fuori target', () => {
    const r = valutaAlternativa({ cho: 379, kcal: 2439 }, trovaPasto('cena', 'C10')!, target)
    expect(r).toMatchObject({ cho: 449, kcal: 3218, choDentro: false, kcalDentro: true, nelTarget: false })
  })
})

describe('differenze scritte a parole', () => {
  it.each([
    [25, 'g', '25 g in più'],
    [-5, 'g', '5 g in meno'],
    [-22, 'kcal', '22 kcal in meno'],
    [0, 'kcal', 'uguale'],
  ] as const)('%i %s → %s', (differenza, unita, atteso) => {
    expect(formatScarto(differenza, unita)).toBe(atteso)
  })
})

describe('pasto libero scelto in un giorno normale (5 ottobre)', () => {
  const lunedi = giorno('2026-10-05')
  const tutti = vociDelGiorno(lunedi).map((v) => v.categoria)
  const conPranzo = (pranzo: object) => ({ scelte: { merenda: 'M2' }, consumati: tutti, liberi: { pranzo } })

  it('conta come pasto spuntato', () => {
    const r = esitoGiorno(lunedi, conPranzo({ testo: 'poke', kcal: 1050, cho: 150, proteine: 40 }))
    expect(r.fatti).toBe(r.totali)
  })
  it('valori vicini al piano (P2 148 g → poke 150 g): rispettato', () => {
    expect(esitoGiorno(lunedi, conPranzo({ testo: 'poke', kcal: 1050, cho: 150, proteine: 40 })).esito).toBe('rispettato')
  })
  it('CHO troppo bassi (120 g al posto di 148): non rispettato', () => {
    expect(esitoGiorno(lunedi, conPranzo({ testo: 'insalata', kcal: 1030, cho: 120, proteine: 40 })).esito).toBe('nonRispettato')
  })
  it('senza valori (CHO ND): non rispettato', () => {
    expect(esitoGiorno(lunedi, conPranzo({ testo: 'pizza' })).esito).toBe('nonRispettato')
  })
  // Piano 368 g + merenda media 57 = 425 g (tolleranza 404–446); 2755 + 368 = 3123 kcal.
  it('merenda libera 60 g / 360 kcal (giornata 428 g, 3115 kcal): rispettato', () => {
    const stato = { scelte: {}, consumati: tutti, liberi: { merenda: { testo: 'yogurt e miele', kcal: 360, cho: 60, proteine: 12 } } }
    expect(esitoGiorno(lunedi, stato).esito).toBe('rispettato')
  })
  it('merenda libera 150 g / 900 kcal (giornata 518 g): non rispettato', () => {
    const stato = { scelte: {}, consumati: tutti, liberi: { merenda: { testo: 'pasticceria', kcal: 900, cho: 150, proteine: 12 } } }
    expect(esitoGiorno(lunedi, stato).esito).toBe('nonRispettato')
  })
})

describe('riepilogo del giorno', () => {
  const lunedi = giorno('2026-10-05')
  const tutti = vociDelGiorno(lunedi).map((v) => v.categoria)

  it('nessun pasto spuntato: non dichiarato', () => {
    expect(esitoGiorno(lunedi, { scelte: {}, consumati: [] }).esito).toBe('nonDichiarato')
  })
  it('alcuni pasti spuntati: non rispettato', () => {
    expect(esitoGiorno(lunedi, { scelte: {}, consumati: ['colazione'] }).esito).toBe('nonRispettato')
  })
  it('tutti spuntati, merenda scelta: rispettato', () => {
    expect(esitoGiorno(lunedi, { scelte: { merenda: 'M2' }, consumati: tutti }).esito).toBe('rispettato')
  })
  it('tutti spuntati ma merenda non scelta: non rispettato', () => {
    expect(esitoGiorno(lunedi, { scelte: {}, consumati: tutti }).esito).toBe('nonRispettato')
  })
})

describe('motore delle regole', () => {
  const settimana4 = dati.settimane.find((s) => s.numero === 4)!
  const durate: Record<string, [number | null, number]> = {
    '2026-09-28': [80, 0],
    '2026-09-29': [78, 10],
    '2026-09-30': [90, 60],
    '2026-10-01': [80, 0],
    '2026-10-02': [62, 18],
    '2026-10-03': [null, 0],
    '2026-10-04': [112, 45],
  }
  const inseriti: GiornoInserito[] = settimana4.giorni.map((g) => ({
    data: g.data,
    allenamento: g.allenamento,
    distanzaKm: g.distanzaKm,
    durataMinuti: durate[g.data][0],
    minutiSopraRitmoMedio: durate[g.data][1],
    lungoDomenicale: !!g.lungoDomenicale,
  }))
  const proposta = proponiSettimana(dati, inseriti)

  it.each(['tipo', 'colazione', 'spuntinoSerale', 'merenda'] as const)(
    'settimana 4: %s uguale al nutrizionista in tutti i 7 giorni',
    (campo) => {
      proposta.giorni.forEach((g, i) => expect(g[campo], g.data).toEqual(settimana4.giorni[i][campo]))
    },
  )

  it('settimana 4: il sabato è riconosciuto come ricarica', () => {
    expect(proposta.giorni[5].ricarica).toBe(true)
  })

  it('gel: 70 g/ora per 112 minuti di lungo domenicale = 150 g (gel interi da 30 g)', () => {
    expect(proposta.giorni[6].gelCho).toBe(150)
  })

  it('gel: sotto i 75 minuti nessun gel; senza durata nessun gel e un avviso', () => {
    expect(proposta.giorni[4].gelCho).toBe(0)
    expect(proposta.giorni[5].gelCho).toBe(0)
  })

  it('15 km + 6x100 di allunghi resta VERDE; ripetute è ROSSO', () => {
    expect(proposta.giorni[0].tipo).toBe('VERDE')
    expect(proposta.giorni[2].tipo).toBe('ROSSO')
  })

  it('una seduta senza durata produce un avviso sul gel', () => {
    const p = proponiSettimana(dati, [
      { data: '2026-10-12', allenamento: 'Lungo 26 km', distanzaKm: 26, durataMinuti: null, minutiSopraRitmoMedio: 0, lungoDomenicale: true },
    ])
    expect(p.giorni[0].gelCho).toBe(0)
    expect(p.avvisi.length).toBe(1)
  })
})

describe('vincoli settimanali', () => {
  const settimana5 = dati.settimane.find((s) => s.numero === 5)!
  const piano = (g: (typeof settimana5.giorni)[number]) => ({ pranzo: g.pranzo, cena: g.cena })

  it('settimana 5: pesce grasso 3 volte, formaggio 1, carne 0, tutti rispettati', () => {
    const conteggi = conteggiVincoli(settimana5.giorni, piano)
    expect(conteggi.omega3.volte).toBe(3)
    expect(conteggi.formaggio.volte).toBe(1)
    expect(conteggi.carne.volte).toBe(0)
    expect(controllaVincoli(settimana5.giorni, {}).every((e) => e.rispettato)).toBe(true)
  })

  it('P9 a pranzo conta come pesce grasso', () => {
    const conP9 = (g: (typeof settimana5.giorni)[number]) => ({ pranzo: g.data === '2026-10-05' ? 'P9' : g.pranzo, cena: g.cena })
    expect(conteggiVincoli(settimana5.giorni, conP9).omega3.volte).toBe(4)
  })

  it('carne: P13 e C13 nella stessa settimana superano il massimo di 1', () => {
    const conCarne = (g: (typeof settimana5.giorni)[number]) => ({
      pranzo: g.data === '2026-10-05' ? 'P13' : g.pranzo,
      cena: g.data === '2026-10-08' ? 'C13' : g.cena,
    })
    const esiti = controllaVincoli(settimana5.giorni, Object.fromEntries(settimana5.giorni.map((g) => [g.data, conCarne(g)])))
    expect(esiti.find((e) => e.id === 'carne')?.rispettato).toBe(false)
  })
})
