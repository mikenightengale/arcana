import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { NotificationToast, type ToastMessage, type ToastVariant } from './NotificationToast'
import { loadState, saveState } from './persistence/db'
import { formatReading } from './tarot/formatter'
import { getCardMeaning } from './tarot/meanings'
import { mapReading } from './tarot/mapping'
import { CrystalCard } from './tarot/CrystalCard'
import { DeckGallery } from './tarot/DeckGallery'
import { parseSpread } from './tarot/parser'
import { createShuffledDeck, drawCards, remainingCards } from './tarot/shuffle'
import type { AppState, DeckManifest, ReadingPosition, TarotSpread } from './types/tarot'

const manifestUrl = '/decks/cathedral/deck.json'

interface CardRect {
  left: number
  top: number
  width: number
  height: number
}

interface DealFlight {
  origin: CardRect
  delay: number
}

function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [manifest, setManifest] = useState<DeckManifest | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [updateReady, setUpdateReady] = useState(false)
  const [dealOrigin, setDealOrigin] = useState<CardRect | null>(null)
  const dealing = useRef(false)
  const toastId = useRef(0)
  const notify = useCallback((variant: ToastVariant, message: string) => {
    setToast({ id: ++toastId.current, variant, message })
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() { setUpdateReady(true) },
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch(manifestUrl).then((response) => {
        if (!response.ok) throw new Error('The Cathedral deck manifest could not be loaded.')
        return response.json() as Promise<DeckManifest>
      }),
      loadState(),
    ]).then(([loadedManifest, saved]) => {
      if (!alive) return
      if (loadedManifest.cards.length !== 78) throw new Error('The Cathedral deck must contain exactly 78 cards.')
      setManifest(loadedManifest)
      const canonicalCards = new Map(loadedManifest.cards.map((card) => [card.id, card]))
      const hydrate = <T extends { id: string; orientation: 'upright' | 'reversed' }>(card: T) => ({ ...card, ...(canonicalCards.get(card.id) ?? {}), orientation: card.orientation })
      const migrated = saved ? {
        ...saved,
        deck: { ...saved.deck, cards: saved.deck.cards.map(hydrate) },
        reading: saved.reading?.map((entry) => ({ ...entry, card: hydrate(entry.card) })) ?? null,
      } : null
      setState(migrated ?? {
        stage: 'setup', deck: createShuffledDeck(loadedManifest.cards), spread: null,
        reading: null, drawCount: 20, sourceText: '',
      })
    }).catch((reason: unknown) => {
      if (alive) setError(reason instanceof Error ? reason.message : 'Arcana could not start.')
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (state) void saveState(state).catch(() => notify('error', 'Your latest changes could not be saved in this browser.'))
  }, [state])

  const parsed = useMemo(() => state?.sourceText.trim() ? parseSpread(state.sourceText) : null, [state?.sourceText])
  const count = parsed ? parsed.positions.length : (state?.drawCount ?? 20)
  const remaining = state ? remainingCards(state.deck) : 78

  function update(patch: Partial<AppState>) {
    setState((current) => current ? { ...current, ...patch } : current)
    setToast(null)
  }

  function onSpreadChange(sourceText: string) {
    if (!state) return
    const spread = sourceText.trim() ? parseSpread(sourceText) : null
    setState({ ...state, sourceText, spread, drawCount: spread ? spread.positions.length : 20 })
    setToast(null)
  }

  function beginShuffle() {
    if (!state) return
    if (!parsed && state.sourceText.trim()) {
      notify('warning', 'We couldn’t find numbered positions with questions. Check the spread format or clear it to draw without a spread.')
      return
    }
    if (!Number.isInteger(count) || count < 1 || count > 78) {
      notify('warning', 'Choose a number of cards from 1 to 78.')
      return
    }
    if (count > remaining) {
      notify('warning', `${count} cards requested. ${remaining} cards remain. Reset the deck before continuing.`)
      return
    }
    update({ spread: parsed, stage: 'shuffling', reading: null, drawCount: count })
  }

  async function deal() {
    if (!state || dealing.current) return
    dealing.current = true
    try {
      const result = drawCards(state.deck, count)
      const reading = mapReading(result.cards, parsed ?? state.spread)
      const nextState: AppState = {
        ...state,
        deck: result.deck,
        spread: parsed ?? state.spread,
        reading,
        stage: 'reading',
        drawCount: count,
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const source = document.querySelector<HTMLElement>('.shuffle-card-3') ?? document.querySelector<HTMLElement>('.shuffle-ritual')
      const bounds = source?.getBoundingClientRect()

      // Save the immutable draw before starting its visual presentation.
      await saveState(nextState)
      setToast(null)
      setDealOrigin(!reducedMotion && bounds ? {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      } : null)
      setState(nextState)
    } catch (reason) {
      notify('error', reason instanceof Error ? reason.message : 'The cards could not be drawn or saved.')
    } finally {
      dealing.current = false
    }
  }

  function newReading() {
    if (!state) return
    update({ stage: 'setup', spread: null, reading: null, sourceText: '', drawCount: 20 })
  }

  function resetDeck() {
    if (!state || !manifest) return
    update({ deck: createShuffledDeck(manifest.cards), stage: 'setup', spread: null, reading: null, drawCount: 20, sourceText: '' })
  }

  async function copyReading() {
    if (!state?.reading) return
    try {
      await navigator.clipboard.writeText(formatReading(state.reading, state.spread))
      notify('success', 'Reading copied to clipboard.')
    } catch {
      notify('error', 'Clipboard access was unavailable. Select and copy the reading text instead.')
    }
  }

  if (error && !state) return <main className="boot-error"><h1>Arcana</h1><p>{error}</p></main>
  if (!state || !manifest) return <main className="loading"><span className="loading-sigil" aria-hidden="true">✳</span><p>Opening the table</p></main>

  const cardBackUrl = `/decks/cathedral/${manifest.cardBack}`

  if (window.location.pathname.startsWith('/gallery')) {
    return <DeckGallery cards={manifest.cards} cardBackUrl={cardBackUrl} onReturn={() => { window.location.href = '/' }} />
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" onClick={(event) => event.preventDefault()} aria-label="Arcana home">
          <img className="brand-logo" src="/icons/arcana.svg" alt="" />
          <span><strong>Arcana</strong></span>
        </a>
        <nav className="steps" aria-label="Reading steps">
          <span className={state.stage === 'setup' ? 'step active' : 'step'}><i>01</i> Prepare</span>
          <span className="step-rule" />
          <span className={state.stage === 'shuffling' ? 'step active' : 'step'}><i>02</i> Shuffle</span>
          <span className="step-rule" />
          <span className={state.stage === 'reading' ? 'step active' : 'step'}><i>03</i> Reading</span>
        </nav>
        <div className="deck-status"><span className="status-dot" />{remaining} <span>cards remain</span></div>
      </header>

      <main id="top" className={`main-content stage-${state.stage}`}>
        {state.stage === 'setup' && <section className="setup-view" aria-labelledby="screen-title">
          <div className="eyebrow"><span /> A PRIVATE TABLE FOR YOUR QUESTIONS <span /></div>
          <h1 id="screen-title">Prepare your <em>reading</em></h1>
          <p className="intro">Bring your questions. The cards will meet you there.</p>

          <div className="setup-grid">
            <section className="spread-panel panel">
              <label className="panel-label" htmlFor="spread-input"><span className="label-mark">✦</span> Your spread <small>OPTIONAL</small></label>
              <p className="field-hint">Paste a numbered tarot spread in Markdown, or leave this empty for an open draw.</p>
              <textarea id="spread-input" value={state.sourceText} onChange={(event) => onSpreadChange(event.target.value)} placeholder={'## Tarot Spread — “Current Direction”\n\n1. **Current Energy**\n   What is the dominant energy surrounding this situation?\n\n2. **Hidden Influence**\n   What influence is operating beneath the surface?'} spellCheck={false} />
              {state.sourceText.trim() && <div className={`parse-status ${parsed ? 'valid' : 'invalid'}`} role="status">
                <span aria-hidden="true">{parsed ? '✓' : '!'}</span>
                {parsed ? `${parsed.positions.length} ${parsed.positions.length === 1 ? 'question' : 'questions'} detected` : 'No numbered questions detected yet'}
              </div>}
              {parsed && <div className="preview-wrap">
                <button className="text-button preview-toggle" onClick={() => setShowPreview((value) => !value)} aria-expanded={showPreview}>Spread preview <span>{showPreview ? '−' : '+'}</span></button>
                {showPreview && <ol className="spread-preview">{parsed.positions.map((position) => <li key={position.number}><strong>{position.title || `Position ${position.number}`}</strong><span>{position.question}</span></li>)}</ol>}
              </div>}
            </section>

            <section className="altar panel" aria-label="Cathedral deck">
              <div className="altar-arch" aria-hidden="true"><div className="glass glass-a" /><div className="glass glass-b" /><div className="glass glass-c" /></div>
              <div className="altar-stars" aria-hidden="true">✧　　　·　　✦　　　 ·　　✧</div>
              <div className="card-back" aria-hidden="true"><img src={cardBackUrl} alt="" /></div>
              <div className="altar-caption"><span>CRYSTAL GEOMETRY</span><small>78 cards · Rider–Waite–Smith archetypes</small></div>
            </section>
          </div>

          <div className="draw-settings">
            <div className="draw-summary"><span className="summary-icon">✧</span><span><strong>{parsed ? `${count} card${count === 1 ? '' : 's'} will be drawn` : 'Cards to draw'}</strong><small>{parsed ? 'One card for each position' : 'Choose how many cards to bring to the table'}</small></span></div>
            {!parsed && <label className="count-control"><span className="visually-hidden">Cards to draw</span><button aria-label="Decrease card count" onClick={() => update({ drawCount: Math.max(1, count - 1) })} disabled={count <= 1}>−</button><input type="number" min="1" max="78" value={count} onChange={(event) => update({ drawCount: Math.min(78, Math.max(1, Number(event.target.value) || 1)) })} /><button aria-label="Increase card count" onClick={() => update({ drawCount: Math.min(78, count + 1) })} disabled={count >= 78}>+</button></label>}
          </div>
          <button className="primary-button" onClick={beginShuffle}>
            <span>Shuffle the deck</span><span className="button-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="text-button reset-setup" onClick={resetDeck}>Reset the Deck</button>
          <p className="privacy-note"><span aria-hidden="true">◈</span> Your cards and readings stay on this device.</p>
          <a className="gallery-link" href="/gallery/crystal-geometry">Explore the Crystal Geometry deck</a>
        </section>}

        {state.stage === 'shuffling' && <section className="shuffle-view" aria-labelledby="screen-title">
          <div className="eyebrow"><span /> THE TABLE IS SET <span /></div>
          <h1 id="screen-title">Shuffling the <em>cards</em></h1>
          <p className="ceremony-line">The veil stirs.<br />Order becomes possibility.</p>
          <div className="shuffle-ritual" aria-hidden="true">
            <span className="shuffle-orbit orbit-one" /><span className="shuffle-orbit orbit-two" />
            {[0, 1, 2, 3, 4].map((card) => <div className={`shuffle-card shuffle-card-${card + 1}`} key={card}><img src={cardBackUrl} alt="" /></div>)}
            <span className="shuffle-spark spark-a">✧</span><span className="shuffle-spark spark-b">·</span><span className="shuffle-spark spark-c">✦</span>
          </div>
          <p className="draw-count-note">A reading of <strong>{count}</strong> {count === 1 ? 'card' : 'cards'}</p>
          <button className="primary-button draw-button" onClick={deal}><span>Draw all cards</span><span className="button-arrow" aria-hidden="true">↗</span></button>
          <button className="text-button return-button" onClick={() => update({ stage: 'setup' })}>Return to preparation</button>
        </section>}

        {state.stage === 'reading' && state.reading && <ReadingView reading={state.reading} spread={state.spread} dealOrigin={dealOrigin} cardBackUrl={cardBackUrl} onCopy={copyReading} onNew={newReading} onReset={resetDeck} />}
      </main>
      <footer className="footer"><span>Arcana</span><span>Quiet hands. Clear questions.</span><span>YOUR TABLE, YOURS ALONE</span></footer>
      {toast && <NotificationToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      {updateReady && <div className="update-toast" role="status"><span>A new version of Arcana is available.</span><button onClick={() => updateServiceWorker(true)}>Update</button><button className="dismiss" aria-label="Dismiss update notice" onClick={() => setUpdateReady(false)}>×</button></div>}
    </div>
  )
}

function ReadingView({ reading, spread, dealOrigin, cardBackUrl, onCopy, onNew, onReset }: {
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

  return <section className="reading-view" aria-labelledby="screen-title">
    <div className="eyebrow"><span /> THE CARDS HAVE SPOKEN <span /></div>
    <h1 id="screen-title">Your <em>reading</em></h1>
    <p className="intro">{spread?.title ? `A quiet moment with “${spread.title}”` : 'A quiet moment with the cards.'}</p>
    <div className="reading-grid" ref={gridRef}>
      {reading.map(({ position, card }, index) => <article className="reading-card" key={`${index}-${card.id}`}>
        <div className={`card-art-wrap ${flightCards ? 'card-art-hidden' : ''}`}><CrystalCard className="card-art" card={card} reversed={card.orientation === 'reversed'} reveal animations /></div>
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
            } as React.CSSProperties}
          >
            <div className="deal-flight-inner">
              <div className="deal-flight-face deal-flight-back"><img src={cardBackUrl} alt="" /></div>
              <div className="deal-flight-face deal-flight-front"><CrystalCard card={reading[index].card} reversed={reading[index].card.orientation === 'reversed'} animations={false} /></div>
            </div>
          </div>
        })}
      </div>,
      document.body,
    )}
    <div className="reading-actions"><button className="primary-button copy-button" onClick={onCopy}><span>Copy reading</span><span className="button-arrow" aria-hidden="true">↗</span></button><button className="secondary-button" onClick={onNew}>Prepare another reading</button><button className="text-button reset-setup reading-reset-button" onClick={onReset}>Reset the Deck</button></div>
  </section>
}

export default App
