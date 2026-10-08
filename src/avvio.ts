// Fine della schermata di avvio: le animazioni d'arrivo (es. il giorno di oggi nella
// Settimana) partono solo quando il logo è sparito, altrimenti nessuno le vedrebbe.
let risolvi: () => void = () => {}

export const avvioChiuso = new Promise<void>((r) => {
  risolvi = r
})

export function segnalaAvvioChiuso() {
  risolvi()
}
