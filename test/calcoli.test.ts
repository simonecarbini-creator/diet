// Test dei calcoli che decidono cosa e quanto si mangia (CHO per il bolo, kcal, target).
// Girano dentro `npm run build`: se uno fallisce, l'app non viene pubblicata.
// I valori attesi sono ricavati a mano da dati.json, non copiati dall'output dell'app.
import { describe, expect, it } from 'vitest'
import { dati, dolci, idAlternative, trovaPasto, type CategoriaConId } from '../src/dati'
import {
  cercaGiorno,
  esitoGiorno,
  giornataEquivalente,
  merendaMedia,
  proteineDelPiano,
  confrontoProteine,
  targetGiorno,
  totaliPasti,
  totaliSenza,
  valutaAlternativa,
  vociDelGiorno,
} from '../src/giornata'
import { proponiSettimana, type GiornoInserito } from '../src/motore'
import { verificaDati } from '../src/verifica'
import { formatScarto } from '../src/formato'
import { confrontaObiettivo, gruppiAlimenti, totaleComposto, valoriAlimento, trovaAlimento, valoriSelettore, corrisponde } from '../src/calcolatore'
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
    // P1 con la passata 200 g dal 2026-10-14: +12 g CHO e +60 kcal rispetto a prima (154 / 1030).
    ['pranzo', 'P1', 166, 1090],
    ['pranzo', 'P1rid', 116, 840],
    // P3+ corretto il 2026-10-10: +100 g di patate = +16 g CHO su P3 (108), non +25.
    ['pranzo', 'P3+', 124, 1110],
    ['pranzo', 'P2rid', 84, 730],
    ['pranzo', 'P3rid', 70, 850],
    ['pranzo', 'P8-zuppa', 167, 1130],
    ['pranzo', 'P8-fiocchi', 150, 1090],
    ['cena', 'C1rid', 64, 680],
    ['cena', 'C2rid', 50, 670],
    ['cena', 'C3', 79, 770],
    ['cena', 'C3+', 99, 870],
    ['merenda', 'M2', 62, 360],
    ['merenda', 'Mrid', 18, 155],
    ['merenda', 'Mrid-yogurt', 23, 190],
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

  // Spuntino serale predefinito SER-PB2 (27 g, 320 kcal): 2 g e 20 kcal più dello yogurt (25 g, 300 kcal).
  it('venerdì 9 ottobre con P1, C3+ e SER-PB2: 429 g CHO e 3345 kcal', () => {
    const totali = totaliPasti(vociDelGiorno(giorno('2026-10-09')))
    expect(totali.cho).toBe(429)
    expect(totali.kcal).toBe(3345)
  })

  // Mrid 155 kcal (era 160), C1rid 680 (era 640), P1 con la passata (+60): 2625 - 5 + 40 + 60 = 2720.
  it('sabato 10 ottobre (GRIGIO): niente pre-corsa, 358 g CHO e 2720 kcal', () => {
    const voci = vociDelGiorno(giorno('2026-10-10'))
    expect(voci.some((v) => v.categoria === 'preCorsa')).toBe(false)
    const totali = totaliPasti(voci)
    expect(totali.cho).toBe(358)
    expect(totali.kcal).toBe(2720)
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
    expect(totali.cho).toBe(436)
  })

  // Proteine M1-M12: 22+21+14+7+25+17+8+14+20+17+11+12 = 188 / 12 = 15,7 → 16.
  it('merenda media (stima del piano): 57 g CHO, 368 kcal, 16 g pro', () => {
    // Grassi M1-M12: 2+3+10+15+2+5+12+8+6+11+18+14 = 106 / 12 = 8,8 → 9.
    expect(merendaMedia()).toEqual({ cho: 57, kcal: 368, proteine: 16, grassi: 9 })
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
      ['P1', 443, true],
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

  // Proteine del 5 ottobre: pre-corsa 1 + STD 37 + solo frutto 1 + P2 48 + C4 39 = 126 g (±5% = ±6,3 g).
  it('pasto libero con valori vicini al piano (P2: 1030 kcal, 148 g CHO, 48 g pro): equivalente', () => {
    expect(giornataEquivalente(lunedi, libera({ testo: 'poke', kcal: 1050, cho: 150, proteine: 48 }))).toBe(true)
  })

  it('pasto libero con 8 g di proteine in meno di P2 (118 g su 126): non equivalente', () => {
    expect(giornataEquivalente(lunedi, libera({ testo: 'poke', kcal: 1050, cho: 150, proteine: 40 }))).toBe(false)
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
  // Senza cena: pre-corsa 25 + STD 90 + spuntino intero 22 + P1 166 + merenda media 57 = 360 g;
  // 110 + 700 + 255 + 1090 + 368 = 2523 kcal. Piano del giorno (con P1 e passata): 436 g, 3300 kcal.
  const senza = totaliSenza(voci, 'cena')

  it('gli altri pasti fanno 360 g CHO e 2523 kcal', () => {
    expect(senza).toEqual({ cho: 360, kcal: 2523 })
  })
  it('target: 414–458 g CHO e 3135–3465 kcal', () => {
    expect([target.cho.da, target.cho.a, target.kcal.da, target.kcal.a]).toEqual([414, 458, 3135, 3465])
  })
  it('con C2 del piano: 435 g e 3313 kcal, nel target', () => {
    expect(valutaAlternativa(senza, trovaPasto('cena', 'C2')!, target)).toMatchObject({ cho: 435, kcal: 3313, nelTarget: true })
  })
  it('C10 (70 g, 779 kcal: 5 g e 11 kcal in meno di C2): 430 g e 3302 kcal, nel target', () => {
    expect(valutaAlternativa(senza, trovaPasto('cena', 'C10')!, target)).toMatchObject({ cho: 430, kcal: 3302, nelTarget: true })
  })
  it('se gli altri pasti salgono a 391 g, anche C10 (−5 g) porta la giornata a 461 g: fuori target', () => {
    const r = valutaAlternativa({ cho: 391, kcal: 2499 }, trovaPasto('cena', 'C10')!, target)
    expect(r).toMatchObject({ cho: 461, kcal: 3278, choDentro: false, kcalDentro: true, nelTarget: false })
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
    const r = esitoGiorno(lunedi, conPranzo({ testo: 'poke', kcal: 1050, cho: 150, proteine: 48 }))
    expect(r.fatti).toBe(r.totali)
  })
  it('valori vicini al piano (P2 148 g → poke 150 g): rispettato', () => {
    expect(esitoGiorno(lunedi, conPranzo({ testo: 'poke', kcal: 1050, cho: 150, proteine: 48 })).esito).toBe('rispettato')
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

describe('sgarri (al posto di pranzo o cena)', () => {
  const lunedi = giorno('2026-10-05')
  const tutti = vociDelGiorno(lunedi).map((v) => v.categoria)

  it('S1 pizza + 1 birra si sceglie a cena: 117 g CHO, 1010 kcal, 35 g pro', () => {
    expect(idAlternative('cena')).toContain('S1')
    expect(trovaPasto('cena', 'S1')).toMatchObject({ cho: 117, kcal: 1010, proteine: 35, daSgarro: true })
  })
  it('i dolci non sono alternative di un pasto', () => {
    expect(idAlternative('cena')).not.toContain('D1')
    expect(idAlternative('pranzo')).not.toContain('D1')
  })
  // Piano con M2: 430 g CHO, 3115 kcal. Con S1 al posto di C4 (85 g, 820 kcal): 462 g e 3305 kcal,
  // oltre il 5% (tolleranza 409–452 g e 2959–3271 kcal).
  it('pizza a cena al posto di C4, tutto spuntato: non rispettato (462 g su 430)', () => {
    const r = valutaAlternativa(totaliSenza(vociDelGiorno(lunedi, { merenda: 'M2' }), 'cena'), trovaPasto('cena', 'S1')!, targetGiorno({ cho: 430, kcal: 3115 }))
    expect(r).toMatchObject({ cho: 462, kcal: 3305 })
    expect(esitoGiorno(lunedi, { scelte: { merenda: 'M2', cena: 'S1' }, consumati: tutti }).esito).toBe('nonRispettato')
  })
  it('una sostituzione normale (C10 al posto di C4), tutto spuntato: resta rispettato', () => {
    expect(esitoGiorno(lunedi, { scelte: { merenda: 'M2', cena: 'C10' }, consumati: tutti }).esito).toBe('rispettato')
  })
})

describe('proteine delle versioni ridotte e maggiorate', () => {
  it.each([
    ['pranzo', 'P1rid', 33],
    ['pranzo', 'P2rid', 40],
    ['pranzo', 'P3rid', 53],
    ['pranzo', 'P3+', 60],
    ['cena', 'C1rid', 46],
    ['cena', 'C2rid', 43],
    ['cena', 'C3+', 42],
  ] as const)('%s %s: %i g', (categoria, id, proteine) => {
    expect(trovaPasto(categoria, id)?.proteine).toBe(proteine)
  })
  it('nessun pasto del piano senza proteine', () => {
    const categorie: CategoriaConId[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena', 'spuntinoSerale']
    const senza = categorie.flatMap((c) => idAlternative(c).filter((id) => trovaPasto(c, id)?.proteine == null))
    expect(senza).toEqual([])
  })
})

describe('correzioni del 10 ottobre', () => {
  // 1 ottobre (pranzo P3+): 403 - 9 = 394 g CHO, 3240 - 20 = 3220 kcal nel calendario.
  it('1 ottobre con P3+: calendario 394 g CHO e 3220 kcal', () => {
    expect(giorno('2026-10-01')).toMatchObject({ cho: 394, kcal: 3220 })
  })
  it('P8-zuppa senza olio aggiunto e P8-fiocchi senza la nota della zuppa', () => {
    expect(trovaPasto('pranzo', 'P8-zuppa')?.alimenti.map((a) => a.nome)).not.toContain('Olio EVO')
    expect(trovaPasto('pranzo', 'P8-fiocchi')?.alimenti.some((a) => a.note?.includes('zuppa di ceci pronta'))).toBe(false)
  })
})

describe('versioni calcolate il 10 ottobre (prima solo nel testo)', () => {
  it.each([
    ['pranzo', 'P14+', 1100, 149, 40],
    ['pranzo', 'P14+pane', 1140, 153, 42],
    ['pranzo', 'P17+', 1100, 146, 49],
    ['pranzo', 'P4-ricotta', 1040, 131, 44],
    ['cena', 'C4-ricotta', 860, 93, 37],
    ['cena', 'C4-pecora', 790, 92, 33],
    ['cena', 'C5-zuppa', 870, 85, 38],
    ['cena', 'S4+', 1100, 125, 63],
    ['colazione', 'COL-SG-crema', 370, 43, 9],
    ['colazione', 'STD-latte', 780, 98, 39],
    ['colazione', 'STD-soia', 740, 84, 39],
    ['colazione', 'MAGG-latte', 920, 129, 41],
    ['colazione', 'MAGG-soia', 880, 115, 41],
    ['colazione', 'RID-latte', 670, 70, 35],
    ['colazione', 'RID-soia', 630, 56, 35],
  ] as const)('%s %s: %i kcal, %i g CHO, %i g pro', (categoria, id, kcal, cho, proteine) => {
    expect(idAlternative(categoria)).toContain(id)
    expect(trovaPasto(categoria, id)).toMatchObject({ kcal, cho, proteine })
  })
  it('P14+ ha il frutto in piu\' tra gli alimenti, P17+ il pane a 130 g', () => {
    expect(trovaPasto('pranzo', 'P14+')?.alimenti.filter((a) => a.nome === 'Frutto')).toHaveLength(2)
    expect(trovaPasto('pranzo', 'P17+')?.alimenti.find((a) => a.nome === 'Pane')).toMatchObject({ grammi: 130, grammiBase: 100 })
  })
  it('le varianti di C4 e P4 valgono solo nei giorni VERDE e GRIGIO, come il pasto base', () => {
    expect(trovaPasto('cena', 'C4-ricotta')?.soloTipiGiornata).toEqual(['VERDE', 'GRIGIO'])
    expect(trovaPasto('pranzo', 'P4-ricotta')?.soloTipiGiornata).toEqual(['VERDE', 'GRIGIO'])
  })
  it('le versioni di STD e RID restano nella loro famiglia di colazioni', () => {
    expect(trovaPasto('colazione', 'STD-latte')?.tipoColazione).toBe('STD')
    expect(trovaPasto('colazione', 'RID-soia')?.tipoColazione).toBe('RID')
  })
  it('nessuna sostituzione "fonte proteica" senza quantita\' rimasta nelle colazioni', () => {
    const testi = dati.blocchi.colazioni.flatMap((c) => c.alimenti.flatMap((a) => ('sostituibileCon' in a ? (a.sostituibileCon ?? []) : [])))
    expect(testi.some((t) => t.includes('fonte proteica'))).toBe(false)
  })
})

describe('merenda ridotta', () => {
  it('Mrid e Mrid-yogurt sono due merende, entrambe versioni ridotte', () => {
    expect(idAlternative('merenda').slice(-2)).toEqual(['Mrid', 'Mrid-yogurt'])
    expect(trovaPasto('merenda', 'Mrid')).toMatchObject({ proteine: 7, versione: 'ridotto' })
    expect(trovaPasto('merenda', 'Mrid-yogurt')).toMatchObject({ kcal: 190, cho: 23, proteine: 13, versione: 'ridotto' })
  })
  it('sabato 10 con Mrid-yogurt: 5 g CHO in più (363 g)', () => {
    expect(totaliPasti(vociDelGiorno(giorno('2026-10-10'), { merenda: 'Mrid-yogurt' })).cho).toBe(363)
  })
})

describe('spuntino serale', () => {
  it('base (yogurt, 25 g) e 5 alternative, senza la ricotta', () => {
    expect(idAlternative('spuntinoSerale')).toEqual(['serale', 'SER-PB1', 'SER-PB2', 'SER-PB3', 'SER-PB4', 'SER-SAL'])
  })
  it.each([
    ['SER-PB1', 29, 310, 15],
    ['SER-PB2', 27, 320, 24],
    ['SER-PB3', 30, 290, 14],
    ['SER-PB4', 34, 280, 9],
    ['SER-SAL', 17, 260, 13],
  ] as const)('%s: %i g CHO, %i kcal, %i g pro', (id, cho, kcal, proteine) => {
    expect(trovaPasto('spuntinoSerale', id)).toMatchObject({ cho, kcal, proteine })
  })
  it('nei giorni che lo prevedono il piano mette SER-PB2', () => {
    const serale = vociDelGiorno(giorno('2026-10-09')).find((v) => v.categoria === 'spuntinoSerale')
    expect(serale?.pasto?.id).toBe('SER-PB2')
    expect(serale?.idPiano).toBe('SER-PB2')
  })
  // 9 ottobre (ROSSO, con spuntino serale): pasti 429 g con SER-PB2. Con SER-SAL (17 g al posto di 27): 419 g.
  it('scelto al posto del piano cambia i totali del giorno (9 ottobre: 429 → 419 g)', () => {
    const venerdi = giorno('2026-10-09')
    expect(totaliPasti(vociDelGiorno(venerdi)).cho).toBe(429)
    expect(totaliPasti(vociDelGiorno(venerdi, { spuntinoSerale: 'SER-SAL' })).cho).toBe(419)
  })
})

describe('proteine del piano nella vista settimanale', () => {
  it('dal calendario quando le riporta: 9 ottobre 167 g', () => {
    expect(proteineDelPiano(giorno('2026-10-09'))).toBe(167)
  })
  it('settimana creata nell\'app senza il campo: somma dei pasti (9 ottobre: 168 g con SER-PB2)', () => {
    const { proteine: _p, ...senza } = giorno('2026-10-09')
    expect(proteineDelPiano(senza as ReturnType<typeof giorno>)).toBe(168)
  })
  it.each([
    [142, 'VERDE', 'sopra', 7],
    [130, 'VERDE', 'dentro', 0],
    [164, 'ROSSO', 'sopra', 14],
    [134, 'GRIGIO', 'dentro', 0],
    [118, 'GRIGIO', 'sotto', -2],
  ] as const)('%i g in un giorno %s: %s (scarto %i)', (proteine, tipo, esito, scarto) => {
    expect(confrontoProteine(proteine, tipo)).toMatchObject({ esito, scarto })
  })

  // 5 ottobre: pre-corsa 1 + STD 37 + solo frutto 1 + P2 48 + C4 39 = 126, + merenda media 16 = 142.
  it('5 ottobre (merenda da scegliere): 142 g', () => {
    expect(proteineDelPiano(giorno('2026-10-05'))).toBe(142)
  })
  // 10 ottobre (GRIGIO, niente pre-corsa): STD 37 + solo frutto 1 + P1 41 + Mrid 7 + C1rid 46 = 132.
  it('10 ottobre (merenda Mrid assegnata): 132 g, nel target GRIGIO 120-135', () => {
    expect(proteineDelPiano(giorno('2026-10-10'))).toBe(132)
    expect(confrontoProteine(132, 'GRIGIO')?.esito).toBe('dentro')
  })
})

describe('dolci aggiunti a un pasto (5 ottobre, merenda M2: piano 430 g CHO, 3115 kcal)', () => {
  const lunedi = giorno('2026-10-05')
  const tutti = vociDelGiorno(lunedi).map((v) => v.categoria)

  it('la coppa al cacao con panna Milk: valori per 100 g dall\'etichetta', () => {
    expect(dolci().find((d) => d.id === 'D2')).toMatchObject({ kcal: 93, cho: 16, proteine: 1 })
  })
  it('tiramisu a cena (32 g, 350 kcal): la giornata sale a 462 g e 3465 kcal', () => {
    const totali = totaliPasti(vociDelGiorno(lunedi, { merenda: 'M2' }, {}, { cena: 'D1' }))
    expect([totali.cho, totali.kcal]).toEqual([462, 3465])
  })
  it('cambiando la cena il dolce resta: senza C4 (85 g) ma con il tiramisu, 377 g', () => {
    expect(totaliSenza(vociDelGiorno(lunedi, { merenda: 'M2' }, {}, { cena: 'D1' }), 'cena').cho).toBe(377)
  })
  it('tiramisu, tutto spuntato: non rispettato (462 g, oltre 452)', () => {
    expect(esitoGiorno(lunedi, { scelte: { merenda: 'M2' }, consumati: tutti, dolci: { cena: 'D1' } }).esito).toBe('nonRispettato')
  })
  it('coppa Milk (16 g, 93 kcal), tutto spuntato: rispettato (446 g, 3208 kcal)', () => {
    expect(esitoGiorno(lunedi, { scelte: { merenda: 'M2' }, consumati: tutti, dolci: { cena: 'D2' } }).esito).toBe('rispettato')
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

describe('settimana 6 (12-18 ottobre)', () => {
  const settimana6 = dati.settimane.find((x) => x.numero === 6)!
  // Totali del calendario controllati a mano sulla somma dei pasti (con merenda e spuntino serale del giorno).
  it.each([
    // Giorni con P1: +60 kcal, +12 g CHO, +3 g pro rispetto al file (passata dentro P1).
    ['2026-10-12', 3320, 432, 140],
    ['2026-10-13', 3565, 470, 145],
    ['2026-10-14', 3585, 468, 150],
    ['2026-10-15', 3275, 416, 138],
    ['2026-10-16', 3710, 485, 150],
    ['2026-10-17', 2710, 344, 129],
    ['2026-10-18', 3710, 496, 149],
  ] as const)('%s: somma dei pasti = calendario (%i kcal, %i g CHO, %i g pro)', (data, kcal, cho, proteine) => {
    const g = settimana6.giorni.find((x) => x.data === data)!
    expect([g.kcal, g.cho, g.proteine]).toEqual([kcal, cho, proteine])
    const totali = totaliPasti(vociDelGiorno(g))
    expect([totali.kcal, totali.cho, totali.proteine]).toEqual([kcal, cho, proteine])
  })
  it('P1 comprende la passata e non c\'e\' piu\' la variante P1-passata', () => {
    expect(trovaPasto('pranzo', 'P1')?.alimenti.find((a) => a.nome === 'Passata di pomodoro')?.grammi).toBe(200)
    expect(idAlternative('pranzo')).not.toContain('P1-passata')
  })
  it('lo spuntino serale del giorno viene dal calendario (13 ottobre: SER-PB3)', () => {
    const serale = vociDelGiorno(giorno('2026-10-13')).find((v) => v.categoria === 'spuntinoSerale')
    expect(serale).toMatchObject({ idPiano: 'SER-PB3', pasto: { id: 'SER-PB3', cho: 30 } })
  })
  it('pesce grasso 3 volte (C2 lunedi\' e mercoledi\', C2rid sabato), formaggio C4 mai', () => {
    const conteggi = conteggiVincoli(settimana6.giorni, (g) => ({ pranzo: g.pranzo, cena: g.cena }))
    expect(conteggi.omega3.volte).toBe(3)
    expect(conteggi.formaggio.volte).toBe(0)
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

describe('calcolatore del pasto', () => {
  // Pasta di semola per 100 g: 353 kcal, 72 g CHO, 12,5 g pro, 1,5 g grassi → 120 g: 423,6 / 86,4 / 15 / 1,8.
  it('pasta 120 g: 86,4 g CHO e 423,6 kcal', () => {
    const v = valoriAlimento(trovaAlimento('pasta')!, 120)
    expect(v.cho).toBeCloseTo(86.4)
    expect(v.kcal).toBeCloseTo(423.6)
  })
  // Uovo 55 g, per 100 g 143 kcal e 12,6 g pro → 2 uova = 110 g: 157,3 kcal, 13,86 g pro.
  it('alimenti a pezzi: 2 uova = 110 g', () => {
    const v = valoriAlimento(trovaAlimento('uova')!, 2)
    expect(v.kcal).toBeCloseTo(157.3)
    expect(v.proteine).toBeCloseTo(13.86)
  })
  // 3 fette biscottate da 9,5 g = 28,5 g, 63 g CHO/100 g → 17,955 g.
  it('3 fette biscottate integrali: 18 g CHO', () => {
    expect(valoriAlimento(trovaAlimento('fette-biscottate-integrali')!, 3).cho).toBeCloseTo(17.955)
  })
  // STD ricomposta con gli alimenti della banca dati (yogurt 200, avena 70, mandorle 20, gocce 5,
  // albicocche secche 10, 3 fette, composta 40): 715 kcal, 91 g CHO, 38 g pro, 19 g grassi.
  const std = [
    { id: 'yogurt-greco-0', quantita: 200 },
    { id: 'avena-fiocchi', quantita: 70 },
    { id: 'mandorle', quantita: 20 },
    { id: 'gocce-di-cioccolato-fondente', quantita: 5 },
    { id: 'albicocche-secche', quantita: 10 },
    { id: 'fette-biscottate-integrali', quantita: 3 },
    { id: 'composta-albicocche', quantita: 40 },
  ]
  it('STD ricomposta: 715 kcal, 91 g CHO, 38 g pro, 19 g grassi', () => {
    const t = totaleComposto(std)
    expect([t.kcal, t.cho, t.proteine, t.grassi].map(Math.round)).toEqual([715, 91, 38, 19])
  })
  it('STD ricomposta contro STD del piano (700 / 90 / 37 / 20): tutto dentro', () => {
    const c = confrontaObiettivo({ kcal: 700, cho: 90, proteine: 37, grassi: 20 }, totaleComposto(std))
    expect(c.map((x) => x.esito)).toEqual(['dentro', 'dentro', 'dentro', 'dentro'])
  })
  // Tolleranze: kcal 5%, CHO 5% (minimo 3 g), proteine 10% (min 3), grassi 15% (min 3).
  it('limiti: su 90 g di CHO 4,5 g; su 25 g di CHO il minimo di 3 g', () => {
    const z = { kcal: 0, cho: 0, proteine: 0, grassi: 0 }
    expect(confrontaObiettivo({ cho: 90 }, { ...z, cho: 84 })[0]).toMatchObject({ limite: 4.5, scarto: -6, esito: 'sotto' })
    expect(confrontaObiettivo({ cho: 90 }, { ...z, cho: 94 })[0]).toMatchObject({ esito: 'dentro' })
    expect(confrontaObiettivo({ cho: 25 }, { ...z, cho: 28 })[0]).toMatchObject({ limite: 3, esito: 'dentro' })
    expect(confrontaObiettivo({ cho: 25 }, { ...z, cho: 29 })[0]).toMatchObject({ esito: 'sopra' })
    expect(confrontaObiettivo({ grassi: 20 }, { ...z, grassi: 24 })[0]).toMatchObject({ limite: 3, esito: 'sopra' })
  })
  it('senza obiettivo dei grassi i grassi non si confrontano', () => {
    expect(confrontaObiettivo({ kcal: 700, cho: 90, proteine: 37 }, totaleComposto(std)).map((c) => c.nutriente)).toEqual(['kcal', 'cho', 'proteine'])
  })
  it('prima gli alimenti del pasto (STD), poi quelli delle altre colazioni, poi gli altri', () => {
    const gruppi = gruppiAlimenti(['STD'], idAlternative('colazione'))
    expect(gruppi.map((g) => g.titolo)).toEqual(['pasto', 'categoria', 'altri'])
    expect(gruppi[0].alimenti.map((a) => a.id)).toContain('avena-fiocchi')
    expect(gruppi[1].alimenti.map((a) => a.id)).toContain('skyr')
    expect(gruppi[2].alimenti.map((a) => a.id)).toContain('pasta')
  })
  it('ricerca anche nei sinonimi e senza accenti', () => {
    expect(corrisponde(trovaAlimento('burro-d-arachidi')!, 'arachidi')).toBe(true)
    expect(corrisponde(trovaAlimento('tiramisu')!, 'tiramisù')).toBe(true)
  })
  it('selettore: olio a passi di 5 g fino a 100 g, uova a pezzi da 1 a 20', () => {
    expect(valoriSelettore(trovaAlimento('olio-evo')!).slice(0, 3)).toEqual([5, 10, 15])
    expect(valoriSelettore(trovaAlimento('olio-evo')!).at(-1)).toBe(100)
    expect(valoriSelettore(trovaAlimento('uova')!).at(-1)).toBe(20)
  })
  it('la coppa Milk ha i valori dell\'etichetta (16,4 g di CHO per 100 g)', () => {
    expect(trovaAlimento('coppa-al-cacao-con-panna')?.per100).toEqual({ kcal: 93, cho: 16.4, proteine: 1.3, grassi: 2.5 })
  })
  it('tutti i pasti del piano hanno i grassi', () => {
    const categorie: CategoriaConId[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena', 'spuntinoSerale']
    const senza = categorie.flatMap((c) => idAlternative(c).filter((id) => trovaPasto(c, id)?.grassi === undefined))
    expect(senza).toEqual([])
  })
})
