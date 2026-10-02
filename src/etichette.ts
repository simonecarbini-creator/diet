import type { CategoriaPasto } from './dati'

/** Nomi dei pasti nell'interfaccia. */
export const etichettePasti: Record<CategoriaPasto, string> = {
  preCorsa: 'Pre-corsa',
  colazione: 'Colazione',
  spuntino: 'Spuntino',
  pranzo: 'Pranzo',
  merenda: 'Merenda',
  cena: 'Cena',
  spuntinoSerale: 'Spuntino serale',
}
