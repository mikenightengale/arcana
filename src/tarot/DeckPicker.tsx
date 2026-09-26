import type { DeckManifest } from '../types/tarot'
import { CrystalCard } from './CrystalCard'
import { appPath } from '../paths'

function displayName(deck: DeckManifest) {
  return deck.id === 'cathedral' ? 'Crystal Geometry' : deck.name
}

export function DeckPicker({ manifests, selectedDeckId, onSelect }: { manifests: DeckManifest[]; selectedDeckId: string; onSelect: (deckId: string) => void }) {
  const manifest = manifests.find((deck) => deck.id === selectedDeckId) ?? manifests[0]
  const cardBackUrl = appPath(`decks/${manifest.id}/${manifest.cardBack}`)

  return <section className={`deck-picker panel deck-picker-${manifest.id}`} aria-labelledby="deck-picker-title">
    <div className="deck-picker-heading">
      <span className="panel-label" id="deck-picker-title"><span className="label-mark" aria-hidden="true">◈</span>Choose a deck</span>
      <a className="deck-picker-explore" href={appPath(`gallery/${manifest.id}`)}>Explore Deck</a>
    </div>
    <div className="deck-picker-body">
      <div className="deck-options" role="group" aria-label="Available decks">
        {manifests.map((deck) => {
          const isSelected = selectedDeckId === deck.id
          return <button key={deck.id} className={`deck-option deck-option-${deck.id}${isSelected ? ' selected' : ''}`} type="button" aria-pressed={isSelected} onClick={() => onSelect(deck.id)}>
            <span className="deck-option-symbol" aria-hidden="true">{deck.id === 'nocturne' ? '☾' : '✧'}</span>
            <span className="deck-option-copy"><strong>{displayName(deck)}</strong><small>{isSelected ? 'Active deck' : 'Select deck'}</small></span>
            <span className="deck-option-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
          </button>
        })}
      </div>
      <div className="deck-design-preview" role="group" aria-label={`${displayName(manifest)} card design`}>
        <figure className="deck-sample">
          <div className="deck-sample-art"><CrystalCard card={manifest.cards[0]} /></div>
          <figcaption>Front</figcaption>
        </figure>
        <figure className="deck-sample">
          <div className="deck-sample-art"><img src={cardBackUrl} alt="" /></div>
          <figcaption>Back</figcaption>
        </figure>
      </div>
    </div>
  </section>
}
