import type { DeckCard, DeckState, RuntimeCard } from '../types/tarot'

function secureIndex(maxExclusive: number): number {
  const range = 0x1_0000_0000
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > range) throw new RangeError('Random bound must be between 1 and 2^32.')
  const ceiling = range - (range % maxExclusive)
  const value = new Uint32Array(1)
  do {
    globalThis.crypto.getRandomValues(value)
  } while (value[0] >= ceiling)
  return value[0] % maxExclusive
}

export function secureShuffle<T>(items: readonly T[], randomIndex = secureIndex): T[] {
  const shuffled = items.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function rerollOrientations<T extends DeckCard>(cards: readonly T[], randomIndex: (maxExclusive: number) => number): (T & RuntimeCard)[] {
  return cards.map((card) => ({ ...card, orientation: randomIndex(2) === 0 ? 'upright' : 'reversed' }))
}

export function createReadyDeck(cards: DeckCard[], now = Date.now(), randomIndex = secureIndex): DeckState {
  if (cards.length !== 78) throw new Error(`The Cathedral deck must contain 78 cards; found ${cards.length}.`)
  const ids = new Set(cards.map((card) => card.id))
  if (ids.size !== 78) throw new Error('Every card in the deck must have a unique id.')
  return {
    cards: rerollOrientations(secureShuffle(cards, randomIndex), randomIndex),
    nextCardIndex: 0,
    resetAt: now,
  }
}

/** Produces a fresh shuffled state for every undrawn card in one hold tick. */
export function performShuffleStep(deck: DeckState, randomIndex = secureIndex): DeckState {
  const firstUndrawn = deck.nextCardIndex
  return {
    ...deck,
    cards: [
      ...deck.cards.slice(0, firstUndrawn),
      ...rerollOrientations(secureShuffle(deck.cards.slice(firstUndrawn), randomIndex), randomIndex),
    ],
  }
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
