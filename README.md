# Diet

Web app (PWA) per consultare la dieta settimanale.

## Come funziona

- La dieta è nel file `diet-data.json`.
- Ogni settimana il file viene aggiornato con la nuova dieta.
- `index.html` + `app.js` leggono il file e mostrano giorni, pasti e alimenti.

## Come aprire localmente

```bash
cd /Users/simonecarbini/WEB-APPS/DIET
python3 -m http.server 8001
```

Poi apri nel browser: http://localhost:8001

## Come usarla da iPhone

Apri la pagina pubblicata in Safari → Condividi → "Aggiungi alla schermata Home".
