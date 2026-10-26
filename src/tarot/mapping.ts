import type { ReadingPosition, RuntimeCard, TarotSpread } from '../types/tarot'

export function mapReading(cards: RuntimeCard[], spread: TarotSpread | null): ReadingPosition[] {
  const positions = spread?.positions.filter((position) => position.type !== 'yes-no')
  if (spread?.presetId) positions?.sort((a,b) => (a.drawOrder ?? a.number) - (b.drawOrder ?? b.number))
  return cards.map((card, index) => ({ ...(positions?.[index] ? { position: positions[index] } : {}), card }))
}

/** Merge card results and manually answered questions in their source order. */
export function readingEntries(reading: ReadingPosition[], spread: TarotSpread | null) {
  let cardIndex = 0
  return spread ? spread.positions.map((position, index) => ({
    position, index, card: position.type === 'yes-no' ? undefined : spread.presetId ? reading.find(entry => entry.position?.id === position.id)?.card : reading[cardIndex++]?.card,
  })) : reading.map((entry, index) => ({ ...entry, index }))
}
