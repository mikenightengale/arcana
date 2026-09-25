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

export function createReadyDeck(cards: DeckCard[], now = Date.now()): DeckState {
  if (cards.length !== 78) throw new Error(`The Cathedral deck must contain 78 cards; found ${cards.length}.`)
  const ids = new Set(cards.map((card) => card.id))
  if (ids.size !== 78) throw new Error('Every card in the deck must have a unique id.')
  return {
    cards: cards.map((card) => ({ ...card, orientation: 'upright' })),
    nextCardIndex: 0,
    resetAt: now,
  }
}

/**
 * Performs one overhand-style packet transfer on the undrawn portion of a deck.
 * Random choices are made only for this step; the returned deck is the complete
 * new working state and can be frozen immediately by the caller.
 */
export function performShuffleStep(deck: DeckState, randomIndex = secureIndex): DeckState {
  const firstUndrawn = deck.nextCardIndex
  const available = deck.cards.length - firstUndrawn
  if (available < 2) return deck

  const maxPacket = Math.min(3, available - 1)
  const packetSize = 1 + randomIndex(maxPacket)
  const originalStart = randomIndex(available - packetSize + 1)
  const packet = deck.cards.slice(firstUndrawn + originalStart, firstUndrawn + originalStart + packetSize)
  const remaining = deck.cards.slice(firstUndrawn, firstUndrawn + originalStart)
    .concat(deck.cards.slice(firstUndrawn + originalStart + packetSize))

  // The destination is selected from all legal insertion points except the
  // original one, so every visible step changes the order whenever >= 2 remain.
  const destinationCount = remaining.length + 1
  const destinationChoice = randomIndex(destinationCount - 1)
  const destination = destinationChoice >= originalStart ? destinationChoice + 1 : destinationChoice
  const orientedPacket = packet.map((card) => ({
    ...card,
    orientation: randomIndex(2) === 0 ? 'upright' as const : 'reversed' as const,
  }))
  const shuffledRemaining = remaining.slice()
  shuffledRemaining.splice(destination, 0, ...orientedPacket)

  return {
    ...deck,
    cards: [...deck.cards.slice(0, firstUndrawn), ...shuffledRemaining],
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
