# CLAUDE.md

Istruzioni permanenti per questo progetto. Leggile prima di scrivere codice.

## Cos'è

PWA personale, utente singolo, che sostituisce un PDF settimanale di piano alimentare
per la preparazione a una maratona. Nessun login, nessun backend, nessun account.

**`SPEC.md` è la specifica completa.** Leggila prima di iniziare qualsiasi lavoro.
**`dati.json` è l'unica fonte di verità** per ogni contenuto nutrizionale.

## Regole non negoziabili

**1. Niente insulina.** L'utente è diabetico di tipo 1 in terapia insulinica.
L'app non calcola, non suggerisce e non menziona dosi di insulina, boli, rapporti
insulina/carboidrati o fattori di correzione. Mai, in nessuna schermata, nemmeno come
campo opzionale o nota. Mostra i grammi di carboidrati e si ferma lì.
Se una funzione sembra richiederlo, non implementarla e chiedi.

**2. Nessun valore nutrizionale nel codice.** Grammi, kcal, CHO, proteine, nomi dei
pasti, regole: tutto si legge da `dati.json` a runtime. Nessun numero hardcoded nei
componenti, nessuna lista di pasti duplicata nella UI, nessuna regola reimplementata
in TypeScript. Se serve un valore che non c'è nel JSON, va aggiunto al JSON.

**3. I carboidrati sono l'informazione primaria.** Servono per il calcolo del bolo,
che l'utente fa da sé. Vanno letti senza aprire dettagli, con tipografia grande e
colore d'accento dedicato. Non nasconderli mai dietro un tap.

**4. Offline davvero.** L'app si usa al supermercato e in cucina, con connessione
inaffidabile. Ogni funzione deve funzionare senza rete. Nessuna chiamata esterna,
nessun font remoto, nessuna CDN a runtime.

**5. Il disclaimer resta.** Il campo `disclaimer` di `dati.json` va mostrato in fondo
alle schermate principali. Non rimuoverlo, non riscriverlo.

## Stack

Vite + React + TypeScript + Tailwind. Dati in IndexedDB.
Niente librerie di componenti pesanti. Per i grafici, qualcosa di piccolo o SVG a mano.

I tipi TypeScript si generano da `dati.json` e si usano ovunque: se il JSON cambia
forma, deve rompersi la compilazione, non l'app a runtime.

## Convenzioni

- Italiano per UI, contenuti, commenti e nomi di dominio (`colazione`, `spuntinoSerale`).
  Inglese solo per i termini tecnici di React/TS.
- Mobile first. Il desktop deve funzionare, ma non è il target.
- Tema scuro necessario: l'app si apre alle 5 del mattino.
- Niente animazioni decorative.

## Come lavorare

Segui l'ordine di costruzione in fondo a `SPEC.md`, un punto per volta.
Fermati dopo ogni punto e fammi provare prima di andare avanti.

Quando una regola di `SPEC.md` è ambigua o incompleta, chiedi invece di decidere da solo:
molte scelte di questo piano hanno una ragione medica che non è evidente dal codice.
