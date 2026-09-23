import type { ReadingPosition, RuntimeCard, TarotSpread } from '../types/tarot'

export function mapReading(cards: RuntimeCard[], spread: TarotSpread | null): ReadingPosition[] {
  return cards.map((card, index) => ({ ...(spread?.positions[index] ? { position: spread.positions[index] } : {}), card }))
}
