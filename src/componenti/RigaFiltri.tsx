// Filtri su una sola riga che scorre in orizzontale: ai bordi una sfumatura dice che ce ne
// sono altri nascosti, e sparisce quando si arriva in fondo.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function RigaFiltri({ children, className = '' }: { children: ReactNode; className?: string }) {
  const riga = useRef<HTMLDivElement>(null)
  const [bordi, setBordi] = useState({ sinistra: false, destra: false })

  const misura = () => {
    const el = riga.current
    if (!el) return
    const sinistra = el.scrollLeft > 4
    const destra = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setBordi((b) => (b.sinistra === sinistra && b.destra === destra ? b : { sinistra, destra }))
  }

  useLayoutEffect(() => {
    misura()
    window.addEventListener('resize', misura)
    return () => window.removeEventListener('resize', misura)
  })

  const sfumatura = `linear-gradient(to right, ${bordi.sinistra ? 'transparent, black 2.5rem' : 'black'}, ${
    bordi.destra ? 'black calc(100% - 2.5rem), transparent' : 'black'
  })`

  return (
    <div
      ref={riga}
      onScroll={misura}
      className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ maskImage: sfumatura, WebkitMaskImage: sfumatura }}
    >
      {children}
    </div>
  )
}
