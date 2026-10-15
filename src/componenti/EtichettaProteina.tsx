// Etichetta con icona della fonte proteica del pasto (pesce, carne, legumi...), accanto al codice.
import { etichettaProteina } from '../dati'
import { IconaProteina } from './Icone'

export function EtichettaProteina({ tipo }: { tipo?: string }) {
  const etichetta = tipo ? etichettaProteina(tipo) : undefined
  if (!tipo || !etichetta) return null
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-bordo px-1.5 py-0.5 align-middle text-xs font-medium">
      <IconaProteina tipo={tipo} />
      {etichetta}
    </span>
  )
}
