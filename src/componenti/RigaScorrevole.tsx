// Riga che si nasconde con uno swipe da destra verso sinistra: scorre via, poi si chiude
// in altezza così le righe sotto salgono. Il movimento verticale resta della pagina.
// Con "Riduci movimento" sparisce senza animazioni.
import { useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  onNascondi: () => void
  /** Movimento che suggerisce il gesto; ogni volta che il numero cambia si ripete. */
  accenno?: number
  /** Appena ripristinata: ricompare con una breve dissolvenza. */
  ripristinata?: boolean
}

const SOGLIA = 0.35 // frazione della larghezza oltre la quale la riga si nasconde

export function RigaScorrevole({ children, onNascondi, accenno = 0, ripristinata = false }: Props) {
  const [spostamento, setSpostamento] = useState(0)
  const [fase, setFase] = useState<'ferma' | 'trascina' | 'esce' | 'chiude'>('ferma')
  const riga = useRef<HTMLDivElement>(null)
  const inizio = useRef<{ x: number; y: number; direzione: 'orizzontale' | 'verticale' | null } | null>(null)
  const trascinata = useRef(false)

  const riduciMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function nascondi() {
    if (riduciMovimento()) onNascondi()
    else setFase('esce')
  }

  return (
    <li
      className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none ${
        fase === 'chiude' ? 'grid-rows-[0fr] opacity-0 [margin-top:-0.5rem]' : 'grid-rows-[1fr]'
      } ${ripristinata ? 'compari' : ''}`}
      onTransitionEnd={(e) => {
        if (fase === 'chiude' && e.target === e.currentTarget && e.propertyName === 'grid-template-rows') onNascondi()
      }}
    >
      <div className="relative min-h-0 overflow-hidden rounded-xl">
        {/* Sotto la riga, mentre scorre: cosa succede lasciandola andare. */}
        <div className="absolute inset-0 flex items-center justify-end rounded-xl bg-ko pr-5 font-semibold text-white" aria-hidden="true">
          Nascondi
        </div>
        <div
          // Cambiando la chiave l'elemento si ricrea e l'animazione di accenno riparte.
          key={`accenno-${accenno}`}
          ref={riga}
          style={{
            transform: fase === 'esce' ? 'translateX(-110%)' : `translateX(${spostamento}px)`,
            touchAction: 'pan-y',
          }}
          className={`relative ${fase === 'trascina' ? '' : 'transition-transform duration-200 ease-out'} ${
            accenno > 0 && fase === 'ferma' && spostamento === 0 ? 'accenno-swipe' : ''
          }`}
          onTransitionEnd={(e) => {
            if (fase === 'esce' && e.propertyName === 'transform') setFase('chiude')
          }}
          onPointerDown={(e) => {
            inizio.current = { x: e.clientX, y: e.clientY, direzione: null }
            trascinata.current = false
          }}
          onPointerMove={(e) => {
            const i = inizio.current
            if (!i) return
            const dx = e.clientX - i.x
            const dy = e.clientY - i.y
            if (i.direzione === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
              i.direzione = Math.abs(dx) > Math.abs(dy) ? 'orizzontale' : 'verticale'
              if (i.direzione === 'orizzontale') {
                setFase('trascina')
                e.currentTarget.setPointerCapture(e.pointerId)
              }
            }
            if (i.direzione === 'orizzontale') {
              trascinata.current = true
              setSpostamento(Math.min(0, dx))
            }
          }}
          onPointerUp={() => {
            const larghezza = riga.current?.offsetWidth ?? 1
            if (inizio.current?.direzione === 'orizzontale' && -spostamento > larghezza * SOGLIA) nascondi()
            else setFase('ferma')
            setSpostamento(0)
            inizio.current = null
          }}
          onPointerCancel={() => {
            setFase('ferma')
            setSpostamento(0)
            inizio.current = null
          }}
          // Dopo uno swipe il tocco non deve anche selezionare l'alternativa.
          onClickCapture={(e) => {
            if (trascinata.current) {
              e.stopPropagation()
              e.preventDefault()
              trascinata.current = false
            }
          }}
        >
          {children}
        </div>
      </div>
    </li>
  )
}
