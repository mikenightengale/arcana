import { useEffect, useRef, useState } from 'react'
import type { TarotSpread } from '../types/tarot'
import { createPresetSpread, spreadCategories, spreadLibrary } from './spreads'
import { SpreadLayout } from './SpreadLayout'

export function SpreadLibrary({ spread, onSelect, onBegin, cardBackUrl }: {
  spread: TarotSpread | null; onSelect: (spread: TarotSpread) => void; onBegin: () => void; cardBackUrl: string
}) {
  const [category, setCategory] = useState('All')
  const selected = spread?.presetId ? spread : null
  const previewRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!selected) return
    previewRef.current?.focus({ preventScroll: true })
    previewRef.current?.scrollIntoView?.({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [selected?.presetId])
  return <section className="spread-library panel" aria-labelledby="library-title">
    <h2 id="library-title">Spread Library</h2><p className="field-hint">Choose a shape for your questions. Preview and personalize it before setting the deck.</p>
    <div className="spread-filters" role="group" aria-label="Filter spreads by category">
      {['All', ...spreadCategories].map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}
    </div>
    <div className="spread-library-grid">{spreadLibrary.filter(item => category === 'All' || item.category === category).map(item => <button type="button" className="spread-choice" key={item.id} aria-pressed={selected?.presetId === item.id} onClick={() => onSelect(createPresetSpread(item))}>
      <small>{item.category} · {item.provenance}</small><strong>{item.title}</strong><span>{item.cardCount} tarot cards · {item.difficulty}</span><p>{item.description}</p><small>Use for: {item.useCases.join(' · ')}</small>
    </button>)}</div>
    {selected && <div className="preset-preview">
      <h2 tabIndex={-1} ref={previewRef}>{selected.title}</h2><p>{selected.description}</p><p className="field-hint">Most useful for: {selected.useCases?.join(' · ')}</p>
      <SpreadLayout key={selected.presetId} spread={selected} cardBackUrl={cardBackUrl} onQuestionChange={(id, question) => onSelect({ ...selected, positions: selected.positions.map(p => p.id === id ? { ...p, question } : p) })} />
      <button type="button" className="primary-button" onClick={onBegin} disabled={selected.positions.some(p => !p.question.trim())}>Begin this spread</button>
      {selected.positions.some(p => !p.question.trim()) && <p role="status">Enter a question for every position before beginning.</p>}
    </div>}
  </section>
}
