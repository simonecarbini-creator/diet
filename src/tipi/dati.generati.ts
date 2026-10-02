export type Dati = {
    $schema:               string;
    versione:              string;
    aggiornato:            string;
    _nota:                 string;
    atleta:                Atleta;
    target:                Target;
    tipiGiornata:          TipiGiornata;
    orariPasti:            OrariPasti;
    regole:                Regole;
    blocchi:               Blocchi;
    pranzi:                Pranzi[];
    cene:                  Cene[];
    merende:               Merende[];
    merendaRidotta:        MerendaRidotta;
    merendaNote:           string[];
    sostituzioni:          Sostituzioni;
    verdure:               Verdure;
    conversioniCrudoCotto: ConversioniCrudoCotto;
    settimane:             Settimane[];
    promemoriaGlicemico:   PromemoriaGlicemico[];
    controlli:             Controlli[];
    disclaimer:            string;
}

export type Atleta = {
    altezzaCm:         number;
    pesoKg:            number;
    pesoObiettivoKg:   number;
    fase:              string;
    gara:              Gara;
    orarioAllenamento: string;
    giornoRiposo:      string;
    alimentazione:     Alimentazione;
}

export type Alimentazione = {
    carne:       string;
    pesce:       boolean;
    vegetariano: boolean;
    nonGraditi:  string[];
}

export type Gara = {
    nome: string;
    data: string;
}

export type Blocchi = {
    preCorsa:       PreCorsa;
    colazioni:      Colazioni[];
    spuntini:       Spuntini[];
    spuntinoSerale: BlocchiSpuntinoSerale;
}

export type Colazioni = {
    id:         string;
    nome:       string;
    orario?:    string;
    kcal:       number;
    cho:        number;
    proteine:   number;
    alimenti?:  ColazioniAlimenti[];
    note?:      string;
    base?:      string;
    aggiunte?:  Aggiunte[];
    rimozioni?: string[];
}

export type Aggiunte = {
    nome:    string;
    grammi?: number;
    pezzi?:  number;
}

export type ColazioniAlimenti = {
    nome:             string;
    grammi:           number | null;
    sostituibileCon?: string[];
    pezzi?:           number;
}

export type PreCorsa = {
    id:       string;
    nome:     string;
    orario:   string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: PreCorsaAlimenti[];
    note:     string;
    saltaSe:  string;
}

export type PreCorsaAlimenti = {
    nome:   string;
    grammi: number | null;
    note?:  string;
}

export type Spuntini = {
    id:       string;
    nome:     string;
    orario:   string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: ModificheGrammiElement[];
}

export type ModificheGrammiElement = {
    nome:   string;
    grammi: number;
}

export type BlocchiSpuntinoSerale = {
    id:       string;
    nome:     string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: ModificheGrammiElement[];
    varianti: SpuntinoSeraleVarianti[];
    note:     string;
}

export type SpuntinoSeraleVarianti = {
    nome:     string;
    alimenti: ModificheGrammiElement[];
}

export type Cene = {
    id:                  string;
    nome:                string;
    kcal:                number;
    cho:                 number;
    proteine:            number;
    alimenti:            CeneAlimenti[];
    ridotto?:            CeneRidotto;
    minimoSettimanale?:  number;
    note?:               string;
    massimoSettimanale?: number;
    soloTipiGiornata?:   string[];
    incompatibileCon?:   string[];
}

export type CeneAlimenti = {
    nome:             string;
    grammi?:          number;
    note?:            string;
    pezzi?:           number;
    sostituibileCon?: string[];
}

export type CeneRidotto = {
    id:              string;
    kcal:            number;
    cho:             number;
    modifiche:       string;
    modificheGrammi: ModificheGrammiElement[];
}

export type Controlli = {
    id:        string;
    cosa:      string;
    frequenza: string;
    nota?:     string;
}

export type ConversioniCrudoCotto = {
    _nota:  string;
    voci:   Voci[];
    legumi: string;
}

export type Voci = {
    alimento: string;
    crudo:    number;
    cotto:    number;
}

export type MerendaRidotta = {
    id:           string;
    kcal:         number;
    cho:          number;
    proteine:     number;
    composizione: string;
    usoSe:        string;
    quando:       MerendaRidottaQuando;
}

