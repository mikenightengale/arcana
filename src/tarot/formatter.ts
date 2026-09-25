import type { ReadingPosition, TarotSpread } from '../types/tarot'

export function formatReading(reading: ReadingPosition[], spread: TarotSpread | null): string {
  if (spread) {
    return reading.map(({ position, card }, index) => [
      `${position?.number ?? index + 1}. ${position?.question ?? ''}`,
      '',
      `${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`,
    ].join('\n')).join('\n\n')
  }
  return reading.map(({ card }, index) => `${index + 1}. ${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`).join('\n')
}
