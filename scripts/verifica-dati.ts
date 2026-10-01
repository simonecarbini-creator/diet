// Ferma il build se il calendario in dati.json si riferisce a pasti o tipi inesistenti.
import dati from '../dati.json' with { type: 'json' }
import { verificaDati } from '../src/verifica.ts'

const errori = verificaDati(dati)
if (errori.length > 0) {
  console.error('dati.json non coerente:')
  for (const errore of errori) console.error(`  - ${errore}`)
  process.exit(1)
}
console.log('dati.json coerente')
