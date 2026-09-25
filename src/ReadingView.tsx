import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CrystalCard } from './tarot/CrystalCard'
import { getCardMeaning } from './tarot/meanings'
import type { ReadingPosition, TarotSpread } from './types/tarot'

export interface CardRect {
  left: number
  top: number
  width: number
  height: number
}

interface DealFlight {
  origin: CardRect
  delay: number
}

export function ReadingView({ reading, spread, dealOrigin, cardBackUrl, onCopy, onNew, onReset }: {
  reading: ReadingPosition[]; spread: TarotSpread | null; dealOrigin: CardRect | null; cardBackUrl: string; onCopy: () => void; onNew: () => void; onReset: () => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [flightCards, setFlightCards] = useState<DealFlight[] | null>(null)
  const [flightActive, setFlightActive] = useState(false)

  useLayoutEffect(() => {
    if (!dealOrigin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const targets = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('.card-art-wrap') ?? [])
    if (targets.length === 0) return

    const flights: DealFlight[] = targets.map((_, index) => ({
      origin: dealOrigin,
      delay: Math.min(index * 60, 900),
    }))
    setFlightCards(flights)
    const frame = window.requestAnimationFrame(() => setFlightActive(true))
    const finalDelay = flights.at(-1)?.delay ?? 0
    const timeout = window.setTimeout(() => {
      setFlightCards(null)
      setFlightActive(false)
    }, finalDelay + 850)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [dealOrigin, reading])

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
    <div className="eyebrow"><span /> THE CARDS HAVE SPOKEN <span /></div>
    <h1 id="screen-title">Your <em>reading</em></h1>
    <p className="intro">{spread?.title ? `A quiet moment with “${spread.title}”` : 'A quiet moment with the cards.'}</p>
    <div className="reading-grid" ref={gridRef}>
      {reading.map(({ position, card }, index) => <article className="reading-card" key={`${index}-${card.id}`}>
        <div className={`card-art-wrap ${flightCards ? 'card-art-hidden' : ''}`}><CrystalCard className="card-art" card={card} reversed={card.orientation === 'reversed'} reveal animations showLabels={false} /></div>
        <div className="card-copy"><span className="position-index">{String(position?.number ?? index + 1).padStart(2, '0')}</span><div className="position-text">{position?.title && <h2>{position.title}</h2>}{position?.question && <p>{position.question}</p>}</div></div>
        <div className="card-label"><strong className="card-name">{card.name}</strong>{card.orientation === 'reversed' && <span className="card-orientation">Reversed</span>}</div>
        <p className="card-meaning">{getCardMeaning(card.id, card.orientation) ?? 'A meaning guide is not available for this card.'}</p>
      </article>)}
    </div>
    {flightCards && createPortal(
      <div className="deal-flight-layer" aria-hidden="true">
        {flightCards.map(({ origin, delay }, index) => {
          const target = gridRef.current?.querySelectorAll<HTMLElement>('.card-art-wrap')[index]?.getBoundingClientRect()
          if (!target) return null
          const scaleX = origin.width / target.width
          const scaleY = origin.height / target.height
          const deltaX = origin.left - target.left
          const deltaY = origin.top - target.top
          return <div
            className={`deal-flight ${flightActive ? 'is-moving' : ''}`}
            key={reading[index].card.id}
            style={{
              left: `${target.left + window.scrollX}px`,
              top: `${target.top + window.scrollY}px`,
              width: `${target.width}px`,
              height: `${target.height}px`,
              '--from-x': `${deltaX}px`,
              '--from-y': `${deltaY}px`,
              '--mid-x': `${deltaX * 0.48}px`,
              '--mid-y': `${deltaY * 0.48 - 34}px`,
              '--from-scale-x': scaleX,
              '--from-scale-y': scaleY,
              '--mid-scale-x': (scaleX + 1) / 2,
              '--mid-scale-y': (scaleY + 1) / 2,
              '--deal-delay': `${delay}ms`,
            } as CSSProperties}
          >
            <div className="deal-flight-inner">
              <div className="deal-flight-face deal-flight-back"><img src={cardBackUrl} alt="" /></div>
              <div className="deal-flight-face deal-flight-front"><CrystalCard card={reading[index].card} reversed={reading[index].card.orientation === 'reversed'} animations={false} showLabels={false} /></div>
            </div>
          </div>
        })}
      </div>,
      document.body,
    )}
    <div className="reading-actions"><button className="primary-button copy-button" onClick={onCopy}><span>Copy reading</span><span className="button-arrow" aria-hidden="true">↗</span></button><button className="secondary-button" onClick={onNew}>Prepare another reading</button><button className="text-button reset-setup reading-reset-button" onClick={onReset}>Reset the Deck</button></div>
  </section>
}
