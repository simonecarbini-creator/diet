# Piano Alimentare — Specifica dell'app

App personale per seguire il piano alimentare della preparazione alla Maratona di Firenze (29 novembre 2026).
Sostituisce il PDF settimanale: stesso contenuto, ma consultabile in due secondi dal telefono e con la possibilità di registrare i dati.

**Utente unico.** Nessun login, nessun multi-utente, nessun account.

---

## 1. Contesto

L'atleta è diabetico di tipo 1 in terapia insulinica, usa un sensore FreeStyle Libre, si allena la mattina alle 5:30 e corre circa 100 km a settimana. Questo determina due requisiti non negoziabili:

- **I grammi di carboidrati sono l'informazione più importante di ogni schermata**, perché servono per il calcolo del bolo. Devono essere leggibili senza aprire dettagli.
- **L'app non dà, non suggerisce e non calcola dosi di insulina.** Mai. Nemmeno indirettamente. Mostra i carboidrati e basta.

In fondo a ogni schermata principale va il disclaimer presente in `dati.json` (campo `disclaimer`).

---

## 2. Fonte dei dati

Tutto il piano vive in **`dati.json`**, incluso nel repo. È l'unica fonte di verità.

Ne deriva un vincolo di architettura: **nessun valore nutrizionale va scritto nel codice**. Se domani cambiano i grammi di pasta del P1, si modifica solo il JSON e l'app si aggiorna da sola. Niente numeri hardcoded nei componenti, niente liste di pasti duplicate nella UI.

Struttura (vedi il file per il dettaglio):

| Chiave | Contenuto |
|---|---|
| `atleta`, `target` | Dati personali, obiettivi di macro |
| `tipiGiornata` | VERDE / ROSSO / GRIGIO con kcal e CHO target |
| `regole` | **Il motore dell'app** — vedi sezione 4 |
| `blocchi` | Pre-corsa, 3 colazioni, 2 spuntini, spuntino serale |
| `pranzi` | P1-P13 con varianti, ridotti e maggiorati |
| `cene` | C1-C14 con vincoli di utilizzo (C5-C14 e P4-P13 aggiunti il 2026-10-02 dal file del nutrizionista) |
| `merende` | M1–M12 con tag (ufficio, salata, senzaYogurt, pocheProteine…) |
| `sostituzioni` | Equivalenze proteiche e dei cereali |
| `verdure` | Elenco con CHO per 200 g e note di cottura |
| `conversioniCrudoCotto` | I grammi del piano sono **a crudo** |
| `settimane` | Calendario, già popolato con la settimana 4 |
| `promemoriaGlicemico`, `controlli` | Contenuti informativi |

---

## 3. Schermate

### 3.1 Oggi (home)

*Decisione 2026-10-01: all'avvio si apre la Settimana; Oggi resta la vista giornaliera,
che scorre al pasto dell'ora attuale.*

È la schermata usata il 90% delle volte. Deve rispondere a una sola domanda: **cosa mangio adesso**.

In cima:
- Data, allenamento del giorno, badge del tipo giornata (colore da `tipiGiornata`)
- Totali: kcal, **CHO in grande**, proteine. Mostrare **entrambi** i totali: quello del piano
  (`kcal`/`cho` del giorno in `dati.json`) e la somma dei pasti effettivi, che si aggiorna
  quando si sceglie la merenda o si sostituisce un pasto (es. "piano 426 g · finora 368 g").
  *Decisione 2026-10-01: i totali del piano includono una merenda stimata, la somma no
  finché la merenda non è scelta.* *Decisione 2026-10-02: il secondo riquadro è "Consumati finora"
  (somma dei soli pasti spuntati, in tempo reale), con il riferimento alla somma dei pasti del giorno.*
- Se previsti: indicazione gel in corsa e spuntino serale. **I CHO dei gel sono separati e
  non entrano nei totali del giorno.**

Sotto, i pasti **in ordine cronologico**, come card:

