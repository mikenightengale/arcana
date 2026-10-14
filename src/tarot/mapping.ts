import type { ReadingPosition, RuntimeCard, TarotSpread } from '../types/tarot'

export function mapReading(cards: RuntimeCard[], spread: TarotSpread | null): ReadingPosition[] {
  const positions = spread?.positions.filter((position) => position.type !== 'yes-no')
  return cards.map((card, index) => ({ ...(positions?.[index] ? { position: positions[index] } : {}), card }))
}

/** Merge card results and manually answered questions in their source order. */
export function readingEntries(reading: ReadingPosition[], spread: TarotSpread | null) {
  let cardIndex = 0
  return spread ? spread.positions.map((position, index) => ({
    position, index, card: position.type === 'yes-no' ? undefined : reading[cardIndex++]?.card,
  })) : reading.map((entry, index) => ({ ...entry, index }))
}
