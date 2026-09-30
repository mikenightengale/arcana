import { useEffect, useState } from 'react'
import { CrystalCard } from './CrystalCard'
import type { DeckCard } from '../types/tarot'
import { appPath, assetPath } from '../paths'

const gallerySections = [
  { id: 'major', label: 'Major', select: (card: DeckCard) => card.arcana === 'major' },
  { id: 'wands', label: 'Wands', select: (card: DeckCard) => card.arcana === 'minor' && card.suit === 'wands' },
  { id: 'cups', label: 'Cups', select: (card: DeckCard) => card.arcana === 'minor' && card.suit === 'cups' },
  { id: 'swords', label: 'Swords', select: (card: DeckCard) => card.arcana === 'minor' && card.suit === 'swords' },
  { id: 'pentacles', label: 'Pentacles', select: (card: DeckCard) => card.arcana === 'minor' && card.suit === 'pentacles' },
] as const

export function DeckGallery({ deckId, deckName, cards, cardBackUrl, onReturn }: { deckId: string; deckName: string; cards: DeckCard[]; cardBackUrl: string; onReturn: () => void }) {
  const [animations, setAnimations] = useState(true)
  const [reversed, setReversed] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [enlarged, setEnlarged] = useState<DeckCard | null>(null)
  const [activeSection, setActiveSection] = useState('major')

  const sections = gallerySections.map((section) => ({ ...section, cards: cards.filter(section.select) }))
  const displayIndexes = new Map(sections.flatMap((section) => section.cards).map((card, index) => [card.id, index + 1]))

  useEffect(() => {
    const updateActiveSection = () => {
      const navBottom = document.querySelector<HTMLElement>('.gallery-section-nav')?.getBoundingClientRect().bottom ?? 0
      const readingEdge = navBottom + 40
      let nextSection: string = gallerySections[0].id

      for (const section of gallerySections) {
        const heading = document.getElementById(`gallery-section-${section.id}`)
        if (heading && heading.getBoundingClientRect().top <= readingEdge) nextSection = section.id
      }

      setActiveSection((current) => current === nextSection ? current : nextSection)
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    updateActiveSection()
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])

  useEffect(() => {
    if (!enlarged) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setEnlarged(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [enlarged])

  return <div className={`app-shell gallery-shell gallery-${deckId}`}>
    <header className="gallery-header"><a className="brand" href={appPath()} onClick={(event) => { event.preventDefault(); onReturn() }} aria-label="Arcana home"><img className="brand-logo" src={assetPath('icons/arcana.svg')} alt="" /><span><strong>Arcana</strong></span></a><div className="gallery-heading"><span className="eyebrow"><span/> THE {deckName.replace(/^the\s+/i, '').toUpperCase()} DECK <span/></span><h1>Forms of the <em>arcana</em></h1><p>{deckId === 'nocturne' ? 'Seventy-eight nocturnes in silver and shadow.' : deckId === 'veil' ? 'Seventy-eight thresholds between seen and unseen.' : 'All 78 cards, rendered in crystalline geometry.'}</p></div><button className="text-button gallery-return" onClick={onReturn}>Return to the table</button></header>
    <main className="gallery-main">
      <div className="gallery-toolbar" aria-label="Gallery controls">
        <button className={animations ? 'gallery-control selected' : 'gallery-control'} aria-pressed={animations} onClick={() => setAnimations((value) => !value)}><span className="control-orb">✧</span>Motion <strong>{animations ? 'On' : 'Off'}</strong></button>
        <button className={reversed ? 'gallery-control selected' : 'gallery-control'} aria-pressed={reversed} onClick={() => setReversed((value) => !value)}><span className="control-orb">↻</span>Orientation <strong>{reversed ? 'Reversed' : 'Upright'}</strong></button>
        <button className={showBack ? 'gallery-control selected' : 'gallery-control'} aria-pressed={showBack} onClick={() => setShowBack((value) => !value)}><span className="control-orb">◈</span>Side <strong>{showBack ? 'Back' : 'Front'}</strong></button>
        <span className="gallery-hint">Select a card to enlarge</span>
      </div>
      <nav className="gallery-section-nav" aria-label="Gallery sections">
        {sections.map((section) => <a key={section.id} href={`#gallery-section-${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} onClick={() => setActiveSection(section.id)}>{section.label}</a>)}
      </nav>
      <section className="gallery-collection" aria-label={`All 78 ${deckName} tarot cards`}>
        {sections.map((section) => <section className="gallery-section" key={section.id} aria-labelledby={`gallery-section-${section.id}`}>
          <h2 className="gallery-section-heading" id={`gallery-section-${section.id}`}>{section.label}<span>{section.cards.length}</span></h2>
          <div className="gallery-grid">
            {section.cards.map((card) => <article className="gallery-card" key={card.id}>
              <button className="gallery-card-button" onClick={() => setEnlarged(card)} aria-label={`Enlarge ${card.name}`}>
                <span className="gallery-art-wrap">{showBack ? <img className={`gallery-back ${reversed ? 'reversed-art' : ''}`} src={cardBackUrl} alt="" /> : <CrystalCard card={card} reversed={reversed} animations={animations} />}</span>
                <span className="gallery-card-meta"><span className="gallery-index">{String(displayIndexes.get(card.id) ?? 0).padStart(2, '0')}</span><span><strong>{card.name}</strong><small>{card.arcana === 'major' ? 'MAJOR ARCANA' : `${card.rank?.toUpperCase()} OF ${card.suit?.toUpperCase()}`}</small></span></span>
              </button>
            </article>)}
          </div>
        </section>)}
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
