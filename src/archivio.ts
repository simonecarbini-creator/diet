// Salvataggio locale in IndexedDB: chiave → valore, nessun server.
const NOME_DB = 'diet'
const VERSIONE_DB = 1
const STORE = 'giorni'

let connessione: Promise<IDBDatabase> | null = null

function apri(): Promise<IDBDatabase> {
  connessione ??= new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.open(NOME_DB, VERSIONE_DB)
    richiesta.onupgradeneeded = () => richiesta.result.createObjectStore(STORE)
    richiesta.onsuccess = () => risolvi(richiesta.result)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
  return connessione
}

export async function leggi<T>(chiave: string): Promise<T | undefined> {
  const db = await apri()
  return new Promise((risolvi, rifiuta) => {
    const richiesta = db.transaction(STORE).objectStore(STORE).get(chiave)
    richiesta.onsuccess = () => risolvi(richiesta.result as T | undefined)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
}

export async function scrivi<T>(chiave: string, valore: T): Promise<void> {
  const db = await apri()
  return new Promise((risolvi, rifiuta) => {
    const transazione = db.transaction(STORE, 'readwrite')
    transazione.objectStore(STORE).put(valore, chiave)
    transazione.oncomplete = () => risolvi()
    transazione.onerror = () => rifiuta(transazione.error)
  })
}
