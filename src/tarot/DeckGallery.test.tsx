import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import veilDeck from '../../public/decks/veil/deck.json'
import type { DeckCard } from '../types/tarot'
import { DeckGallery } from './DeckGallery'

describe('The Veil gallery', () => {
  it('shows the deck description, supports reversed faces, and displays its back', () => {
    const { container } = render(<DeckGallery
      deckId="veil"
      deckName="The Veil"
      cards={veilDeck.cards.slice(0, 2) as DeckCard[]}
      cardBackUrl="/decks/veil/backs/veil.svg"
      onReturn={vi.fn()}
    />)

    expect(screen.getByText('Seventy-eight thresholds between seen and unseen.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'All 78 The Veil tarot cards' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Orientation/ }))
    expect(container.querySelector('svg.veil-card')).toHaveAttribute('aria-label', 'The Fool, reversed')

    fireEvent.click(screen.getByRole('button', { name: /Side/ }))
    expect(container.querySelector('.gallery-back')).toHaveAttribute('src', '/decks/veil/backs/veil.svg')
  })
})
