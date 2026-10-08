// Campi del pasto libero: cosa si è mangiato e, se si conoscono, kcal, CHO e proteine.
// Gli stessi nella giornata libera e tra le alternative del pannello di scelta.
import type { PastoLibero } from '../giornata'

export type BozzaLibero = { testo: string; kcal: string; cho: string; proteine: string }

const daNumero = (v?: number) => (v === undefined ? '' : String(v))
const numero = (t: string): number | undefined => {
  const n = Number(t.trim().replace(',', '.'))
  return t.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined
}

export function bozzaDa(libero?: PastoLibero): BozzaLibero {
  return {
    testo: libero?.testo ?? '',
    kcal: daNumero(libero?.kcal),
    cho: daNumero(libero?.cho),
    proteine: daNumero(libero?.proteine),
  }
}

/** I valori non inseriti (o non validi) restano assenti: i CHO del pasto sono ND. */
export function daBozza(bozza: BozzaLibero): PastoLibero {
  const valori = { kcal: numero(bozza.kcal), cho: numero(bozza.cho), proteine: numero(bozza.proteine) }
  return {
    testo: bozza.testo.trim(),
    ...Object.fromEntries(Object.entries(valori).filter(([, v]) => v !== undefined)),
  }
}

const campo = 'mt-1 block w-full min-w-0 rounded-lg border border-bordo bg-sfondo px-2.5 py-2 outline-none focus:border-cho'

export function CampiPastoLibero({
  bozza,
  onCambia,
  autoFocus = false,
}: {
  bozza: BozzaLibero
  onCambia: (bozza: BozzaLibero) => void
  autoFocus?: boolean
}) {
  return (
    <>
      <label className="mt-2 block">
        <span className="text-sm font-semibold">Cosa hai mangiato?</span>
        <textarea
          rows={3}
          autoFocus={autoFocus}
          value={bozza.testo}
          onChange={(e) => onCambia({ ...bozza, testo: e.target.value })}
          placeholder="es. pizza margherita e una birra"
          className={`${campo} resize-none`}
        />
      </label>
      <p className="mt-2 text-xs opacity-70">
        Valori facoltativi: se li conosci, il pasto entra nei totali e la giornata può risultare equivalente al piano.
      </p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {(
          [
            ['kcal', 'Kcal'],
            ['cho', 'g CHO'],
            ['proteine', 'g pro'],
          ] as const
        ).map(([chiave, testo]) => (
          <label key={chiave} className="block min-w-0">
            <span className="text-xs font-semibold uppercase opacity-70">{testo}</span>
            <input
              inputMode="decimal"
              value={bozza[chiave]}
              onChange={(e) => onCambia({ ...bozza, [chiave]: e.target.value })}
              className={`${campo} font-semibold`}
            />
          </label>
        ))}
      </div>
    </>
  )
}
