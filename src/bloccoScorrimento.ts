// Blocco dello scorrimento della pagina sotto pannelli e finestre. Piu' finestre possono essere
// aperte una sopra l'altra (pannello di scelta + calcolatore + rotella): un contatore condiviso
// sblocca la pagina solo quando si chiude l'ultima, in qualunque ordine si chiudano.
import { useEffect } from 'react'

let aperti = 0

function aggiorna() {
  document.body.style.overflow = aperti > 0 ? 'hidden' : ''
}

export function useBloccoScorrimento(attivo = true) {
  useEffect(() => {
    if (!attivo) return
    aperti++
    aggiorna()
    return () => {
      aperti = Math.max(0, aperti - 1)
      aggiorna()
    }
  }, [attivo])
}
