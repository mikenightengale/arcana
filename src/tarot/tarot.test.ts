import { describe, expect, it } from 'vitest'
import { formatReading } from './formatter'
import { mapReading } from './mapping'
import { cardMeanings } from './meanings'
import { parseSpread } from './parser'
import { createReadyDeck, drawCards, performShuffleStep, remainingCards, secureShuffle } from './shuffle'
import type { DeckCard, RuntimeCard } from '../types/tarot'
import cathedralDeck from '../../public/decks/cathedral/deck.json'
import nocturneDeck from '../../public/decks/nocturne/deck.json'
import veilDeck from '../../public/decks/veil/deck.json'

const cards: DeckCard[] = Array.from({ length: 78 }, (_, number) => ({
  id: `card-${number}`, name: `Card ${number}`, arcana: number < 22 ? 'major' : 'minor', number,
}))

describe('Cathedral deck', () => {
  it('keeps Nocturne and The Veil as complete alternates with the same ordered card identities', () => {
    expect(cathedralDeck.cards).toHaveLength(78)
    expect(nocturneDeck.cards).toHaveLength(78)
    expect(veilDeck.cards).toHaveLength(78)
    expect(new Set(nocturneDeck.cards.map((card) => card.id)).size).toBe(78)
    expect(new Set(veilDeck.cards.map((card) => card.id)).size).toBe(78)
    expect(nocturneDeck.cards.map((card) => card.id)).toEqual(cathedralDeck.cards.map((card) => card.id))
    expect(veilDeck.cards.map((card) => card.id)).toEqual(cathedralDeck.cards.map((card) => card.id))
    expect(nocturneDeck.cards.every((card) => card.visual?.theme === 'nocturne')).toBe(true)
    expect(veilDeck.cards.every((card) => card.visual?.theme === 'veil' && card.visual.layout === 'threshold')).toBe(true)
    expect(veilDeck.cardBack).toBe('backs/veil.svg')
  })

  it('has upright and reversed guide meanings for every manifest card', () => {
    expect(Object.keys(cardMeanings)).toHaveLength(cathedralDeck.cards.length)
    for (const card of cathedralDeck.cards) {
      const meaning = cardMeanings[card.id as keyof typeof cardMeanings]
      expect(meaning, `meaning for ${card.id}`).toMatchObject({
        upright: expect.any(String),
        reversed: expect.any(String),
      })
      expect(meaning?.upright.trim()).not.toBe('')
      expect(meaning?.reversed.trim()).not.toBe('')
    }
  })

  it('uses Fisher–Yates with injected indices and leaves its input untouched', () => {
    const original = [0, 1, 2, 3]
    const bounds: number[] = []
    expect(secureShuffle(original, (bound) => { bounds.push(bound); return 0 })).toEqual([1, 2, 3, 0])
    expect(bounds).toEqual([4, 3, 2])
    expect(original).toEqual([0, 1, 2, 3])
  })

  it('creates a fully shuffled 78 card deck with independently randomized orientations', () => {
    const original = cards.map((card) => ({ ...card }))
    let orientationIndex = 0
    const bounds: number[] = []
    const deck = createReadyDeck(cards, 456, (bound) => {
      bounds.push(bound)
      return bounds.length > 77 ? orientationIndex++ % 2 : 0
    })
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.map((card) => card.id)).toEqual([...cards.slice(1), cards[0]].map((card) => card.id))
    expect(deck.cards.map((card) => card.orientation)).toEqual(cards.map((_, index) => index % 2 ? 'reversed' : 'upright'))
    expect(bounds).toEqual([...Array.from({ length: 77 }, (_, index) => 78 - index), ...Array(78).fill(2)])
    expect(cards).toEqual(original)
    expect(deck.cards[0]).not.toBe(cards[1])
    expect(deck.nextCardIndex).toBe(0)
    expect(deck.resetAt).toBe(456)
  })

  it('rejects malformed decks and prevents repeat draws past the remaining cards', () => {
    expect(() => createReadyDeck(cards.slice(0, 77))).toThrow(/78 cards/)
    const deck = createReadyDeck(cards)
    const first = drawCards(deck, 12)
    const second = drawCards(first.deck, 9)
    expect(first.cards.map((card) => card.id)).not.toEqual(second.cards.map((card) => card.id))
    expect(remainingCards(second.deck)).toBe(57)
    expect(() => drawCards(second.deck, 58)).toThrow(/Only 57 cards remain/)
  })

  it('shuffles only the undrawn cards and rerolls every remaining orientation', () => {
    const ready = createReadyDeck(cards, 789, () => 0)
    const dealt = drawCards(ready, 4)
    const original = structuredClone(dealt.deck)
    const bounds: number[] = []
    const stepped = performShuffleStep(dealt.deck, (bound) => { bounds.push(bound); return bounds.length > 73 ? 1 : 0 })
    expect(stepped.cards.slice(0, 4)).toEqual(dealt.deck.cards.slice(0, 4))
    expect(stepped.cards.slice(0, 4).every((card, index) => card === dealt.deck.cards[index])).toBe(true)
    expect(stepped.cards.slice(4).map((card) => card.id)).toEqual([
      ...dealt.deck.cards.slice(5), dealt.deck.cards[4],
    ].map((card) => card.id))
    expect(stepped.cards.slice(4).every((card) => card.orientation === 'reversed')).toBe(true)
    expect(bounds).toEqual([...Array.from({ length: 73 }, (_, index) => 74 - index), ...Array(74).fill(2)])
    expect(stepped.cards).toHaveLength(78)
    expect(new Set(stepped.cards.map((card) => card.id)).size).toBe(78)
    expect(stepped.nextCardIndex).toBe(4)
    expect(stepped.resetAt).toBe(789)
    expect(stepped.cards.every((card) => card.name.startsWith('Card '))).toBe(true)
    expect(dealt.deck).toEqual(original)
    expect(stepped).not.toBe(dealt.deck)
  })

  it('rerolls the final undrawn card without changing drawn cards', () => {
    const deck = { ...createReadyDeck(cards, 123, () => 0), nextCardIndex: 77 }
    const stepped = performShuffleStep(deck, () => 1)
    expect(stepped.cards.slice(0, 77)).toEqual(deck.cards.slice(0, 77))
    expect(stepped.cards[77]).toMatchObject({ id: deck.cards[77].id, orientation: 'reversed' })
    expect(deck.cards[77].orientation).toBe('upright')
  })

  it('preserves all 78 unique cards through many discrete shuffle steps', () => {
    let deck = createReadyDeck(cards)
    for (let step = 0; step < 600; step += 1) deck = performShuffleStep(deck)
    expect(deck.cards).toHaveLength(78)
    expect(new Set(deck.cards.map((card) => card.id)).size).toBe(78)
    expect(deck.cards.every((card) => card.orientation === 'upright' || card.orientation === 'reversed')).toBe(true)
  })

  it('draws the frozen order without changing it and preserves remaining-card state', () => {
    let frozen = createReadyDeck(cards)
    for (let step = 0; step < 40; step += 1) frozen = performShuffleStep(frozen)
    const expected = frozen.cards.slice(0, 7)
    const firstDraw = drawCards(frozen, 3)
    const secondDraw = drawCards(firstDraw.deck, 4)
    expect([...firstDraw.cards, ...secondDraw.cards]).toEqual(expected)
    expect(secondDraw.deck.cards).toEqual(frozen.cards)
    expect(remainingCards(secondDraw.deck)).toBe(71)
  })
})

