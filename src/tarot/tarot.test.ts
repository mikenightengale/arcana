import { describe, expect, it } from 'vitest'
import { formatReading } from './formatter'
import { mapReading } from './mapping'
import { cardMeanings } from './meanings'
import { parseSpread } from './parser'
import { createReadyDeck, drawCards, performShuffleStep, remainingCards } from './shuffle'
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

  it('creates an ordered 78 card deck without pre-shuffling or assigning reversals', () => {
    const deck = createReadyDeck(cards, 456)
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.map((card) => card.id)).toEqual(cards.map((card) => card.id))
    expect(deck.cards.every((card) => card.orientation === 'upright')).toBe(true)
    expect(deck.nextCardIndex).toBe(0)
    expect(deck.resetAt).toBe(456)
  })

  it('rejects malformed decks and prevents repeat draws past the remaining cards', () => {
    expect(() => createReadyDeck(cards.slice(0, 77))).toThrow(/78 cards/)
    const deck = createReadyDeck(cards)
    const first = drawCards(deck, 12)
    const second = drawCards(first.deck, 9)
    expect(first.cards.map((card) => card.id)).not.toEqual(second.cards.map((card) => card.id))
    expect(remainingCards(second.deck)).toBe(57)
    expect(() => drawCards(second.deck, 58)).toThrow(/Only 57 cards remain/)
  })

  it('starts in manifest order and each overhand step changes only the undrawn cards', () => {
    const ready = createReadyDeck(cards, 789)
    const dealt = drawCards(ready, 4)
    const stepped = performShuffleStep(dealt.deck, () => 0)
    expect(stepped.cards.slice(0, 4)).toEqual(dealt.deck.cards.slice(0, 4))
    expect(stepped.cards.slice(4).map((card) => card.id)).not.toEqual(dealt.deck.cards.slice(4).map((card) => card.id))
    expect(stepped.cards).toHaveLength(78)
    expect(stepped.nextCardIndex).toBe(4)
    expect(stepped.resetAt).toBe(789)
    expect(stepped.cards.every((card) => card.name.startsWith('Card '))).toBe(true)
  })

  it('preserves all 78 unique cards through many discrete shuffle steps', () => {
    let deck = createReadyDeck(cards)
    for (let step = 0; step < 600; step += 1) deck = performShuffleStep(deck)
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.every((card) => card.orientation === 'upright' || card.orientation === 'reversed')).toBe(true)
  })

  it('draws the frozen order without changing it and preserves remaining-card state', () => {
    let frozen = createReadyDeck(cards)
    for (let step = 0; step < 40; step += 1) frozen = performShuffleStep(frozen)
    const expected = frozen.cards.slice(0, 7)
    const firstDraw = drawCards(frozen, 3)
    const secondDraw = drawCards(firstDraw.deck, 4)
    expect([...firstDraw.cards, ...secondDraw.cards]).toEqual(expected)
    expect(secondDraw.deck.cards).toEqual(frozen.cards)
    expect(remainingCards(secondDraw.deck)).toBe(71)
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
