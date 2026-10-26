import { Fragment, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { readingEntries } from './tarot/mapping'
import { SpreadLayout } from './tarot/SpreadLayout'
import { CrystalCard } from './tarot/CrystalCard'
import { getCardMeaning } from './tarot/meanings'
import type { ReadingPosition, TarotSpread, YesNoAnswer, YesNoAnswers } from './types/tarot'

export function ReadingView({ reading, spread, onCopy, onNew, onReset, answers = {}, onAnswer }: {
  answers?: YesNoAnswers; onAnswer?: (index: number, answer: YesNoAnswer) => void
  reading: ReadingPosition[]; spread: TarotSpread | null; onCopy: () => void; onNew: () => void; onReset?: () => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    let copies: HTMLElement[] = []

    const alignPositionRows = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.reading-card'))
      const rows = new Map<number, HTMLElement[]>()
      copies = cards.map((card) => card.querySelector<HTMLElement>('.card-copy')).filter((copy): copy is HTMLElement => copy !== null)
      copies.forEach((copy) => { copy.style.minHeight = '' })

      cards.forEach((card) => {
        const copy = card.querySelector<HTMLElement>('.card-copy')
        if (!copy) return
        const row = rows.get(card.offsetTop) ?? []
        row.push(copy)
        rows.set(card.offsetTop, row)
      })

      rows.forEach((row) => {
        const height = Math.max(...row.map((copy) => copy.getBoundingClientRect().height))
        row.forEach((copy) => { copy.style.minHeight = `${height}px` })
      })
    }

    let frame = 0
    let active = true
    const scheduleAlignment = () => {
      if (!active) return
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(alignPositionRows)
    }
    alignPositionRows()
    window.addEventListener('resize', scheduleAlignment)
    document.fonts?.ready.then(scheduleAlignment)
    return () => {
      active = false
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', scheduleAlignment)
      copies.forEach((copy) => { copy.style.minHeight = '' })
    }
  }, [reading])

  return <section className="reading-view" aria-labelledby="screen-title">
    <div className="eyebrow"><span /> YOUR QUESTIONS AT THE TABLE <span /></div>
    <h1 id="screen-title">Your <em>reading</em></h1>
    <p className="intro">{spread?.title ? `A quiet moment with “${spread.title}”` : 'A quiet moment with your questions.'}</p>
    {spread?.presetId ? <SpreadLayout spread={spread} reading={reading} /> : <div className="reading-grid" ref={gridRef}>
      {readingEntries(reading, spread).map(({ position, card, index }, order, entries) => <Fragment key={index}>
        {position?.sectionTitle && (order === 0 || entries[order - 1].position?.sectionTitle !== position.sectionTitle) && <h2 className="reading-section-title">{position.sectionTitle}</h2>}
        {position?.type === 'yes-no' ? <fieldset className="question-entry yes-no-question">
          <legend>{position.number}. {position.title && `${position.title}: `}{position.question}</legend>
          <div className="answer-options">
            {(['Yes', 'No', 'Other'] as const).map((answer) => <label className={`answer-box answer-${answer.toLowerCase()}`} key={answer}>
              <input type="radio" name={`answer-${index}`} value={answer} checked={answers[index] === answer} onChange={() => onAnswer?.(index, answer)} />
              <span><i className="answer-icon" aria-hidden="true">{answer === 'Yes' ? '✓' : answer === 'No' ? '✕' : '!'}</i>{answer}</span>
            </label>)}
          </div>
          <p className="answer-status" role="status">{answers[index] ? `Saved: ${answers[index]}` : 'Choose an answer'}</p>
        </fieldset> : card && <article
        className="reading-card"
        key={`${index}-${card.id}`}
        style={{
          '--cascade-delay': `${Math.min(index * 36, 360)}ms`,
          '--cascade-delay-mobile': `${Math.min(index * 16, 160)}ms`,
        } as CSSProperties}
      >
        <div className="card-art-wrap"><CrystalCard className="card-art" card={card} reversed={card.orientation === 'reversed'} reveal animations showLabels={false} /></div>
        <div className="card-copy"><span className="position-index">{String(position?.number ?? index + 1).padStart(2, '0')}</span><div className="position-text">{position?.title && <h2>{position.title}</h2>}{position?.question && <p>{position.question}</p>}</div></div>
        <div className="card-label"><strong className="card-name">{card.name}</strong>{card.orientation === 'reversed' && <span className="card-orientation">Reversed</span>}</div>
        <p className="card-meaning">{getCardMeaning(card.id, card.orientation) ?? 'A meaning guide is not available for this card.'}</p>
      </article>}
      </Fragment>)}
    </div>}
    <div className="reading-actions">
      <button className="primary-button copy-button" onClick={onCopy}>
        <svg className="reading-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" /></svg>
        <span>Copy reading</span>
      </button>
      <button className="secondary-button" onClick={onNew}>
        <svg className="reading-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M12 8v8m-4-4h8" /></svg>
        <span>Prepare another reading</span>
      </button>
      {onReset && <button className="secondary-button reading-reset-button" onClick={onReset}>
        <svg className="reading-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M3 11a9 9 0 1 1 2.6 6.4L3 15" /><path d="M3 20v-5h5" /></svg>
        <span>Reset the Deck</span>
      </button>}
    </div>
  </section>
}
