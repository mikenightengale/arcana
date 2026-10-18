import type { ReadingPosition, TarotSpread, YesNoAnswers } from '../types/tarot'
import { readingEntries } from './mapping'

export function formatReading(reading: ReadingPosition[], spread: TarotSpread | null, answers: YesNoAnswers = {}): string {
  if (!spread) return reading.map(({ card }, index) => `${index + 1}. ${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}`).join('\n')
  const sections: { title?: string; lines: string[] }[] = []
  for (const { position, card, index } of readingEntries(reading, spread)) {
    const title = position?.sectionTitle ?? spread.title
    let section = sections.at(-1)
    if (!section || section.title !== title) {
      section = { title, lines: [] }
      sections.push(section)
    }
    const result = position?.type === 'yes-no' ? (answers[index] ?? 'Unanswered')
      : card ? `${card.name}${card.orientation === 'reversed' ? ' — Reversed' : ''}` : 'Undrawn'
    section.lines.push(`${position?.number ?? index + 1}. ${position?.question ?? ''}\n${result}`)
  }
  const content = sections.map(({ title, lines }) => [title, lines.join('\n\n')].filter(Boolean).join('\n\n')).join('\n\n')
  // Keep the overall title when a reading contains named subsections.
  return spread.title && sections.some(({ title }) => title && title !== spread.title)
    ? `${spread.title}\n\n${content}`
    : content
}
