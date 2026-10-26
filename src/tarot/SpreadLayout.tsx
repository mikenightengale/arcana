import { useState } from 'react'
import type { ReadingPosition, TarotSpread } from '../types/tarot'
import { CrystalCard } from './CrystalCard'
import { getCardMeaning } from './meanings'

/** Layout transforms never change a card's logical orientation or drawing order. */
export function SpreadLayout({ spread, reading = [], onQuestionChange, cardBackUrl }: {
  spread: TarotSpread; reading?: ReadingPosition[]; onQuestionChange?: (id: string, question: string) => void; cardBackUrl?: string
}) {
  const [selected, setSelected] = useState<string | undefined>()
  const positions = [...spread.positions].sort((a,b) => (a.displayOrder ?? a.number) - (b.displayOrder ?? b.number))
  const active = positions.find(p => p.id === selected) ?? positions[0]
  const cards = new Map(reading.map(entry => [entry.position?.id, entry.card]))
  // Rotated card bounds include room for the horizontal crossing card.
  const minX = Math.min(...positions.map(p => p.layout?.x ?? 0)) - 55
  const minY = Math.min(...positions.map(p => p.layout?.y ?? 0)) - 40
  const width = Math.max(...positions.map(p => p.layout?.x ?? 0)) - minX + 170
  const height = Math.max(...positions.map(p => p.layout?.y ?? 0)) - minY + 230
  const activeCard = cards.get(active?.id)
  return <section className="spread-layout" aria-label={`${spread.title} layout`}>
    <p className="field-hint">Select a position to inspect it. Scroll the table sideways on smaller screens, or use the position list below.</p>
    <div className="spread-layout-scroll" tabIndex={0} role="region" aria-label="Scrollable spread table">
      <div className="spread-canvas" style={{ width, height }}>
        {positions.map(p => {
          const card = cards.get(p.id)
          return <button type="button" key={p.id} className="spread-slot" aria-label={`Position ${p.number}: ${p.title}${card ? `, ${card.name}${card.orientation === 'reversed' ? ', reversed' : ''}` : ', undrawn'}`} aria-pressed={active?.id === p.id}
            style={{ left: (p.layout?.x ?? 0) - minX, top: (p.layout?.y ?? 0) - minY, transform: `rotate(${p.layout?.rotation ?? 0}deg)`, zIndex: p.layout?.layer ?? 0 }} onClick={() => setSelected(p.id)}>
            {card ? <><CrystalCard card={card} reversed={card.orientation === 'reversed'} reveal animations={false} showLabels /><span className="drawn-position-number" aria-hidden="true">{p.number}</span></> : <>{cardBackUrl && <img src={cardBackUrl} alt="" />}<span className="slot-number">{p.number}</span></>}
            <span className="visually-hidden">{p.question}</span>
          </button>
        })}
      </div>
    </div>
    <div className="spread-position-list" role="group" aria-label="Spread positions">
      {positions.map(p => <button type="button" key={p.id} aria-pressed={active?.id === p.id} onClick={() => setSelected(p.id)}>{p.number}. {p.title}</button>)}
    </div>
    {active && <div className="spread-position-detail" aria-live="polite">
      <h3>{active.number}. {active.title}</h3><p>{active.meaning}</p>
      {onQuestionChange ? <label>Question for {active.title}<textarea value={active.question} onChange={e => onQuestionChange(active.id!, e.target.value)} /></label> : <p>{active.question}</p>}
      {activeCard && <><strong>{activeCard.name}{activeCard.orientation === 'reversed' ? ' — Reversed' : ''}</strong><p>{getCardMeaning(activeCard.id, activeCard.orientation)}</p></>}
    </div>}
  </section>
}
