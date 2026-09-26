import { describe, expect, it } from 'vitest'
import { formatReading } from './formatter'
import { mapReading } from './mapping'
import { cardMeanings } from './meanings'
import { parseSpread } from './parser'
import { createReadyDeck, drawCards, performShuffleStep, remainingCards, secureShuffle } from './shuffle'
import type { DeckCard, RuntimeCard } from '../types/tarot'
import cathedralDeck from '../../public/decks/cathedral/deck.json'
import nocturneDeck from '../../public/decks/nocturne/deck.json'

const cards: DeckCard[] = Array.from({ length: 78 }, (_, number) => ({
  id: `card-${number}`, name: `Card ${number}`, arcana: number < 22 ? 'major' : 'minor', number,
}))

describe('Cathedral deck', () => {
  it('keeps Nocturne as a complete alternate with the same ordered card identities', () => {
    expect(cathedralDeck.cards).toHaveLength(78)
    expect(nocturneDeck.cards).toHaveLength(78)
    expect(new Set(nocturneDeck.cards.map((card) => card.id)).size).toBe(78)
    expect(nocturneDeck.cards.map((card) => card.id)).toEqual(cathedralDeck.cards.map((card) => card.id))
    expect(nocturneDeck.cards.every((card) => card.visual?.theme === 'nocturne')).toBe(true)
  })

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

  it('uses Fisher–Yates with injected indices and leaves its input untouched', () => {
    const original = [0, 1, 2, 3]
    const bounds: number[] = []
    expect(secureShuffle(original, (bound) => { bounds.push(bound); return 0 })).toEqual([1, 2, 3, 0])
    expect(bounds).toEqual([4, 3, 2])
    expect(original).toEqual([0, 1, 2, 3])
  })

  it('creates a fully shuffled 78 card deck with independently randomized orientations', () => {
    const original = cards.map((card) => ({ ...card }))
    let orientationIndex = 0
    const bounds: number[] = []
    const deck = createReadyDeck(cards, 456, (bound) => {
      bounds.push(bound)
      return bounds.length > 77 ? orientationIndex++ % 2 : 0
    })
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.map((card) => card.id)).toEqual([...cards.slice(1), cards[0]].map((card) => card.id))
    expect(deck.cards.map((card) => card.orientation)).toEqual(cards.map((_, index) => index % 2 ? 'reversed' : 'upright'))
    expect(bounds).toEqual([...Array.from({ length: 77 }, (_, index) => 78 - index), ...Array(78).fill(2)])
    expect(cards).toEqual(original)
    expect(deck.cards[0]).not.toBe(cards[1])
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

  it('shuffles only the undrawn cards and rerolls every remaining orientation', () => {
    const ready = createReadyDeck(cards, 789, () => 0)
    const dealt = drawCards(ready, 4)
    const original = structuredClone(dealt.deck)
    const bounds: number[] = []
    const stepped = performShuffleStep(dealt.deck, (bound) => { bounds.push(bound); return bounds.length > 73 ? 1 : 0 })
    expect(stepped.cards.slice(0, 4)).toEqual(dealt.deck.cards.slice(0, 4))
    expect(stepped.cards.slice(0, 4).every((card, index) => card === dealt.deck.cards[index])).toBe(true)
    expect(stepped.cards.slice(4).map((card) => card.id)).toEqual([
      ...dealt.deck.cards.slice(5), dealt.deck.cards[4],
    ].map((card) => card.id))
    expect(stepped.cards.slice(4).every((card) => card.orientation === 'reversed')).toBe(true)
    expect(bounds).toEqual([...Array.from({ length: 73 }, (_, index) => 74 - index), ...Array(74).fill(2)])
    expect(stepped.cards).toHaveLength(78)
    expect(new Set(stepped.cards.map((card) => card.id)).size).toBe(78)
    expect(stepped.nextCardIndex).toBe(4)
    expect(stepped.resetAt).toBe(789)
    expect(stepped.cards.every((card) => card.name.startsWith('Card '))).toBe(true)
    expect(dealt.deck).toEqual(original)
    expect(stepped).not.toBe(dealt.deck)
  })

  it('rerolls the final undrawn card without changing drawn cards', () => {
    const deck = { ...createReadyDeck(cards, 123, () => 0), nextCardIndex: 77 }
    const stepped = performShuffleStep(deck, () => 1)
    expect(stepped.cards.slice(0, 77)).toEqual(deck.cards.slice(0, 77))
    expect(stepped.cards[77]).toMatchObject({ id: deck.cards[77].id, orientation: 'reversed' })
    expect(deck.cards[77].orientation).toBe('upright')
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

  it('parses a plain first-line title and includes it in copied reading', () => {
    const spread = parseSpread('Current Direction\n\n1. What energy surrounds this situation?')!
    const reading = mapReading([{ ...cards[0], orientation: 'upright' } as RuntimeCard], spread)
    expect(spread.title).toBe('Current Direction')
    expect(formatReading(reading, spread)).toBe('Current Direction\n\n1. What energy surrounds this situation?\nCard 0')
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
