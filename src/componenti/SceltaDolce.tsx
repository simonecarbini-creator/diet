// Elenco dei dolci da aggiungere a pranzo o cena: i CHO si sommano alla giornata.
// Per ogni dolce si vede dove arriva la giornata rispetto al piano.
import { dolci } from '../dati'
import { formatNumero } from '../formato'
import { targetGiorno, valutaAlternativa } from '../giornata'
import { NumeriPasto } from './NumeriPasto'
import { BoxGiornata, type ContestoGiornata } from './PannelloScelta'
import { Popup } from './Popup'

type Props = {
  /** "pranzo" o "cena", per i titoli. */
  nomePasto: string
  /** CHO e kcal della giornata con questo pasto ma senza il suo dolce. */
  giornataSenzaDolce?: { cho: number; kcal: number }
  giornata?: ContestoGiornata
  attuale?: string
  onScegli: (id: string) => void
  onChiudi: () => void
}

export function SceltaDolce({ nomePasto, giornataSenzaDolce, giornata, attuale, onScegli, onChiudi }: Props) {
  const target = giornata ? targetGiorno(giornata.piano) : null
  return (
    <Popup titolo={`Aggiungi un dolce ${nomePasto === 'cena' ? 'alla' : 'al'} ${nomePasto}`} onChiudi={onChiudi} conConferma={false}>
      <p className="text-sm opacity-70">Si aggiunge al pasto, non lo sostituisce: i suoi CHO si sommano alla giornata.</p>
      <ul className="space-y-2">
        {dolci().map((dolce) => (
          <li key={dolce.id}>
            <button
              type="button"
              onClick={() => onScegli(dolce.id)}
              className={`w-full rounded-xl border-2 bg-superficie p-3 text-left ${dolce.id === attuale ? 'border-cho' : 'border-bordo'}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug">{dolce.nome}</div>
                  <div className="text-sm opacity-70">
                    {dolce.alimenti.map((a) => (a.grammi ? `${formatNumero(a.grammi)} g` : '')).join(' ')} · {formatNumero(dolce.kcal)} kcal
                  </div>
                </div>
                <NumeriPasto cho={dolce.cho} proteine={dolce.proteine} />
              </div>
              {target && giornataSenzaDolce && (
                <BoxGiornata titolo="La giornata con questo dolce" totale={valutaAlternativa(giornataSenzaDolce, dolce, target)} target={target} />
              )}
              {dolce.note && <p className="mt-1 text-sm opacity-70">{dolce.note}</p>}
            </button>
          </li>
        ))}
      </ul>
    </Popup>
  )
}
