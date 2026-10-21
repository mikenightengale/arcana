import { describe, expect, it } from 'vitest'
import { parseSpread } from './parser'

const investigationTitle = 'Why Do Tarot Readings and Yes/No Answers Contradict Each Other? — 40-Card Tarot Investigation'
const investigationQuestions = Array.from({ length: 40 }, (_, index) => `What should I understand about communication factor ${index + 1}?`)
// Match the five positions that previously became headings instead of questions.
investigationQuestions[0] = 'What causes contradictions between tarot readings and Yes/No responses?'
investigationQuestions[2] = 'How accurately do Yes/No responses communicate information?'
investigationQuestions[14] = 'What causes inaccuracies in Yes/No responses?'
investigationQuestions[35] = 'What role does tarot play in conflicts with Yes/No responses?'
investigationQuestions[36] = 'What role does the Yes/No method play in conflicts with tarot?'

describe('pasted question regressions', () => {
  it.each(['', '# '])('preserves all 40 tarot questions with a %s title', (prefix) => {
    const input = `${prefix}${investigationTitle}\n\n${investigationQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n\n')}`
    expect(parseSpread(input)).toEqual({
      title: investigationTitle,
      positions: investigationQuestions.map((question, index) => ({ number: index + 1, question })),
    })
  })

  it.each(['1.', '1)', '1/', String.raw`1\.`, String.raw`1\\.`, String.raw`1\)`, '1.\\', '1./', '1)\\', '1. / \\'])('normalizes the %s marker without changing question slashes', (marker) => {
    const question = String.raw`What does Yes/No mean in C:\Tarot?`
    expect(parseSpread(`${marker} ${question}`)?.positions).toEqual([{ number: 1, question }])
  })

  it('recognizes a plain subsection followed by slash numbering', () => {
    expect(parseSpread('Tarot Spread — Check\n1. What now?\n\nTiming and Expectations\n2/ What next?')?.positions).toEqual([
      { number: 1, question: 'What now?', sectionTitle: 'Check' },
      { number: 2, question: 'What next?', sectionTitle: 'Timing and Expectations' },
    ])
  })

  it('keeps heading keywords inside numbered and bulleted questions', () => {
    expect(parseSpread('Tarot Spread — Methods\n1. Tarot Questions: what helps?\n* What role does Yes/No play?\n2. Tarot Spread: what changes?')?.positions).toEqual([
      { number: 1, question: 'Tarot Questions: what helps?' },
      { number: 2, question: 'What role does Yes/No play?' },
      { number: 2, question: 'Tarot Spread: what changes?' },
    ])
  })
})
