// Registro (SPEC.md §3.4): peso con media mobile a 7 giorni e diario dei pasti,
// con l'export in CSV (punto 8).
import { useEffect, useState } from 'react'
import { leggiTutto } from '../archivio'
import { dati, isCategoriaConId, type CategoriaPasto } from '../dati'
import { csv, condividiFile } from '../esporta'
import { formatData, formatDataBreve } from '../formato'
import { aggiungiGiorni, cercaGiorno, comeLibero } from '../giornata'
import { link } from '../navigazione'
import { etichettePasti } from '../etichette'
import type { Pesata } from '../peso'
import type { StatoGiorno } from '../statoGiorno'

const kg = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })


/** Media delle pesate degli ultimi 7 giorni (data compresa). */
function mediaMobile(pesate: Pesata[], data: string): number {
  const inizio = aggiungiGiorni(data, -6)
  const finestra = pesate.filter((p) => p.data >= inizio && p.data <= data)
  return finestra.reduce((s, p) => s + p.kg, 0) / finestra.length
}

// ---------------------------------------------------------------------------
// Peso

function Grafico({ pesate }: { pesate: Pesata[] }) {
  const ordinate = [...pesate].sort((a, b) => a.data.localeCompare(b.data))
  const { sogliaPesoAlto: alto, sogliaPesoBasso: basso } = dati.target
  const valori = [...ordinate.map((p) => p.kg), alto, basso]
  const min = Math.floor(Math.min(...valori) - 0.5)
  const max = Math.ceil(Math.max(...valori) + 0.5)
  const L = 340
  const H = 170
  const m = { sx: 34, dx: 8, su: 10, giu: 22 }
  const giorno = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
  const t0 = giorno(ordinate[0].data)
  const t1 = Math.max(giorno(ordinate[ordinate.length - 1].data), t0 + 86_400_000)
  const x = (d: string) => m.sx + ((giorno(d) - t0) / (t1 - t0)) * (L - m.sx - m.dx)
  const y = (v: number) => m.su + ((max - v) / (max - min)) * (H - m.su - m.giu)
  const linea = ordinate.map((p, i) => `${i ? 'L' : 'M'}${x(p.data).toFixed(1)} ${y(mediaMobile(ordinate, p.data)).toFixed(1)}`).join(' ')
  const tacche = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img" aria-label="Andamento del peso">
      {tacche.map((v) => (
        <g key={v}>
          <line x1={m.sx} x2={L - m.dx} y1={y(v)} y2={y(v)} className="stroke-bordo" strokeWidth="1" />
          <text x={m.sx - 6} y={y(v) + 4} textAnchor="end" className="fill-current text-[10px] opacity-60">
            {v}
          </text>
        </g>
      ))}
      {[alto, basso].map((s) => (
        <line key={s} x1={m.sx} x2={L - m.dx} y1={y(s)} y2={y(s)} className="stroke-ko" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      ))}
      <path d={linea} fill="none" className="stroke-cho" strokeWidth="2.5" strokeLinejoin="round" />
      {ordinate.map((p) => (
        <circle key={p.data} cx={x(p.data)} cy={y(p.kg)} r="3.5" className="fill-superficie stroke-cho" strokeWidth="2" />
      ))}
      <text x={m.sx} y={H - 6} className="fill-current text-[10px] opacity-60">
        {formatDataBreve(ordinate[0].data)}
      </text>
      <text x={L - m.dx} y={H - 6} textAnchor="end" className="fill-current text-[10px] opacity-60">
        {formatDataBreve(ordinate[ordinate.length - 1].data)}
      </text>
    </svg>
  )
}