export type MerendaRidottaQuando = {
    var:  string;
    "==": string;
}

export type Merende = {
    id:           string;
    kcal:         number;
    cho:          number;
    proteine:     number;
    composizione: string;
    tags:         string[];
}

export type OrariPasti = {
    _nota:          string;
    preCorsa:       string;
    colazione:      string;
    spuntino:       string;
    pranzo:         string;
    merenda:        string;
    cena:           string;
    spuntinoSerale: string;
}

export type Pranzi = {
    id:           string;
    nome:         string;
    primaScelta?: boolean;
    kcal:         number;
    cho:          number;
    proteine:     number;
    alimenti:     PranziAlimenti[];
    varianti?:    PranziVarianti[];
    ridotto:      PranziRidotto;
    note:         string;
    tags?:        string[];
    maggiorato?:  Maggiorato;
}

export type PranziAlimenti = {
    nome:             string;
    grammi:           number;
    note?:            string;
    sostituibileCon?: string[];
}

export type Maggiorato = {
    id:              string;
    kcal:            number;
    cho:             number;
    modifiche:       string;
    modificheGrammi: ModificheGrammiElement[];
    nota:            string;
}

export type PranziRidotto = {
    id:              string;
    kcal:            number;
    cho:             number;
    modifiche:       string;
    modificheGrammi: ModificheGrammiElement[];
    rimozioni?:      string[];
}

export type PranziVarianti = {
    id:       string;
    nome:     string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: PreCorsaAlimenti[];
    note:     string;
}

export type PromemoriaGlicemico = {
    id:     string;
    titolo: string;
    testo:  string;
}

export type Regole = {
    _nota:                     string;
    riconoscimentoTesto:       RiconoscimentoTesto;
    lungoDomenicaleAutomatico: LungoDomenicaleAutomatico;
    rossoPesante:              RossoPesante;
    classificazioneGiornata:   ClassificazioneGiornata[];
    classificazioneNota:       string;
    sceltaColazione:           SceltaColazione[];
    sceltaSpuntino:            SceltaSpuntino[];
    spuntinoSerale:            SpuntinoSeraleElement[];
    gelInCorsa:                GelInCorsa[];
    gelGrammiPerUnita:         number;
    gelNota:                   string;
    sabatoRicarica:            SabatoRicarica;
    regolaSabato:              string;
    assegnazionePasti:         AssegnazionePasti;
    vincoliSettimanali:        VincoliSettimanali[];
}

export type AssegnazionePasti = {
    _nota:                string;
    pranzo:               string;
    maggioratoNeiGiorni:  string[];
    ceneDistribuite:      CeneDistribuite[];
    ceneARotazione:       string[];
    giornoGrigio:         GiornoGrigio;
    ricarica:             GiornoGrigio;
    cenaRidottaDiRiserva: string;
    totalePianoNota:      string;
}

export type CeneDistribuite = {
    cena:           string;
    volte:          number;
    preferenzaTipi: string[];
    nonConsecutive: boolean;
}

export type GiornoGrigio = {
    pranzo: string;
    cena:   string;
}

export type ClassificazioneGiornata = {
    id:       string;
    se:       string;
    tipo:     string;
    priorita: number;
    quando:   ClassificazioneGiornataQuando;
}

export type ClassificazioneGiornataQuando = {
    var?:    string;
    "=="?:   boolean;
    ">="?:   number;
    oppure?: PurpleOppure[];
    sempre?: boolean;
}

export type PurpleOppure = {
    var:   string;
    "=="?: boolean;
    ">="?: number;
}

export type GelInCorsa = {
    grammiChoPerOra: number;
    se:              string;
    nota?:           string;
    quando:          GelInCorsaQuando;
}

export type GelInCorsaQuando = {
    var?:    string;
    "=="?:   boolean;
    ">"?:    number;
    ">="?:   number;
    sempre?: boolean;
}

export type LungoDomenicaleAutomatico = {
    _nota:           string;
    giornoSettimana: number;
    distanzaKmMin:   number;
}

export type RiconoscimentoTesto = {
    _nota:                 string;
    paroleRiposo:          string[];
    paroleQualita:         string[];
    paroleProgressiva:     string[];
    progressivaLungaKmMin: number;
    nota:                  string;
}

export type RossoPesante = {
    se:     string;
    quando: RossoPesanteQuando;
}

