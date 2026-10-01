import type { ReadingPosition, TarotSpread } from '../types/tarot'

export function formatReading(reading: ReadingPosition[], spread: TarotSpread | null): string {
  if (spread) {
    if (reading.some(({ position }) => position?.sectionTitle)) {
      const sections: { title?: string; lines: string[] }[] = []
      for (const { position, card } of reading) {
        const title = position?.sectionTitle
        let section = sections.at(-1)
        if (!section || section.title !== title) {
          section = { ...(title ? { title } : {}), lines: [] }
          sections.push(section)
        }
        section.lines.push(`${position?.number ?? section.lines.length + 1}. ${position?.question ?? ''}\n${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`)
      }
      return sections.map(({ title, lines }) => [title, lines.join('\n\n')].filter(Boolean).join('\n\n')).join('\n\n')
    }
    const formattedReading = reading.map(({ position, card }, index) => [
      `${position?.number ?? index + 1}. ${position?.question ?? ''}`,
      `${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`,
    ].join('\n')).join('\n\n')
    return [spread.title, formattedReading].filter(Boolean).join('\n\n')
  }
  return reading.map(({ card }, index) => `${index + 1}. ${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`).join('\n')
}