describe('spread parsing and reading output', () => {
  it('parses asterisk questions from a pasted spread and copies numbered results', () => {
    const spread = parseSpread(`### Tarot Spread: Uncovering the Truth

* Was Maia truthful when she described the nature of reality after physical death?

* How much of her original description of the afterlife was accurate?`)!
    expect(spread).toEqual({
      title: 'Uncovering the Truth',
      positions: [
        { number: 1, question: 'Was Maia truthful when she described the nature of reality after physical death?' },
        { number: 2, question: 'How much of her original description of the afterlife was accurate?' },
      ],
    })
    const reading = mapReading(cards.slice(0, 2).map((card) => ({ ...card, orientation: 'upright' })) as RuntimeCard[], spread)
    expect(formatReading(reading, spread)).toBe([
      'Uncovering the Truth',
      `1. ${spread.positions[0].question}\nCard 0`,
      `2. ${spread.positions[1].question}\nCard 1`,
    ].join('\n\n'))
  })

  it.each(['*', '-', '+', '•'])('parses unheaded %s bullets with labels and continuations', (bullet) => {
    expect(parseSpread(`${bullet} **Present**
What should I
notice?
${bullet} **What comes next?**
${bullet} Reflect on the outcome`)?.positions).toEqual([
      { number: 1, title: 'Present', question: 'What should I notice?' },
      { number: 2, question: 'What comes next?' },
      { number: 3, question: 'Reflect on the outcome' },
    ])
  })

  it('supports mixed list markers and numbers bullets independently within sections', () => {
    const spread = parseSpread('1. First?\n* Second?\n## Yes/No Questions — Check\n* Ready?\n* Complete?\n## Tarot Spread — Next\n* What next?')!
    expect(spread.positions.map((p) => [p.number, p.type, p.question])).toEqual([
      [1, undefined, 'First?'], [2, undefined, 'Second?'],
      [1, 'yes-no', 'Ready?'], [2, 'yes-no', 'Complete?'],
      [1, undefined, 'What next?'],
    ])
    expect(parseSpread('* Ready?\n* Complete?', 'yes-no')?.positions.map((p) => p.type)).toEqual(['yes-no', 'yes-no'])
  })

  it('parses escaped Markdown numbering and copies readings without the escapes', () => {
    const prompt = String.raw`### Tarot Spread — Astarte: The Intense Overnight Energy Surge and Why I Had to Tell Her to Stop

1\. The Nature of the Experience What was actually happening during the intense energy surge that woke me during the night?

2\. The Source Was Astarte responsible for the experience, or was another presence or influence involved?`
    const spread = parseSpread(prompt)!
    expect(spread).toEqual(parseSpread(prompt.replace(/\\\./g, '.')))
    expect(spread.positions).toEqual([
      { number: 1, question: 'The Nature of the Experience What was actually happening during the intense energy surge that woke me during the night?' },
      { number: 2, question: 'The Source Was Astarte responsible for the experience, or was another presence or influence involved?' },
    ])
    const reading = mapReading(cards.slice(0, 2).map((card) => ({ ...card, orientation: 'upright' })) as RuntimeCard[], spread)
    expect(formatReading(reading, spread)).toBe([
      spread.title,
      `1. ${spread.positions[0].question}\nCard 0`,
      `2. ${spread.positions[1].question}\nCard 1`,
    ].join('\n\n'))
  })

  it('supports mixed escaped and ordinary separators without removing question backslashes', () => {
    expect(parseSpread(String.raw`1\) **Now**
What does C:\Tarot mean?
2. What comes next?`)?.positions).toEqual([
      { number: 1, title: 'Now', question: String.raw`What does C:\Tarot mean?` },
      { number: 2, question: 'What comes next?' },
    ])
  })

  it('recognizes fully bold numbered questions from a pasted Markdown spread', () => {
    expect(parseSpread(`## Tarot Spread — “Current Status After Maia’s Energetic Clearing”

1. **What is the current overall energetic state of my wife since Maia began working on the blockage?**

2. **How much of the original blockage has now been broken or released?**
`)).toEqual({
      title: 'Current Status After Maia’s Energetic Clearing',
      positions: [
        { number: 1, question: 'What is the current overall energetic state of my wife since Maia began working on the blockage?' },
        { number: 2, question: 'How much of the original blockage has now been broken or released?' },
      ],
    })
  })

  it('recognizes underscore bold questions while preserving labeled questions', () => {
    expect(parseSpread('1. __What should I notice?__\n2. **Next**: What is forming?')).toEqual({
      positions: [
        { number: 1, question: 'What should I notice?' },
        { number: 2, title: 'Next', question: 'What is forming?' },
      ],
    })
  })

  it('parses ChatGPT markdown with headings, bold positions, and multiline questions', () => {
    expect(parseSpread('## Tarot Spread — “Current Direction”\n\n1. **Current Energy**\n   What is the dominant energy\n   surrounding this situation?\n\n2. Hidden Influence\n   What is moving beneath the surface?')).toEqual({
      title: 'Current Direction', positions: [
        { number: 1, title: 'Current Energy', question: 'What is the dominant energy surrounding this situation?' },
        { number: 2, title: 'Hidden Influence', question: 'What is moving beneath the surface?' },
      ],
    })
  })

  it('parses a plain first-line title and includes it in copied reading', () => {
    const spread = parseSpread('Current Direction\n\n1. What energy surrounds this situation?')!
    const reading = mapReading([{ ...cards[0], orientation: 'upright' } as RuntimeCard], spread)
    expect(spread.title).toBe('Current Direction')
    expect(formatReading(reading, spread)).toBe('Current Direction\n\n1. What energy surrounds this situation?\nCard 0')
  })

  it('parses multiple titled spreads with independent numbering and keeps sections in copied readings', () => {
    const prompt = `Tarot Spread — “First Direction”\n\n1. What is happening?\n2. What should I notice?\n\nTarot Spread — “Second Direction”\n\n1. What is changing?\n2. What comes next?`
    const spread = parseSpread(prompt)!
    expect(spread.title).toBeUndefined()
    expect(spread.positions.map(({ number, sectionTitle }) => [number, sectionTitle])).toEqual([
      [1, 'First Direction'], [2, 'First Direction'], [1, 'Second Direction'], [2, 'Second Direction'],
    ])
    const reading = mapReading(cards.slice(0, 4).map((card, index) => ({ ...card, orientation: index % 2 ? 'reversed' : 'upright' })) as RuntimeCard[], spread)
    expect(formatReading(reading, spread)).toBe([
      'First Direction',
      '1. What is happening?\nCard 0',
      '2. What should I notice?\nCard 1 — Reversed',
      'Second Direction',
      '1. What is changing?\nCard 2',
      '2. What comes next?\nCard 3 — Reversed',
    ].join('\n\n'))
  })

  it('replaces introductory text with the first explicit spread heading', () => {
    const spread = parseSpread('Here are two spreads:\n\n## Tarot Spread — “First”\n\n1. What is first?\n\n## Tarot Spread — “Second”\n\n1. What is second?')!
    expect(spread.positions.map(({ number, sectionTitle }) => [number, sectionTitle])).toEqual([
      [1, 'First'], [1, 'Second'],
    ])
  })

  it('copies only numbered questions and card results for spreads', () => {
    const spread = parseSpread('# Three cards\n1. **Now**\nWhat is present?\n2. **Next**\nWhat is forming?')!
    const drawn = [0, 1].map((index) => ({ ...cards[index], orientation: index ? 'reversed' : 'upright' })) as RuntimeCard[]
    const reading = mapReading(drawn, spread)
    expect(reading[1].position?.title).toBe('Next')
    expect(formatReading(reading, spread)).toBe('Three cards\n\n1. What is present?\nCard 0\n\n2. What is forming?\nCard 1 — Reversed')
    expect(formatReading(reading, spread)).not.toMatch(/Tarot Spread|\*\*Now\*\*|\*\*Next\*\*|Position:|Card:/)
  })

  it('formats spread questions the same whether or not the spread has a title', () => {
    const spread = parseSpread('1. What should I notice?')!
    const reading = mapReading([{ ...cards[0], orientation: 'upright' } as RuntimeCard], spread)
    expect(formatReading(reading, spread)).toBe('1. What should I notice?\nCard 0')
  })

  it('keeps open draws numbered', () => {
    const drawn = [0, 1].map((index) => ({ ...cards[index], orientation: index ? 'reversed' : 'upright' })) as RuntimeCard[]
    const reading = mapReading(drawn, null)
    expect(formatReading(reading, null)).toBe('1. Card 0\n2. Card 1 — Reversed')
  })

  it('returns null for text without numbered positions', () => {
    expect(parseSpread('A quiet question for the cards.')).toBeNull()
  })
})

