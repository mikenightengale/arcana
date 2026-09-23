import type { DeckCard, DeckState, RuntimeCard } from '../types/tarot'

function secureIndex(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) throw new RangeError('Random bound must be a positive integer.')
  const range = 0x1_0000_0000
  const ceiling = range - (range % maxExclusive)
  const value = new Uint32Array(1)
  do {
    globalThis.crypto.getRandomValues(value)
  } while (value[0] >= ceiling)
  return value[0] % maxExclusive
}

export function createShuffledDeck(cards: DeckCard[], now = Date.now()): DeckState {
  if (cards.length !== 78) throw new Error(`The Cathedral deck must contain 78 cards; found ${cards.length}.`)
  const ids = new Set(cards.map((card) => card.id))
  if (ids.size !== 78) throw new Error('Every card in the deck must have a unique id.')
  const shuffled: RuntimeCard[] = cards.map((card) => ({
    ...card,
    orientation: secureIndex(2) === 0 ? 'upright' : 'reversed',
  }))
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = secureIndex(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return { cards: shuffled, nextCardIndex: 0, resetAt: now }
}

export function drawCards(deck: DeckState, count: number): { deck: DeckState; cards: RuntimeCard[] } {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('Choose at least one card.')
  const remaining = deck.cards.length - deck.nextCardIndex
  if (count > remaining) throw new RangeError(`Only ${remaining} cards remain in the deck.`)
  const cards = deck.cards.slice(deck.nextCardIndex, deck.nextCardIndex + count)
  return { deck: { ...deck, nextCardIndex: deck.nextCardIndex + count }, cards }
}

export function remainingCards(deck: DeckState): number {
  return deck.cards.length - deck.nextCardIndex
}
