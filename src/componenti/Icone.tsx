// Icone in SVG (a linea da Lucide, licenza ISC; bilancia fornita dall'utente): prendono il colore del testo.
import { useId, type ReactNode } from 'react'

type Props = { className?: string; spessore?: number }

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function IconaPolliceSu({ className = 'h-5 w-5', spessore = 2 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  )
}

export function IconaPolliceGiu({ className = 'h-5 w-5', spessore = 2 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  )
}

/**
 * Bilancia (disegno fornito dall'utente, icon-scale.svg): quadrato arrotondato con il quadrante
 * a mezzaluna e la lancetta. Prende il colore del testo; "quadrante" riempie la mezzaluna.
 */
export function IconaBilancia({ className = 'h-6 w-6', quadrante }: { className?: string; quadrante?: string }) {
  // Id della maschera unico per ogni icona nella pagina (useId può contenere caratteri non validi in url()).
  const maschera = `bilancia-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <mask id={maschera} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" />
          <path d="M150 240A106 106 0 0 1 362 240Z" fill="#000" stroke="#000" strokeWidth="24" strokeLinejoin="round" />
        </mask>
      </defs>
      {quadrante && <path d="M150 240A106 106 0 0 1 362 240Z" fill={quadrante} stroke={quadrante} strokeWidth="24" strokeLinejoin="round" />}
      <rect x="56" y="56" width="400" height="400" rx="112" fill="currentColor" mask={`url(#${maschera})`} />
      <g fill="currentColor" stroke="currentColor" strokeLinecap="round">
        <line x1="256" y1="238" x2="300" y2="172" strokeWidth="30" />
        <circle cx="256" cy="238" r="26" stroke="none" />
      </g>
    </svg>
  )
}

export function IconaFrecciaGiu({ className = 'h-4 w-4', spessore = 2 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  )
}

export function IconaFrecciaSu({ className = 'h-4 w-4', spessore = 2 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

export function IconaUguale({ className = 'h-4 w-4', spessore = 2 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <path d="M5 9h14" />
      <path d="M5 15h14" />
    </svg>
  )
}

/**
 * Fonte proteica del pasto (dati.json → tipiProteina): vasetto di yogurt, spicchio di formaggio,
 * coscia di pollo, pesce, legumi, uovo, mandorla. Disegnate a linea come le altre.
 */
export function IconaProteina({ tipo, className = 'h-3.5 w-3.5' }: { tipo: string; className?: string }) {
  const disegni: Record<string, ReactNode> = {
    latticini: (
      <>
        <path d="M5 4h14v3H5z" />
        <path d="M6 7l1.5 13h9L18 7" />
        <path d="M8.5 12h7" />
      </>
    ),
    formaggio: (
      <>
        <path d="M3 17l8-11 10 4v7H3z" />
        <path d="M3 17l8-11" />
        <circle cx="12.5" cy="13" r="1.2" />
        <circle cx="17" cy="14.5" r="0.9" />
      </>
    ),
    carne: (
      <>
        <ellipse cx="15" cy="9" rx="6" ry="4.5" transform="rotate(-45 15 9)" />
        <path d="M11 13l-4 4" />
        <circle cx="5.4" cy="17.2" r="1.6" />
        <circle cx="6.8" cy="18.6" r="1.6" />
      </>
    ),
    pesce: (
      <>
        <path d="M3 12c2.5-4 7-5.5 11.5-4.5 2 .5 3.5 2 4.5 4.5-1 2.5-2.5 4-4.5 4.5C10 17.5 5.5 16 3 12z" />
        <path d="M19 12l3-3v6z" />
        <circle cx="7.5" cy="11" r="0.6" />
      </>
    ),
    legumi: (
      <>
        <ellipse cx="7" cy="14" rx="3" ry="4" transform="rotate(-20 7 14)" />
        <ellipse cx="14" cy="8.5" rx="3" ry="4" transform="rotate(25 14 8.5)" />
        <ellipse cx="16.5" cy="17" rx="3" ry="3.5" />
      </>
    ),
    uova: <path d="M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.5 8.5 3 12 3z" />,
    fruttaSecca: (
      <>
        <path d="M12 3c4 3 6 7 4.5 11.5C15.5 18 13 21 12 21s-3.5-3-4.5-6.5C6 10 8 6 12 3z" />
        <path d="M12 7v10" />
      </>
    ),
  }
  if (!disegni[tipo]) return null
  return (
    <svg {...base} strokeWidth={2} className={className}>
      {disegni[tipo]}
    </svg>
  )
}
