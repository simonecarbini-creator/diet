// Icone a linea in SVG (disegno da Lucide, licenza ISC): prendono il colore del testo.
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

/** Peso con maniglia (icona "weight" di Lucide). */
export function IconaBilancia({ className = 'h-6 w-6', spessore = 1.75 }: Props) {
  return (
    <svg {...base} strokeWidth={spessore} className={className}>
      <circle cx="12" cy="5" r="3" />
      <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" />
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
