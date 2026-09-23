import type { TarotPosition, TarotSpread } from '../types/tarot'

const clean = (value: string) => value.trim().replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^__(.*?)__$/, '$1').trim()

export function parseSpread(input: string): TarotSpread | null {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  let title: string | undefined
  const positions: TarotPosition[] = []
  let current: TarotPosition | undefined
  let sawPositionHeading = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^#{1,3}\s+(.+?)\s*#*$/)
    if (heading && positions.length === 0 && !current) {
      title = clean(heading[1]).replace(/^Tarot Spread\s*[—–:-]\s*/i, '').replace(/^['“](.*)['”]$/, '$1')
      continue
    }
    const numbered = line.match(/^\s*(\d+)\s*[.)]\s+(.+)$/)
    if (numbered) {
      if (current) positions.push(current)
      const number = Number(numbered[1])
      const content = numbered[2].trim()
      const boldPosition = content.match(/^\*\*(.+?)\*\*\s*(?:[:—–-]\s*)?(.*)$/) || content.match(/^__(.+?)__\s*(?:[:—–-]\s*)?(.*)$/)
      const plainTitle = content.match(/^([^:—–?]+?)\s*[:—–]\s*(.+)$/)
      if (boldPosition) {
        current = { number, title: clean(boldPosition[1]), question: clean(boldPosition[2]) }
        sawPositionHeading = true
      } else if (plainTitle && !content.endsWith('?')) {
        current = { number, title: clean(plainTitle[1]), question: clean(plainTitle[2]) }
        sawPositionHeading = true
      } else {
        current = content.endsWith('?')
          ? { number, question: clean(content.replace(/^\*\*(.*?)\*\*$/, '$1')) }
          : { number, title: clean(content), question: '' }
        sawPositionHeading = !content.endsWith('?')
      }
      continue
    }
    if (current) current.question = [current.question, clean(line)].filter(Boolean).join(' ')
  }
  if (current) positions.push(current)
  if (!positions.length) return null
  const normalized = positions.map((position, index) => ({ ...position, number: index + 1, question: position.question.trim() }))
  if (sawPositionHeading && normalized.some((position) => !position.title || !position.question)) return null
  if (normalized.some((position) => !position.question)) return null
  return { ...(title ? { title } : {}), positions: normalized }
}
