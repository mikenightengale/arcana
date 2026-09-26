import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CrystalCard } from './CrystalCard'
import type { DeckCard } from '../types/tarot'

const card: DeckCard = { id: 'the-fool', name: 'The Fool', arcana: 'major', number: 0 }

describe('CrystalCard SVG paint servers', () => {
  it('keeps gradient IDs unique when the same card is rendered twice', () => {
    const { container } = render(<><CrystalCard card={card} /><CrystalCard card={card} /></>)
    const gradients = Array.from(container.querySelectorAll('linearGradient, radialGradient'))
    const ids = gradients.map((gradient) => gradient.id)
    expect(new Set(ids).size).toBe(ids.length)
    const cards = container.querySelectorAll('svg.crystal-card')
    expect(cards[0].querySelector('rect')?.getAttribute('fill')).not.toBe(cards[1].querySelector('rect')?.getAttribute('fill'))
  })

  it('renders Nocturne with its own occult SVG frame instead of the Crystal Geometry frame', () => {
    const nocturneCard: DeckCard = {
      ...card,
      visual: { renderer: 'major', theme: 'nocturne', layout: 'nocturne' },
    }
    const { container } = render(<CrystalCard card={nocturneCard} animations={false} />)
    const svg = container.querySelector('svg.nocturne-card')
    expect(svg).toBeInTheDocument()
    expect(svg?.querySelector('.nocturne-corners')).toBeInTheDocument()
    expect(svg?.querySelector('.nocturne-title-plate')).toBeInTheDocument()
    expect(container.querySelector('svg.crystal-card')).not.toBeInTheDocument()
  })
})
