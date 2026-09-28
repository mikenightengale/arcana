import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReadingPosition } from './types/tarot'
import { ReadingView } from './ReadingView'

describe('The Veil reading card', () => {
  it('uses the theme renderer and keeps reversed orientation accessible', () => {
    const reading: ReadingPosition[] = [{ card: {
      id: 'the-fool', name: 'The Fool', arcana: 'major', number: 0, orientation: 'reversed',
      visual: { renderer: 'major', theme: 'veil', layout: 'threshold' },
    } }]
    const { container } = render(<ReadingView reading={reading} spread={null} onCopy={vi.fn()} onNew={vi.fn()} />)
    expect(container.querySelector('svg.veil-card')).toHaveAttribute('aria-label', 'The Fool, reversed')
    expect(container.querySelector('svg.veil-card g[transform="rotate(180 120 192)"]')).toBeInTheDocument()
  })
})
