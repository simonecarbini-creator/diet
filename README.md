# Diet

PWA personale per il piano alimentare della preparazione alla Maratona di Firenze.

- `SPEC.md` — specifica completa dell'app
- `CLAUDE.md` — regole permanenti del progetto
- `dati.json` — unica fonte di verità per ogni contenuto nutrizionale

## Comandi

```bash
npm install        # la prima volta
npm run dev        # anteprima locale su http://localhost:5173
npm run build      # rigenera i tipi, verifica dati.json, compila in dist/
```

`npm run prova-motore` confronta il motore delle regole con la settimana 4.
`npm run tipi` rigenera `src/tipi/dati.generati.ts` da `dati.json`;
`npm run verifica` controlla che il calendario si riferisca a pasti e tipi esistenti.
Entrambi girano in automatico dentro `npm run build`.

## Pubblicazione

GitHub Pages: https://simonecarbini-creator.github.io/diet/

A ogni push su `main` il workflow `.github/workflows/pubblica.yml` esegue `npm run build`
e pubblica `dist/`. In Settings → Pages la sorgente deve essere **GitHub Actions**.
