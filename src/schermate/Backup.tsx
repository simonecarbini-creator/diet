// Backup e installazione (SPEC.md §5): i dati vivono solo sul telefono, quindi si
// salvano e si ripristinano a mano con un file JSON.
import { useEffect, useState } from 'react'
import { leggiTutto, sostituisciTutto } from '../archivio'
import { condividiFile } from '../esporta'

type FileBackup = { app: 'DIET'; formato: 1; creato: string; dati: [string, unknown][] }

function eBackup(v: unknown): v is FileBackup {
  const b = v as FileBackup
  return !!b && b.app === 'DIET' && b.formato === 1 && Array.isArray(b.dati) && b.dati.every((d) => Array.isArray(d) && typeof d[0] === 'string')
}

export function Backup({ oggi }: { oggi: string }) {
  const [voci, setVoci] = useState<number | null>(null)
  const [persistente, setPersistente] = useState<boolean | null>(null)
  const [daRipristinare, setDaRipristinare] = useState<FileBackup | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const installata = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

  useEffect(() => {
    void leggiTutto().then((tutto) => setVoci(tutto.length)).catch(() => setVoci(0))
    void navigator.storage?.persisted?.().then(setPersistente)
  }, [])

  async function salva() {
    const backup: FileBackup = { app: 'DIET', formato: 1, creato: new Date().toISOString(), dati: await leggiTutto() }
    await condividiFile(`diet-backup-${oggi}.json`, JSON.stringify(backup), 'application/json')
  }

  async function scegliFile(file: File | undefined) {
    if (!file) return
    try {
      const letto: unknown = JSON.parse(await file.text())
      if (!eBackup(letto)) throw new Error('non è un backup di DIET')
      setDaRipristinare(letto)
      setErrore(null)
    } catch (e) {
      setErrore(`File non valido: ${(e as Error).message}`)
    }
  }

  async function ripristina() {
    if (!daRipristinare) return
    await sostituisciTutto(daRipristinare.dati)
    window.location.reload()
  }

  return (
    <>
      <h1 className="text-xl font-bold">Backup e installazione</h1>
      <p className="mt-1 text-sm opacity-70">
        Scelte, note, peso e settimane create nell'app restano solo su questo telefono. Il backup è un file da
        tenere al sicuro (File, iCloud, mail) per non perderli.
      </p>

      <section className="mt-4 space-y-3 rounded-xl border border-bordo bg-superficie p-4">
        <h2 className="font-bold">Backup</h2>
        <p className="text-sm">{voci === null ? '…' : `${voci} elementi salvati sul telefono.`}</p>
        <button type="button" onClick={() => void salva()} className="w-full rounded-xl bg-cho p-3.5 font-bold text-white">
          Salva un backup
        </button>

        <label className="block cursor-pointer rounded-xl border border-bordo p-3 text-center font-medium">
          Ripristina da un backup…
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => void scegliFile(e.target.files?.[0])} />
        </label>
        {errore && <p className="text-sm text-ko">{errore}</p>}
        {daRipristinare && (
          <div className="space-y-2 rounded-xl border-2 border-ko p-3 text-sm">
            <p>
              Backup del {new Date(daRipristinare.creato).toLocaleString('it-IT')} con {daRipristinare.dati.length} elementi.
              Ripristinandolo <span className="font-semibold">sostituisci tutti i dati attuali</span> del telefono.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDaRipristinare(null)} className="rounded-xl border border-bordo p-3 font-medium">
                Annulla
              </button>
              <button type="button" onClick={() => void ripristina()} className="rounded-xl bg-ko p-3 font-bold text-white">
                Ripristina
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 space-y-2 rounded-xl border border-bordo bg-superficie p-4 text-sm">
        <h2 className="text-base font-bold">Installazione e offline</h2>
        {installata ? (
          <p>L'app è installata sulla schermata Home e funziona anche senza rete.</p>
        ) : (
          <ol className="list-decimal space-y-1 pl-5">
            <li>Apri questa pagina con Safari.</li>
            <li>Tocca il pulsante Condividi.</li>
            <li>Scegli «Aggiungi alla schermata Home».</li>
          </ol>
        )}
        <p className="opacity-70">
          Dopo la prima apertura l'app funziona anche offline. Quando c'è una versione nuova si aggiorna da sola alla
          riapertura.
        </p>
        {persistente !== null && (
          <p className="opacity-70">
            Memoria {persistente ? 'protetta: il browser non cancella i dati da solo.' : 'non ancora protetta: installare l\'app sulla Home aiuta a non perdere i dati.'}
          </p>
        )}
      </section>
    </>
  )
}