describe('yes/no and mixed questions', () => {
  it('separates part headings, flattened subsections, and old results from questions', () => {
    const spread = parseSpread(`Exploring a New Possibility

1. What is changing?
Knight of Swords

2. What should I consider? Feasibility and Expectations
Three of Wands — Reversed

3. What comes next?
The Fool

Part 2 — Yes/No Questions

1. Is it ready?
Yes

2. Is there more to learn? Knowledge and Honesty
No

3. Is it complete?
Other`)!
    expect(spread.positions.map((p) => [p.number, p.type, p.sectionTitle, p.question])).toEqual([
      [1, undefined, 'Exploring a New Possibility', 'What is changing?'],
      [2, undefined, 'Exploring a New Possibility', 'What should I consider?'],
      [3, undefined, 'Feasibility and Expectations', 'What comes next?'],
      [1, 'yes-no', 'Yes/No Questions', 'Is it ready?'],
      [2, 'yes-no', 'Yes/No Questions', 'Is there more to learn?'],
      [3, 'yes-no', 'Knowledge and Honesty', 'Is it complete?'],
    ])
    expect(formatReading([], spread)).not.toMatch(/Knight of Swords|Reversed/)
  })

  it('keeps explanatory prose and card names used as titles', () => {
    const spread = parseSpread('The Fool\n1. What should I notice? Please explain\n2. What comes next?')!
    expect(spread.title).toBe('The Fool')
    expect(spread.positions[0].question).toBe('What should I notice? Please explain')
  })

  it.each(['Part 2 — Yes/No Questions', '**Yes/No Questions**', '###### Yes / No', 'Section II: Yes–No Questions'])('recognizes %s', (heading) => {
    const spread = parseSpread(`Tarot Questions\n1. What now?\n\n${heading}\n1. Ready?`)!
    expect(spread.positions.map((p) => p.type)).toEqual([undefined, 'yes-no'])
    expect(spread.positions[0].question).toBe('What now?')
  })

  it('preserves multiline questions and detects plain subsections in yes/no lists', () => {
    const spread = parseSpread('Yes/No Questions\n1. Is this\n   ready?\n\nTiming and Expectations\n2. Is it time?')!
    expect(spread.positions.map((p) => [p.type, p.question, p.sectionTitle])).toEqual([
      ['yes-no', 'Is this ready?', 'Yes/No Questions'],
      ['yes-no', 'Is it time?', 'Timing and Expectations'],
    ])
  })

  it('detects emoji headings and draws only tarot cards in source order', () => {
    const spread = parseSpread('## 🔮 Tarot Spread — “Authority”\n1. Why?\n2. How?\n## 🔮 Yes/No Questions — “Boundary”\n25. Does it extend?\n26. Are there limits?\n## Tarot Spread — “Next”\n1. What next?')!
    expect(spread.positions.map((p) => [p.number, p.type, p.sectionTitle])).toEqual([
      [1, undefined, 'Authority'], [2, undefined, 'Authority'],
      [25, 'yes-no', 'Boundary'], [26, 'yes-no', 'Boundary'], [1, undefined, 'Next'],
    ])
    const reading = mapReading(cards.slice(0, 3).map((card) => ({ ...card, orientation: 'upright' })) as RuntimeCard[], spread)
    expect(reading.map((r) => r.position?.question)).toEqual(['Why?', 'How?', 'What next?'])
    expect(formatReading(reading, spread, { 2: 'Yes', 3: 'Other' })).toBe('Authority\n\n1. Why?\nCard 0\n\n2. How?\nCard 1\n\nBoundary\n\n25. Does it extend?\nYes\n\n26. Are there limits?\nOther\n\nNext\n\n1. What next?\nCard 2')
  })

  it('supports a yes/no-only heading and explicitly marks unanswered questions', () => {
    const spread = parseSpread('## Yes/No Questions — “Check”\n1. Is it ready?\n2. Is it complete?')!
    expect(spread.title).toBe('Check')
    expect(formatReading([], spread, { 0: 'No' })).toBe('Check\n\n1. Is it ready?\nNo\n\n2. Is it complete?\nUnanswered')
  })

  it('uses the selected default for an unheaded list and lets headings override it', () => {
    const spread = parseSpread('1. First?\n## Tarot Spread — “Cards”\n1. Next?', 'yes-no')!
    expect(spread.positions.map((p) => p.type)).toEqual(['yes-no', undefined])
    expect(parseSpread('1. First?', 'yes-no')?.positions[0].type).toBe('yes-no')
    expect(parseSpread('1. First?')?.positions[0].type).toBeUndefined()
  })
})