function SchedaPeso({ pesate, onApriPeso }: { pesate: Pesata[]; onApriPeso: () => void }) {
  const ultima = pesate[0]
  const media = ultima ? mediaMobile(pesate, ultima.data) : null

  function esporta() {
    const righe = [...pesate]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((p) => [p.data, p.kg, Math.round(mediaMobile(pesate, p.data) * 10) / 10])
    void condividiFile(`diet-peso-${ultima?.data ?? 'vuoto'}.csv`, csv([['Data', 'Peso kg', 'Media 7 giorni kg'], ...righe]), 'text/csv')
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Ultima pesata</div>
          <div className="text-3xl font-bold tabular-nums">{ultima ? kg.format(ultima.kg) : '—'}<span className="ml-1 text-base">kg</span></div>
          {ultima && <div className="text-xs opacity-70 first-letter:uppercase">{formatData(ultima.data)}</div>}
        </div>
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="text-xs font-semibold uppercase opacity-70">Media 7 giorni</div>
          <div className="text-3xl font-bold tabular-nums">{media !== null ? kg.format(media) : '—'}<span className="ml-1 text-base">kg</span></div>
          <div className="text-xs opacity-70">è la media che conta</div>
        </div>
      </div>

      {pesate.length >= 2 ? (
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          <Grafico pesate={pesate} />
          <p className="mt-1 text-xs opacity-70">
            Punti: pesate · linea: media mobile a 7 giorni · tratteggio: soglie {kg.format(dati.target.sogliaPesoBasso)} e{' '}
            {kg.format(dati.target.sogliaPesoAlto)} kg
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-bordo bg-superficie p-3 text-sm opacity-70">
          Il grafico compare dalla seconda pesata.
        </p>
      )}

      <button type="button" onClick={onApriPeso} className="w-full rounded-xl bg-cho p-3.5 font-bold text-white">
        Inserisci o modifica il peso
      </button>
      <button
        type="button"
        onClick={esporta}
        disabled={pesate.length === 0}
        className="w-full rounded-xl border border-bordo bg-superficie p-3 font-medium disabled:opacity-40"
      >
        Esporta il peso (CSV per il medico)
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Diario

type VoceDiario = { data: string; righe: { pasto: string; testo: string }[] }

function vociDiario(stati: [string, unknown][]): VoceDiario[] {
  return stati
    .filter(([chiave]) => chiave.startsWith('giorno:'))
    .map(([chiave, valore]) => {
      const data = chiave.slice('giorno:'.length)
      const stato = valore as StatoGiorno
      const giorno = cercaGiorno(data)?.giorno
      const righe: VoceDiario['righe'] = []
      for (const [categoria, id] of Object.entries(stato.scelte ?? {})) {
        if (!isCategoriaConId(categoria as CategoriaPasto) || !id) continue
        const delPiano = giorno?.[categoria as 'pranzo']
        righe.push({
          pasto: etichettePasti[categoria as CategoriaPasto],
          testo: delPiano ? `${id} al posto di ${delPiano}` : `${id} scelta`,
        })
      }
      for (const [categoria, valore] of Object.entries(stato.liberi ?? {})) {
        const libero = valore === undefined ? null : comeLibero(valore)
        if (libero?.testo) {
          const cho = libero.cho !== undefined ? ` (${libero.cho} g CHO)` : ''
          righe.push({ pasto: etichettePasti[categoria as CategoriaPasto], testo: `pasto libero: «${libero.testo}»${cho}` })
        }
      }
      if (stato.sgarro && righe.length === 0) righe.push({ pasto: 'Giornata', testo: 'libera' })
      for (const [categoria, testo] of Object.entries(stato.note ?? {})) {
        if (testo) righe.push({ pasto: etichettePasti[categoria as CategoriaPasto], testo: `«${testo}»` })
      }
      return { data, righe }
    })
    .filter((v) => v.righe.length > 0)
    .sort((a, b) => b.data.localeCompare(a.data))
}

function SchedaDiario() {
  const [voci, setVoci] = useState<VoceDiario[] | null>(null)
  useEffect(() => {
    void leggiTutto()
      .catch(() => [])
      .then((tutto) => setVoci(vociDiario(tutto)))
  }, [])

  function esporta() {
    const righe = [...(voci ?? [])].reverse().flatMap((v) => v.righe.map((r) => [v.data, r.pasto, r.testo]))
    void condividiFile(`diet-diario-${voci?.[0]?.data ?? 'vuoto'}.csv`, csv([['Data', 'Pasto', 'Diario'], ...righe]), 'text/csv')
  }

  if (voci === null) return null
  return (
    <div className="space-y-3">
      {voci.length === 0 ? (
        <p className="rounded-xl border border-bordo bg-superficie p-3 text-sm opacity-70">
          Qui compaiono i pasti cambiati rispetto al piano e le note del diario. Per scrivere una nota apri un pasto
          in Oggi.
        </p>
      ) : (
        <ul className="space-y-2">
          {voci.map((voce) => (
            <li key={voce.data}>
              <a href={link.giorno(voce.data)} className="block rounded-xl border border-bordo bg-superficie p-3">
                <div className="font-bold first-letter:uppercase">{formatData(voce.data)}</div>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {voce.righe.map((r, i) => (
                    <li key={i}>
                      <span className="font-semibold">{r.pasto}:</span> {r.testo}
                    </li>
                  ))}
                </ul>
              </a>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={esporta}
        disabled={voci.length === 0}
        className="w-full rounded-xl border border-bordo bg-superficie p-3 font-medium disabled:opacity-40"
      >
        Esporta il diario (CSV)
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function Registro({ pesate, onApriPeso }: { pesate: Pesata[]; onApriPeso: () => void }) {
  const [scheda, setScheda] = useState<'peso' | 'diario'>('peso')
  return (
    <>
      <h1 className="text-xl font-bold">Registro</h1>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-superficie p-1" role="tablist">
        {(['peso', 'diario'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scheda === s}
            onClick={() => setScheda(s)}
            className={`rounded-lg py-2 font-semibold ${scheda === s ? 'bg-cho text-white' : 'opacity-70'}`}
          >
            {s === 'peso' ? 'Peso' : 'Diario pasti'}
          </button>
        ))}
      </div>
      <div className="mt-4">{scheda === 'peso' ? <SchedaPeso pesate={pesate} onApriPeso={onApriPeso} /> : <SchedaDiario />}</div>
    </>
  )
}
