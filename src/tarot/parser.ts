import type { TarotPosition, TarotSpread } from '../types/tarot'

const clean = (value: string) => value.trim().replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^__(.*?)__$/, '$1').trim()
const normalizeTitle = (value: string) => clean(value).replace(/^Tarot Spread\s*[—–:-]\s*/i, '').replace(/^['“](.*)['”]$/, '$1')

export function parseSpread(input: string): TarotSpread | null {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  const sections: { title?: string; positions: TarotPosition[] }[] = []
  let title: string | undefined
  let positions: TarotPosition[] = []
  let current: TarotPosition | undefined
  let barePosition = false

  const finishCurrent = () => {
    if (!current) return
    // A plain numbered item with no continuation is itself a question, even
    // when it has no question mark (for example, "1. test").
    if (barePosition && !current.question && current.title) {
      current.question = current.title
      delete current.title
    }
    positions.push(current)
    current = undefined
  }

  const finishSection = () => {
    finishCurrent()
    if (positions.length) sections.push({ ...(title ? { title } : {}), positions })
    title = undefined
    positions = []
  }

  const isSpreadTitle = (line: string) => /^Tarot Spread\s*[—–:-]\s*/i.test(line)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^#{1,3}\s+(.+?)\s*#*$/)
    const numbered = line.match(/^\s*(\d+)\s*[.)]\s+(.+)$/)
    const headingText = heading?.[1] ?? line
    const isExplicitSpreadHeading = isSpreadTitle(headingText)
    if (isExplicitSpreadHeading || (heading && (sections.length > 0 || positions.length > 0 || current || !title))) {
      finishSection()
      title = normalizeTitle(headingText)
      continue
    }
    if (!title && positions.length === 0 && !current && !numbered) {
      title = normalizeTitle(line)
      continue
    }
    if (numbered) {
      finishCurrent()
      const number = Number(numbered[1])
      const content = numbered[2].trim()
      const boldPosition = content.match(/^\*\*(.+?)\*\*\s*(?:[:—–-]\s*)?(.*)$/) || content.match(/^__(.+?)__\s*(?:[:—–-]\s*)?(.*)$/)
      const plainTitle = content.match(/^([^:—–?]+?)\s*[:—–]\s*(.+)$/)
      if (boldPosition) {
        current = { number, title: clean(boldPosition[1]), question: clean(boldPosition[2]) }
        barePosition = false
      } else if (plainTitle && !content.endsWith('?')) {
        current = { number, title: clean(plainTitle[1]), question: clean(plainTitle[2]) }
        barePosition = false
      } else {
        current = content.endsWith('?')
          ? { number, question: clean(content.replace(/^\*\*(.*?)\*\*$/, '$1')) }
          : { number, title: clean(content), question: '' }
        barePosition = !content.endsWith('?')
      }
      continue
    }
    if (current) current.question = [current.question, clean(line)].filter(Boolean).join(' ')
  }
  finishSection()
  if (!sections.length) return null
  const multiple = sections.length > 1
  const normalized = sections.flatMap((section) => section.positions.map((position, index) => ({
    ...position,
    number: index + 1,
    ...(multiple && section.title ? { sectionTitle: section.title } : {}),
    question: position.question.trim(),
  })))
  if (normalized.some((position) => !position.question)) return null
  return { ...(!multiple && sections[0].title ? { title: sections[0].title } : {}), positions: normalized }
}
