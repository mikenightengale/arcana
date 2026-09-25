import { describe, expect, it, vi } from 'vitest'
import { formatReading } from './formatter'
import { mapReading } from './mapping'
import { cardMeanings } from './meanings'
import { parseSpread } from './parser'
import { createShuffledDeck, drawCards, remainingCards } from './shuffle'
import type { DeckCard, RuntimeCard } from '../types/tarot'
import cathedralDeck from '../../public/decks/cathedral/deck.json'

const cards: DeckCard[] = Array.from({ length: 78 }, (_, number) => ({
  id: `card-${number}`, name: `Card ${number}`, arcana: number < 22 ? 'major' : 'minor', number,
}))

describe('Cathedral deck', () => {
  it('has upright and reversed guide meanings for every manifest card', () => {
    expect(Object.keys(cardMeanings)).toHaveLength(cathedralDeck.cards.length)
    for (const card of cathedralDeck.cards) {
      const meaning = cardMeanings[card.id as keyof typeof cardMeanings]
      expect(meaning, `meaning for ${card.id}`).toMatchObject({
        upright: expect.any(String),
        reversed: expect.any(String),
      })
      expect(meaning?.upright.trim()).not.toBe('')
      expect(meaning?.reversed.trim()).not.toBe('')
    }
  })

  it('creates a 78 card shuffled deck with a fixed orientation on each card', () => {
    vi.stubGlobal('crypto', { getRandomValues<T extends ArrayBufferView>(values: T) { new Uint32Array(values.buffer, values.byteOffset, values.byteLength / 4).fill(123); return values } })
    const deck = createShuffledDeck(cards, 456)
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.every((card) => card.orientation === 'reversed')).toBe(true)
    expect(deck.nextCardIndex).toBe(0)
    expect(deck.resetAt).toBe(456)
    vi.unstubAllGlobals()
  })

  it('rejects malformed decks and prevents repeat draws past the remaining cards', () => {
    expect(() => createShuffledDeck(cards.slice(0, 77))).toThrow(/78 cards/)
    vi.stubGlobal('crypto', { getRandomValues<T extends ArrayBufferView>(values: T) { new Uint32Array(values.buffer, values.byteOffset, values.byteLength / 4).fill(0); return values } })
    const deck = createShuffledDeck(cards)
    const first = drawCards(deck, 12)
    const second = drawCards(first.deck, 9)
    expect(first.cards.map((card) => card.id)).not.toEqual(second.cards.map((card) => card.id))
    expect(remainingCards(second.deck)).toBe(57)
    expect(() => drawCards(second.deck, 58)).toThrow(/Only 57 cards remain/)
    vi.unstubAllGlobals()
  })
})

describe('spread parsing and reading output', () => {
  it('parses ChatGPT markdown with headings, bold positions, and multiline questions', () => {
    expect(parseSpread('## Tarot Spread — “Current Direction”\n\n1. **Current Energy**\n   What is the dominant energy\n   surrounding this situation?\n\n2. Hidden Influence\n   What is moving beneath the surface?')).toEqual({
      title: 'Current Direction', positions: [
        { number: 1, title: 'Current Energy', question: 'What is the dominant energy surrounding this situation?' },
        { number: 2, title: 'Hidden Influence', question: 'What is moving beneath the surface?' },
      ],
    })
  })

  it('copies only numbered questions and card results for spreads', () => {
    const spread = parseSpread('# Three cards\n1. **Now**\nWhat is present?\n2. **Next**\nWhat is forming?')!
    const drawn = [0, 1].map((index) => ({ ...cards[index], orientation: index ? 'reversed' : 'upright' })) as RuntimeCard[]
    const reading = mapReading(drawn, spread)
    expect(reading[1].position?.title).toBe('Next')
    expect(formatReading(reading, spread)).toBe('Three cards\n\n1. What is present?\nCard 0\n\n2. What is forming?\nCard 1 — Reversed')
    expect(formatReading(reading, spread)).not.toMatch(/Tarot Spread|\*\*Now\*\*|\*\*Next\*\*|Position:|Card:/)
  })

  it('formats spread questions the same whether or not the spread has a title', () => {
    const spread = parseSpread('1. What should I notice?')!
    const reading = mapReading([{ ...cards[0], orientation: 'upright' } as RuntimeCard], spread)
    expect(formatReading(reading, spread)).toBe('1. What should I notice?\nCard 0')
  })

  it('keeps open draws numbered', () => {
    const drawn = [0, 1].map((index) => ({ ...cards[index], orientation: index ? 'reversed' : 'upright' })) as RuntimeCard[]
    const reading = mapReading(drawn, null)
    expect(formatReading(reading, null)).toBe('1. Card 0\n2. Card 1 — Reversed')
  })

  it('returns null for text without numbered positions', () => {
    expect(parseSpread('A quiet question for the cards.')).toBeNull()
  })
})