```
05:15  Pre-corsa          110 kcal · 25 g CHO
07:00  Colazione STD      700 kcal · 90 g CHO
10:30  Spuntino           255 kcal · 22 g CHO
13:00  Pranzo P1        1.030 kcal · 154 g CHO
17:00  Merenda             →  da scegliere
20:00  Cena C2            790 kcal · 75 g CHO
22:30  Spuntino serale    300 kcal · 25 g CHO
```

Ogni card si espande e mostra gli alimenti con i grammi. Un pasto si può spuntare come consumato.

Il pasto corrente (in base all'ora) è evidenziato e viene mostrato per primo allo scroll.

**Dettagli che fanno la differenza:**
- La merenda nel calendario è spesso `null`: va scelta ogni giorno. La card mostra un selettore con le 12 opzioni, filtrabili per tag.
- Le alternative (P2 al posto di P1, C4 al posto di C1) si cambiano al volo e la sostituzione **vale solo per oggi**, non modifica il piano.
  *Decisione 2026-10-05: il pannello di scelta è "guidato". Ogni alternativa mostra dove arriva la giornata
  rispetto all'obiettivo di CHO del tipo di giornata (± `regole.sceltaPasti.tolleranzaPercento`); prima quelle
  nel target. In "Altre versioni": colazioni di un altro tipo, ridotte fuori dai GRIGIO, maggiorate fuori dai
  ROSSO. Le colazioni sono 33 (STD, MAGG, RID, ciascuna con 10 alternative B1-B10).*
- Quando si sostituisce un pasto, mostrare la **differenza di CHO** rispetto all'originale (es. "−15 g CHO rispetto a P1"), perché è quello che va compensato.
- Se il giorno ha `ricarica: true` (sabato prima di una domenica pesante), mostrarlo come nota in evidenza: non è un riposo qualsiasi.

### 3.2 Settimana

Il calendario a colpo d'occhio: una riga per giorno con data, allenamento, badge tipo, colazione, pranzo, cena, pallino per lo spuntino serale, gel, kcal e CHO.

Toccando una riga si apre il dettaglio di quel giorno (stessa vista di "Oggi"). *Decisione 2026-10-02: anche i giorni passati restano modificabili, per segnare i pasti in ritardo.*

In fondo, il **controllo dei vincoli settimanali** da `regole.vincoliSettimanali`:

```
✓ Pesce grasso (C2): 3 volte          minimo 3
⚠ Formaggio (C4): 1 volta             max 3, solo VERDE/GRIGIO
⚠ Barbabietola: 0 volte               consigliate 2-3
```

### 3.3 Nuova settimana

Il form dove si inserisce la scheda che arriva dall'allenatore. Per ogni giorno:

- Testo libero dell'allenamento (es. "Ripetute: risc. 4 km + 10×1000 rec 2' corsetta + 1 km defaticamento")
- Distanza totale in km
- Durata stimata in minuti (opzionale ma utile per il calcolo gel)

Alla conferma, **l'app applica le regole della sezione 4** e propone tipo giornata, colazione, spuntino, gel e spuntino serale per ogni giorno. La proposta è **sempre modificabile a mano** prima di salvare: le regole coprono i casi normali, non tutti.

Pranzi e cene vengono assegnati automaticamente rispettando i vincoli settimanali (C2 almeno 3 volte, C4 max 3 e mai con C2, alternanza delle fonti proteiche). Anche questi modificabili.

Un campo per incollare un JSON di settimana già pronto è utile come scorciatoia, ma non è la via principale.

*Decisioni 2026-10-02 (approvate dall'utente), scritte in `dati.json` → `regole` con il campo `quando`
leggibile dall'app e spiegate nella pagina **Calcoli** (menu):*
- *si inseriscono anche i minuti sopra il ritmo medio (facoltativi) e il lungo domenicale (automatico la
  domenica da 18 km);*
- *la "x" da sola non è qualità (6x100 di allunghi resta VERDE); progressiva lunga da 18 km;*
- *ROSSO pesante = ROSSO con lungo ≥ 20 km o ≥ 50 minuti sopra il ritmo medio;*
- *spuntino intero da 15 km come da regola; gel = g/ora × durata arrotondato al gel da 30 g;*
- *pranzo P1, cene C2 ×3 e C4 ×2 non consecutive, il resto a rotazione C1/C3; giorni GRIGIO ridotti,
  sabato di ricarica con pranzo pieno;*
- *totale del piano = somma dei pasti + media delle merende se la merenda non è scelta;*
- *le settimane create nell'app si salvano sul telefono e prevalgono su `dati.json` per le stesse date.*
- *Menu ad hamburger con animazione di apertura (richiesta esplicita, disattivata con "Riduci movimento").*

### 3.4 Registro

*Decisione 2026-10-01: niente glicemie. L'app si ferma ai carboidrati; il Registro ha
solo peso e diario pasti.*

Due cose da segnare, due tab:

**Peso** — inserimento rapido, grafico con la media mobile a 7 giorni (è la media che conta, non il singolo valore). Alert automatici secondo `target`:
- sopra 75,5 kg → "togli 150-200 kcal dai giorni VERDE"
- sotto 74,5 kg → "rimetti la colazione MAGG nei giorni ROSSO"

**Diario pasti** — cosa è stato mangiato davvero, se diverso dal piano. Deve restare facoltativo e velocissimo, altrimenti non viene compilato.

**Export** *(fatto 2026-10-02)*: CSV del peso (con media a 7 giorni) e CSV del diario, dal Registro;
sull'iPhone si condividono con il foglio di condivisione.

### 3.5 Riferimento

La parte di consultazione, senza interazione:

- **Blocchi**: tutte le colazioni, pranzi, cene, merende con grammi e valori
- **Sostituzioni**: le equivalenze proteiche e dei cereali. In evidenza: *170 g di yogurt greco = 30 g di parmigiano*
- **Verdure**: la tabella con i CHO per 200 g, e le note (crucifere mai la sera prima di un giorno ROSSO, barbabietola 2-3 volte a settimana)
- **Crudo/cotto**: la tabella di conversione, con l'avvertenza che tutti i grammi del piano sono a crudo
- **Promemoria glicemico**: le quattro schede da `promemoriaGlicemico`
- **Come leggere un'etichetta**: da `sostituzioni.cereali.comeRiconoscere` — fiocchi contro flakes, e il principio generale (guardare i carboidrati per 100 g e le fibre, non le scritte sul davanti)

---

## 4. Il motore delle regole

È la parte che vale la pena scrivere bene, perché è ciò che rende l'app diversa da un PDF: da un allenamento deriva tutta la giornata alimentare.

Le regole sono in `dati.json` → `regole`. Il codice le legge da lì, non le reimplementa.

### Classificazione del giorno

```
riposo o allenamento vuoto                              → GRIGIO
distanza ≥ 18 km                                        → ROSSO
contiene ripetute/salite/frazionato/medio               → ROSSO
minuti sopra ritmo medio ≥ 20                           → ROSSO
altrimenti                                              → VERDE
```

Il riconoscimento delle parole chiave sul testo libero (`ripetute`, `salite`, `frazionato`, `medio`, `progressiva`, `×`) copre i casi reali. **Un caso di confine importante**: una progressiva breve di 14-15 km che chiude veloce resta VERDE, mentre una seduta come 10×1000 (~18 km, oltre un'ora sopra il ritmo medio) è ROSSO e va trattata come un lungo.

### Colazione

```
distanza ≥ 20 km, oppure ≥ 50 min sopra ritmo medio,
oppure è il lungo domenicale                            → MAGG
GRIGIO e il giorno dopo non è ROSSO pesante             → RID
altrimenti                                              → STD
```

**La regola del sabato di ricarica** è quella che sfugge più facilmente: se la domenica c'è un lungo ≥ 20 km o una qualità estesa, il sabato *non* è un riposo ridotto. Colazione STD e pranzo pieno; si tagliano solo merenda e cena. Il giorno va marcato `ricarica: true`.

### Spuntino, serale, gel

```
spuntino:   ROSSO o distanza ≥ 15 km  → intero, altrimenti solo frutto
serale:     ROSSO → sì  ·  distanza ≥ 20 km → sì e obbligatorio
gel:        < 75 min → 0
            75-100 min → 30 g/h
            > 100 min → 60 g/h
            lungo domenicale → 70 g/h, protocollo gara
```

Sul giorno con `spuntinoSerale` obbligatorio, mostrare la motivazione: *anti-ipoglicemia notturna post-lungo*. Non è un dettaglio cosmetico, è il rischio principale della preparazione.

---

## 5. Requisiti tecnici

**PWA installabile, funzionante offline.** Questo è il requisito che guida tutto il resto: l'app viene usata al supermercato con la connessione che va e viene, e in cucina con le mani sporche. Service worker, manifest, icone.

**Dati in locale.** IndexedDB o localStorage, nessun backend, nessun account. Export/import JSON per il backup manuale.

**Mobile first.** Il telefono è il dispositivo primario; il desktop è un di più e basta che non si rompa.

**Stack suggerito** (non vincolante): Vite + React + TypeScript, Tailwind. Nessuna libreria di componenti pesante. Per il grafico del peso basta una libreria piccola o un SVG scritto a mano.

**Tipizzazione**: generare i tipi TypeScript da `dati.json` e usarli ovunque. Così se il JSON cambia forma, il compilatore lo dice subito.

---

## 6. Design

Il PDF attuale funziona bene su tre cose e vale la pena portarle: il **codice colore** dei tipi giornata, i **CHO sempre in evidenza** in arancione, e la **separazione netta** tra "cosa mangio" e "perché".

Palette di partenza:

| Ruolo | Colore |
|---|---|
| Primario / testo | `#0f2b46` |
| VERDE | `#2e8b57` |
| ROSSO | `#d13b2e` |
| GRIGIO | `#9aa7b4` |
| CHO (accento) | `#e0549a` (scuro: `#f77fb8`) — *2026-10-02: rosa del logo; testo `#2a1a14`; sfondo pastello `#e4f6f0` (2026-10-02)* |
| Sfondo chiaro | `#f6f9fc` |

Supporto al tema scuro: serve davvero, visto che l'app si apre alle 5 del mattino.

Testo grande sui numeri che contano (CHO, kcal), tocco comodo sulle card, niente animazioni.

---

## 7. Cosa NON deve fare

- Nessun calcolo, suggerimento o riferimento a dosi di insulina, boli, rapporti insulina/carboidrati o fattori di correzione.
- Nessuna registrazione di glicemie e nessuna sincronizzazione con il sensore o con app sanitarie.
- Nessuna diagnosi, nessuna interpretazione dei valori inseriti al di là delle soglie di peso già nel JSON.
- Nessun account, nessun server, nessuna telemetria.

---

## 8. Ordine di costruzione consigliato

1. Caricamento di `dati.json` e tipi TypeScript generati
2. Schermata **Oggi** in sola lettura, con la settimana 4 già nel JSON
3. Selezione della merenda e sostituzione dei pasti
4. Schermata **Settimana** con il controllo dei vincoli
5. **Motore delle regole** + schermata Nuova settimana
6. **Registro** (peso → diario)
7. PWA, offline, tema scuro
8. Export (CSV di peso e diario)

*Stato 2026-10-02: punti 1-8 fatti. In più: vista Mese, peso con promemoria, Cambia piano, menu, Calcoli,
backup e ripristino JSON, service worker per l'offline (vite-plugin-pwa).*

I punti 1-3 danno già qualcosa di più comodo del PDF. Da lì in poi è tutto guadagno.
