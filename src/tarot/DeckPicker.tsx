import { useState } from 'react'
import type { DeckManifest } from '../types/tarot'
import { CrystalCard } from './CrystalCard'
import { appPath } from '../paths'

export function DeckPicker({ manifest, cardBackUrl }: { manifest: DeckManifest; cardBackUrl: string }) {
  const [selectedDeckId, setSelectedDeckId] = useState(manifest.id)
  const isSelected = selectedDeckId === manifest.id
  const sampleCard = manifest.cards[0]

  return <section className="deck-picker panel" aria-labelledby="deck-picker-title">
    <div className="deck-picker-heading">
      <span className="panel-label" id="deck-picker-title"><span className="label-mark" aria-hidden="true">◈</span>Choose a deck</span>
      <a className="deck-picker-explore" href={appPath('gallery/crystal-geometry')}>Explore Deck</a>
    </div>
    <div className="deck-picker-body">
      <div className="deck-options" role="group" aria-label="Available decks">
        <button className={`deck-option${isSelected ? ' selected' : ''}`} type="button" aria-pressed={isSelected} onClick={() => setSelectedDeckId(manifest.id)}>
          <span className="deck-option-symbol" aria-hidden="true">✧</span>
          <span className="deck-option-copy"><strong>Crystal Geometry</strong><small>{isSelected ? 'Active deck' : 'Select deck'}</small></span>
          <span className="deck-option-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
        </button>
      </div>
      {isSelected && <div className="deck-design-preview" role="group" aria-label="Crystal Geometry card design">
        <figure className="deck-sample">
          <div className="deck-sample-art"><CrystalCard card={sampleCard} animations={false} /></div>
          <figcaption>Front</figcaption>
        </figure>
        <figure className="deck-sample">
          <div className="deck-sample-art"><img src={cardBackUrl} alt="" /></div>
          <figcaption>Back</figcaption>
        </figure>
      </div>}
    </div>
  </section>
}
