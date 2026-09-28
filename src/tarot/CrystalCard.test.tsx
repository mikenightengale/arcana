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

  it('renders The Veil with a sparse starfield, doubled forms, and flowing line treatment', () => {
    const veilCard: DeckCard = {
      ...card,
      visual: { renderer: 'major', theme: 'veil', layout: 'threshold' },
    }
    const { container } = render(<CrystalCard card={veilCard} animations={false} reversed showLabels />)
    const svg = container.querySelector('svg.veil-card')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-label', 'The Fool, reversed')
    expect(svg?.querySelector('.veil-threshold')).not.toBeInTheDocument()
    expect(svg?.querySelector('.veil-thread')).toBeInTheDocument()
    expect(svg).toHaveClass('motion-off')
    const smoke = svg?.querySelector('.veil-art-smoke')
    expect(smoke).toBeInTheDocument()
    expect(smoke).toHaveAttribute('width', '240')
    expect(smoke).toHaveAttribute('height', '384')
    expect(svg?.querySelectorAll('.veil-stars .veil-star')).toHaveLength(44)
    expect(svg?.querySelector('.veil-fabric-lines')).not.toBeInTheDocument()
    expect(svg?.querySelector('.veil-echo')).toBeInTheDocument()
    expect(svg?.querySelector('.veil-drape-left, .veil-drape-right')).not.toBeInTheDocument()
    expect(svg?.querySelector('.veil-title')).toHaveTextContent('THE FOOL')
    expect(svg?.querySelector('g[transform="rotate(180 120 192)"]')).toBeInTheDocument()
    expect(container.querySelector('svg.nocturne-card, svg.crystal-card')).not.toBeInTheDocument()
  })
})
