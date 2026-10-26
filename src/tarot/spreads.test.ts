import { describe, expect, it } from 'vitest'
import { createPresetSpread, spreadCategories, spreadLibrary, validateSpread } from './spreads'
import { mapReading, readingEntries } from './mapping'
import { formatReading } from './formatter'
import { parseSpread } from './parser'
import type { RuntimeCard } from '../types/tarot'

const cards: RuntimeCard[] = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}`, name: i === 0 ? 'The Fool' : 'The Magician', arcana: 'major', orientation: i % 2 ? 'upright' : 'reversed' }))
describe('spread definitions and reading adapters', () => {
  it('supplies twelve valid presets across all five categories', () => {
    expect(spreadLibrary).toHaveLength(12)
    expect(new Set(spreadLibrary.map(s => s.id)).size).toBe(12)
    expect(new Set(spreadLibrary.map(s => s.category))).toEqual(new Set(spreadCategories))
    expect(spreadLibrary.map(s => s.cardCount)).toEqual([3,5,7,10,9,7,6,8,7,6,9,7])
    for (const spread of spreadLibrary) {
      expect(validateSpread(spread)).toEqual([])
      expect(spread.description.length).toBeGreaterThan(50)
      expect(spread.useCases.length).toBeGreaterThan(0)
      expect(spread.provenance).toBe(spread.category === 'Traditional' ? 'Traditional' : 'Arcana preset')
    }
  })
  it('rejects count, ID, ordering, question, and coordinate errors', () => {
    const spread = structuredClone(spreadLibrary[0])
    spread.cardCount++
    spread.positions[1].id = spread.positions[0].id
    spread.positions[1].drawOrder = 0
    spread.positions[0].displayOrder = 4
    spread.positions[0].question = ' '
    spread.positions[0].layout.x = NaN
    expect(validateSpread(spread)).toHaveLength(5)
  })
  it('snapshots presets independently so edits never mutate definitions', () => {
    const selected = createPresetSpread(spreadLibrary[0])
    selected.positions[0].question = 'My own question?'
    selected.positions[0].layout!.x = -500
    expect(spreadLibrary[0].positions[0].question).not.toBe('My own question?')
    expect(spreadLibrary[0].positions[0].layout.x).toBe(0)
  })
  it('uses a crossing card and four-card vertical staff for Celtic Cross', () => {
    const spread = spreadLibrary.find(s => s.id === 'celtic-cross')!
    expect(spread.positions[1].layout).toMatchObject({ x: spread.positions[0].layout.x, y: spread.positions[0].layout.y, rotation: 90, layer: 2 })
    expect(new Set(spread.positions.slice(6).map(p => p.layout.x)).size).toBe(1)
    expect(new Set(spread.positions.slice(6).map(p => p.layout.y)).size).toBe(4)
  })
  it('maps draws by draw order while displaying and exporting original position order', () => {
    const spread = createPresetSpread(spreadLibrary[0])
    spread.positions[0].drawOrder = 2
    spread.positions[2].drawOrder = 0
    const reading = mapReading(cards.slice(0,3), spread)
    expect(reading.map(r => r.position?.number)).toEqual([3,2,1])
    expect(readingEntries(reading, spread).map(e => e.card?.id)).toEqual(['card-2','card-1','card-0'])
    spread.positions[0].question = 'Describe the roots of this situation'
    const markdown = formatReading(reading, spread)
    expect(markdown).toContain('Category: Traditional')
    expect(markdown).toContain('1. **Past**')
    expect(markdown).toContain('The Fool — Reversed')
    const parsed = parseSpread(markdown)!
    expect(parsed.positions.map(p => [p.title,p.question])).toEqual(spread.positions.map(p => [p.title,p.question]))
    expect(parsed.positions.every(p => p.type !== 'yes-no')).toBe(true)
  })
  it('preserves source ordering for custom mixed readings with repeated numbering', () => {
    const spread = parseSpread('## Tarot Spread — First\n2. What first?\n## Yes/No Questions\n1. Is it done?\n## Tarot Spread — Second\n1. What next?')!
    const reading = mapReading(cards.slice(0,2), spread)
    expect(reading.map(r => r.position?.question)).toEqual(['What first?', 'What next?'])
    expect(readingEntries(reading, spread).map(e => e.card?.id)).toEqual(['card-0',undefined,'card-1'])
  })
})
