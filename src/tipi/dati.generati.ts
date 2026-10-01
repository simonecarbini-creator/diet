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
    alimenti: SpuntiniAlimenti[];
}

export type SpuntiniAlimenti = {
    nome:   string;
    grammi: number;
}

export type BlocchiSpuntinoSerale = {
    id:       string;
    nome:     string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: SpuntiniAlimenti[];
    varianti: SpuntinoSeraleVarianti[];
    note:     string;
}

export type SpuntinoSeraleVarianti = {
    nome:     string;
    alimenti: SpuntiniAlimenti[];
}

export type Cene = {
    id:                  string;
    nome:                string;
    kcal:                number;
    cho:                 number;
    proteine:            number;
    alimenti:            CeneAlimenti[];
    ridotto?:            Ridotto;
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

export type Ridotto = {
    id:        string;
    kcal:      number;
    cho:       number;
    modifiche: string;
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
    ridotto:      Ridotto;
    note:         string;
    tags?:        string[];
    maggiorato?:  Ridotto;
}

export type PranziAlimenti = {
    nome:             string;
    grammi:           number;
    note?:            string;
    sostituibileCon?: string[];
}

export type PranziVarianti = {
    id:       string;
    nome:     string;
    kcal:     number;
    cho:      number;
    proteine: number;
    alimenti: SpuntiniAlimenti[];
    note:     string;
}

export type PromemoriaGlicemico = {
    id:     string;
    titolo: string;
    testo:  string;
}

export type Regole = {
    _nota:                   string;
    classificazioneGiornata: ClassificazioneGiornata[];
    classificazioneNota:     string;
    sceltaColazione:         SceltaColazione[];
    sceltaSpuntino:          SceltaSpuntino[];
    spuntinoSerale:          SpuntinoSeraleElement[];
    gelInCorsa:              GelInCorsa[];
    sabatoRicarica:          SabatoRicarica;
    regolaSabato:            string;
    vincoliSettimanali:      VincoliSettimanali[];
}

export type ClassificazioneGiornata = {
    id:       string;
    se:       string;
    tipo:     string;
    priorita: number;
}

export type GelInCorsa = {
    grammiCho?:       number;
    se:               string;
    grammiChoPerOra?: number;
    nota?:            string;
}

export type SabatoRicarica = {
    condizione: string;
    effetto:    string;
    motivo:     string;
}

export type SceltaColazione = {
    colazione: string;
    se:        string;
}

export type SceltaSpuntino = {
    spuntino: string;
    se:       string;
}

export type SpuntinoSeraleElement = {
    valore:        boolean;
    se:            string;
    obbligatorio?: boolean;
    motivo?:       string;
}

export type VincoliSettimanali = {
    id:      string;
    regola:  string;
    motivo?: string;
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
