import manifest from '../../public/decks/cathedral/deck.json'
import type { QuestionType, TarotPosition, TarotSpread } from '../types/tarot'

const clean = (value: string) => value.trim().replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^__(.*?)__$/, '$1').trim()
// Pasted documents often prefix section labels with a part number or emoji.
const sectionLabel = (value: string) => clean(value).replace(/^[^\p{L}\p{N}]*/u, '').replace(/^(?:part|section)\s+(?:\d+|[ivx]+)\s*[—–:.)-]\s*/i, '')
const headingType = (value: string): QuestionType | undefined => {
  const label = sectionLabel(value)
  if (/^Tarot(?:\s+(?:Spread|Questions?))?\b/i.test(label)
    || /[—–:]\s*(?:\d+[-\s]+card\s+)?tarot\b/i.test(label)) return 'tarot'
  // Yes/no also identifies the reading type at the end of descriptive titles.
  return /\byes\s*[/–—-]\s*no\b/i.test(label) ? 'yes-no' : undefined
}
const normalizeTitle = (value: string) => {
  const label = sectionLabel(value)
  const name = label.replace(/^(?:Tarot(?:\s+(?:Spread|Questions?))?|Yes\s*[/–—-]\s*No(?:\s+(?:Questions?|Spread))?)\s*[—–:-]?\s*/i, '')
  return (name || label).replace(/^['“](.*)['”]$/, '$1')
}
const isSubheading = (value: string) => clean(value).split(/\s+/).every((word) => /^(?:[\p{Lu}][\p{L}\p{N}'’/-]*|and|or|the|a|an|of|for|to|in|on|with)$/u.test(word.replace(/[,;:]$/, '')))
const cardNames = new Set(manifest.cards.map((card) => card.name.toLowerCase()))
const isPreviousResult = (value: string) => /^(?:yes|no|other|unanswered)$/i.test(clean(value)) || cardNames.has(clean(value).replace(/\s*[—–-]\s*reversed$/i, '').toLowerCase())
const isYesNoQuestion = (question: string) => /^(?:am|are|can|could|did|do|does|had|has|have|is|may|might|must|shall|should|was|were|will|would)\b/i.test(question.trim()) && question.trim().endsWith('?')
// Accept escaped Markdown punctuation, slash separators, and stray slashes
// after the separator without changing slashes inside the question itself.
const numberedPattern = /^\s*(\d+)\s*\\*[.)/](?:\s*[\\/])*\s+(.+)$/

export function parseSpread(input: string, defaultType: QuestionType = 'tarot'): TarotSpread | null {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  const sections: { title?: string; positions: TarotPosition[] }[] = []
  let type = defaultType
  let title: string | undefined
  let positions: TarotPosition[] = []
  let current: TarotPosition | undefined
  let barePosition = false
  let followingTitle: string | undefined
  let parentTitle: string | undefined
  let hasTypedHeading = false

  const finishCurrent = () => {
    if (!current) return
    // A plain list item with no continuation is itself a question, even
    // when it has no question mark (for example, "1. test").
    if (barePosition && !current.question && current.title) {
      current.question = current.title
      delete current.title
    }
    if (type === 'yes-no') current.type = type
    positions.push(current)
    current = undefined
    if (followingTitle) {
      sections.push({ ...(title ? { title } : {}), positions })
      positions = []
      title = followingTitle
      followingTitle = undefined
    }
  }

  const finishSection = () => {
    finishCurrent()
    if (positions.length) sections.push({ ...(title ? { title } : {}), positions })
    title = undefined
    positions = []
  }

  const isSpreadTitle = (line: string) => headingType(line) !== undefined

  for (const [lineIndex, rawLine] of lines.entries()) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/)
    const numbered = line.match(numberedPattern)
    const bulleted = line.match(/^[*+\-•]\s+(.+)$/)
    const headingText = heading?.[1] ?? line
    if (current?.question && isPreviousResult(line)) continue
    const nextLine = lines.slice(lineIndex + 1).find((value) => value.trim())?.trim() ?? ''
    const isPlainHeading = !numbered && !bulleted && isSubheading(line)
      && (numberedPattern.test(nextLine) || /^[*+\-•]\s+/.test(nextLine))
      && (rawLine === rawLine.trimStart())
      && (lineIndex === 0 || !lines[lineIndex - 1].trim() || /^(?:\*\*|__)/.test(line))
    const isExplicitSpreadHeading = !numbered && !bulleted && isSpreadTitle(headingText)
    // Preserve an investigation title when the first group has its own heading.
    if (heading && title && !sections.length && !positions.length && !current && !isExplicitSpreadHeading) {
      parentTitle ??= title
      title = normalizeTitle(headingText)
      continue
    }
    if (isExplicitSpreadHeading || isPlainHeading || (heading && (sections.length > 0 || positions.length > 0 || current || !title))) {
      finishSection()
      const declaredType = headingType(headingText)
      if (declaredType) hasTypedHeading = true
      type = declaredType ?? type
      title = normalizeTitle(headingText)
      continue
    }
    if (!title && positions.length === 0 && !current && !numbered && !bulleted) {
      const declaredType = headingType(line)
      if (declaredType) hasTypedHeading = true
      type = declaredType ?? type
      title = normalizeTitle(line)
      continue
    }
    if (numbered || bulleted) {
      finishCurrent()
      const number = numbered ? Number(numbered[1]) : positions.length + 1
      let content = (numbered ? numbered[2] : bulleted![1]).trim()
      // Some rich-text copies flatten the next subsection onto the question.
      const inlineHeading = content.match(/^(.*\?)\s+([\p{Lu}][^?]*[\p{L}])$/u)
      if (inlineHeading && isSubheading(inlineHeading[2])) {
        content = inlineHeading[1]
        followingTitle = normalizeTitle(inlineHeading[2])
      }
      const boldPosition = content.match(/^\*\*(.+?)\*\*\s*(?:[:—–-]\s*)?(.*)$/) || content.match(/^__(.+?)__\s*(?:[:—–-]\s*)?(.*)$/)
      const plainTitle = content.match(/^([^:—–?]+?)\s*[:—–]\s*(.+)$/)
      if (boldPosition) {
        const label = clean(boldPosition[1])
        const question = clean(boldPosition[2])
        current = !question && label.endsWith('?')
          ? { number, question: label }
          : { number, title: label, question }
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
    if (current) {
      if (barePosition && current.title && /^(?:is|are|was|were|do|does|did|can|could|will|would|should|has|have|had|what|why|how|when|where|which|who)\b/i.test(current.title)) {
        current.question = current.title
        delete current.title
        barePosition = false
      }
      current.question = [current.question, clean(line)].filter(Boolean).join(' ')
    }
  }
  finishSection()
  if (!sections.length) return null
  const multiple = sections.length > 1
  // Infer manual answers only when every untyped question has yes/no phrasing.
  // An explicit Tarot heading always keeps the card-drawing workflow.
  const inferredYesNo = defaultType === 'tarot' && !hasTypedHeading
    && sections.every((section) => section.positions.every((position) => isYesNoQuestion(position.question)))
  const normalized = sections.flatMap((section) => section.positions.map((position) => ({
    ...position,
    ...(inferredYesNo ? { type: 'yes-no' as const } : {}),
    ...((multiple || parentTitle) && section.title ? { sectionTitle: section.title } : {}),
    question: position.question.trim(),
  })))
  if (normalized.some((position) => !position.question)) return null
  return { ...(parentTitle ? { title: parentTitle } : !multiple && sections[0].title ? { title: sections[0].title } : {}), positions: normalized }
}
