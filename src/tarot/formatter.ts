import type { ReadingPosition, TarotSpread } from '../types/tarot'

export function formatReading(reading: ReadingPosition[], spread: TarotSpread | null): string {
  if (spread) {
    const heading = spread.title ? `## Tarot Spread — “${spread.title}”` : '## Tarot Spread'
    return [heading, '', ...reading.flatMap(({ position, card }) => [
      `${position?.number ?? ''}. ${position?.title ? `**${position.title}**` : '**Position**'}`,
      ...(position?.question ? [`   ${position.question}`] : []),
      '',
      `   **Card:** ${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`,
      '',
    ])].join('\n').trim()
  }
  return reading.map(({ card }, index) => `${index + 1}. ${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`).join('\n')
}
