// Icone in SVG (a linea da Lucide, licenza ISC; bilancia fornita dall'utente): prendono il colore del testo.
import { useId } from 'react'

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