export type RossoPesanteQuando = {
    e: PurpleE[];
}

export type PurpleE = {
    var?:    string;
    "=="?:   string;
    oppure?: EOppure[];
}

export type EOppure = {
    var:  string;
    ">=": number;
}

export type SabatoRicarica = {
    condizione: string;
    effetto:    string;
    motivo:     string;
    quando:     SabatoRicaricaQuando;
}

export type SabatoRicaricaQuando = {
    e: FluffyE[];
}

export type FluffyE = {
    var:  string;
    "==": boolean | string;
}

export type SceltaColazione = {
    colazione: string;
    se:        string;
    quando:    SceltaColazioneQuando;
}

export type SceltaColazioneQuando = {
    oppure?: PurpleOppure[];
    e?:      TentacledE[];
    sempre?: boolean;
}

export type TentacledE = {
    var:  string;
    "==": boolean | string;
}

export type SceltaSpuntino = {
    spuntino: string;
    se:       string;
    quando:   SceltaSpuntinoQuando;
}

export type SceltaSpuntinoQuando = {
    oppure?: FluffyOppure[];
    sempre?: boolean;
}

export type FluffyOppure = {
    var:   string;
    "=="?: string;
    ">="?: number;
}

export type SpuntinoSeraleElement = {
    valore:        boolean;
    se:            string;
    obbligatorio?: boolean;
    motivo?:       string;
    quando:        SpuntinoSeraleQuando;
}

export type SpuntinoSeraleQuando = {
    var?:    string;
    ">="?:   number;
    "=="?:   string;
    sempre?: boolean;
}

export type VincoliSettimanali = {
    id:                string;
    regola:            string;
    motivo?:           string;
    pasti?:            string[];
    verdure?:          string[];
    categoriaVerdure?: string;
    seraPrimaDiTipo?:  string;
}

export type Settimane = {
    numero:   number;
    dal:      string;
    al:       string;
    kmTotali: number;
    giorni:   Giorni[];
}

export type Giorni = {
    data:             string;
    allenamento:      string;
    distanzaKm:       number;
    tipo:             string;
    colazione:        string;
    spuntino:         string;
    pranzo:           string;
    cena:             string;
    merenda:          null | string;
    spuntinoSerale:   boolean;
    gelCho:           number;
    kcal:             number;
    cho:              number;
    note?:            string;
    ricarica?:        boolean;
    lungoDomenicale?: boolean;
}

export type Sostituzioni = {
    proteiche: Proteiche;
    cereali:   Cereali;
}

export type Cereali = {
    riferimento:     string;
    equivalenti:     CerealiEquivalenti[];
    daEvitare:       string[];
    comeRiconoscere: string;
}

export type CerealiEquivalenti = {
    nome:    string;
    grammi:  number;
    qualita: string;
    note:    string;
}

export type Proteiche = {
    riferimento: string;
    equivalenti: ProteicheEquivalenti[];
}

export type ProteicheEquivalenti = {
    nome:     string;
    grammi?:  number;
    proteine: number;
    note?:    string;
    pezzi?:   number;
}

export type Target = {
    proteineGrammiDie:         number;
    proteineNota:              string;
    grassiGrammiDieMin:        number;
    grassiGrammiDieMax:        number;
    carboidratiGrammiPerKgMin: number;
    carboidratiGrammiPerKgMax: number;
    carboidratiNota:           string;
    sogliaPesoAlto:            number;
    sogliaPesoBasso:           number;
    azioneSopraSoglia:         string;
    azioneSottoSoglia:         string;
}

export type TipiGiornata = {
    VERDE:  Grigio;
    ROSSO:  Grigio;
    GRIGIO: Grigio;
}

export type Grigio = {
    etichetta:    string;
    colore:       string;
    kcalTarget:   number;
    choTargetMin: number;
    choTargetMax: number;
}

export type Verdure = {
    porzioneStandardGrammi: number;
    note:                   string;
    elenco:                 Elenco[];
}

export type Elenco = {
    nome:                  string;
    choPer200g:            number;
    categoria:             string;
    benefici?:             string[];
    cottura?:              string;
    abbinaA?:              string[];
    note?:                 string;
    frequenzaSettimanale?: string;
    evitareSe?:            string;
}
