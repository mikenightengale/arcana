import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import veilDeck from '../../public/decks/veil/deck.json'
import type { DeckCard } from '../types/tarot'
import { DeckGallery } from './DeckGallery'

describe('The Veil gallery', () => {
  afterEach(cleanup)

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

  it('groups every supplied card under sticky section navigation with matching anchor targets', () => {
    const cards = [
      veilDeck.cards.find((card) => card.arcana === 'major'),
      veilDeck.cards.find((card) => card.suit === 'wands'),
      veilDeck.cards.find((card) => card.suit === 'cups'),
      veilDeck.cards.find((card) => card.suit === 'swords'),
      veilDeck.cards.find((card) => card.suit === 'pentacles'),
    ] as DeckCard[]
    const { container } = render(<DeckGallery
      deckId="veil"
      deckName="The Veil"
      cards={cards}
      cardBackUrl="/decks/veil/backs/veil.svg"
      onReturn={vi.fn()}
    />)

    const labels = ['Major', 'Wands', 'Cups', 'Swords', 'Pentacles']
    const navigation = within(container).getByRole('navigation', { name: 'Gallery sections' })
    const collection = within(container).getByRole('region', { name: 'All 78 The Veil tarot cards' })
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent)).toEqual(labels)

    labels.forEach((label, index) => {
      const id = `gallery-section-${label.toLowerCase()}`
      const link = within(navigation).getByRole('link', { name: label })
      expect(link).toHaveAttribute('href', `#${id}`)
      expect(container.querySelector(`#${id}`)).toHaveTextContent(label)
      const section = within(collection).getByRole('region', { name: new RegExp(`^${label}`) })
      expect(section.querySelectorAll('.gallery-card')).toHaveLength(1)
      expect(within(section).getByRole('button', { name: `Enlarge ${cards[index].name}` })).toBeInTheDocument()
    })

    expect(within(collection).getAllByRole('button', { name: /^Enlarge / })).toHaveLength(cards.length)
  })

  it('updates the current navigation item as section headings pass the sticky bar', () => {
    const { container } = render(<DeckGallery
      deckId="veil"
      deckName="The Veil"
      cards={veilDeck.cards.slice(0, 2) as DeckCard[]}
      cardBackUrl="/decks/veil/backs/veil.svg"
      onReturn={vi.fn()}
    />)
    container.querySelectorAll<HTMLElement>('.gallery-section-heading').forEach((heading) => {
      heading.getBoundingClientRect = () => ({ top: 400, bottom: 420, left: 0, right: 100, width: 100, height: 20, x: 0, y: 400, toJSON: () => ({}) })
    })
    const cupsHeading = container.querySelector<HTMLElement>('#gallery-section-cups')!
    cupsHeading.getBoundingClientRect = () => ({ top: 10, bottom: 30, left: 0, right: 100, width: 100, height: 20, x: 0, y: 10, toJSON: () => ({}) })
    fireEvent.scroll(window)

    expect(within(container).getByRole('link', { name: 'Cups' })).toHaveAttribute('aria-current', 'location')
    expect(within(container).getByRole('link', { name: 'Major' })).not.toHaveAttribute('aria-current')
  })
})
