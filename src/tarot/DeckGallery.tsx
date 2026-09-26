import { useEffect, useState } from 'react'
import { CrystalCard } from './CrystalCard'
import type { DeckCard } from '../types/tarot'
import { appPath, assetPath } from '../paths'

export function DeckGallery({ deckId, deckName, cards, cardBackUrl, onReturn }: { deckId: string; deckName: string; cards: DeckCard[]; cardBackUrl: string; onReturn: () => void }) {
  const [animations, setAnimations] = useState(true)
  const [reversed, setReversed] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [enlarged, setEnlarged] = useState<DeckCard | null>(null)

  useEffect(() => {
    if (!enlarged) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setEnlarged(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [enlarged])

  return <div className={`app-shell gallery-shell gallery-${deckId}`}>
    <header className="gallery-header"><a className="brand" href={appPath()} onClick={(event) => { event.preventDefault(); onReturn() }} aria-label="Arcana home"><img className="brand-logo" src={assetPath('icons/arcana.svg')} alt="" /><span><strong>Arcana</strong></span></a><div className="gallery-heading"><span className="eyebrow"><span/> THE {deckName.toUpperCase()} DECK <span/></span><h1>Forms of the <em>arcana</em></h1><p>{deckId === 'nocturne' ? 'Seventy-eight nocturnes in silver and shadow.' : 'All 78 cards, rendered in crystalline geometry.'}</p></div><button className="text-button gallery-return" onClick={onReturn}>Return to the table</button></header>
    <main className="gallery-main">
      <div className="gallery-toolbar" aria-label="Gallery controls">
        <button className={animations ? 'gallery-control selected' : 'gallery-control'} aria-pressed={animations} onClick={() => setAnimations((value) => !value)}><span className="control-orb">✧</span>Motion <strong>{animations ? 'On' : 'Off'}</strong></button>
        <button className={reversed ? 'gallery-control selected' : 'gallery-control'} aria-pressed={reversed} onClick={() => setReversed((value) => !value)}><span className="control-orb">↻</span>Orientation <strong>{reversed ? 'Reversed' : 'Upright'}</strong></button>
        <button className={showBack ? 'gallery-control selected' : 'gallery-control'} aria-pressed={showBack} onClick={() => setShowBack((value) => !value)}><span className="control-orb">◈</span>Side <strong>{showBack ? 'Back' : 'Front'}</strong></button>
        <span className="gallery-hint">Select a card to enlarge</span>
      </div>
      <section className="gallery-grid" aria-label={`All 78 ${deckName} tarot cards`}>
        {cards.map((card, index) => <article className="gallery-card" key={card.id}>
          <button className="gallery-card-button" onClick={() => setEnlarged(card)} aria-label={`Enlarge ${card.name}`}>
            <span className="gallery-art-wrap">{showBack ? <img className={`gallery-back ${reversed ? 'reversed-art' : ''}`} src={cardBackUrl} alt="" /> : <CrystalCard card={card} reversed={reversed} animations={animations} />}</span>
            <span className="gallery-card-meta"><span className="gallery-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{card.name}</strong><small>{card.arcana === 'major' ? 'MAJOR ARCANA' : `${card.rank?.toUpperCase()} OF ${card.suit?.toUpperCase()}`}</small></span></span>
          </button>
        </article>)}
      </section>
    </main>
    {enlarged && <div className="gallery-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEnlarged(null) }}>
      <section className="gallery-modal-panel" role="dialog" aria-modal="true" aria-label={`${enlarged.name} enlarged`}>
        <button className="gallery-close" onClick={() => setEnlarged(null)} aria-label="Close enlarged card">×</button>
        <div className="gallery-modal-art">{showBack ? <img src={cardBackUrl} alt="Card back" className="gallery-back"/> : <CrystalCard card={enlarged} reversed={reversed} animations={animations} reveal/>}</div>
        <div className="gallery-modal-copy"><span className="eyebrow"><span/> {enlarged.arcana === 'major' ? 'MAJOR ARCANA' : `${enlarged.suit?.toUpperCase()} · ${enlarged.rank?.toUpperCase()}`} <span/></span><h2>{enlarged.name}</h2><p>Click the controls above to compare its face, orientation, and living details.</p></div>
      </section>
    </div>}
  </div>
}
