import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { NotificationToast, type ToastMessage, type ToastVariant } from './NotificationToast'
import { loadState, saveState } from './persistence/db'
import { formatReading } from './tarot/formatter'
import { mapReading } from './tarot/mapping'
import { DeckPicker } from './tarot/DeckPicker'
import { DeckGallery } from './tarot/DeckGallery'
import { parseSpread } from './tarot/parser'
import { createReadyDeck, cycleTopCardToBottom, drawCards, remainingCards, shuffleDeck } from './tarot/shuffle'
import type { AppState, DeckManifest } from './types/tarot'
import { ReadingView } from './ReadingView'
import { appPath, assetPath, canonicalGalleryPath, galleryDeckId, isGalleryPath } from './paths'

const deckIds = ['cathedral', 'nocturne', 'veil'] as const

function CardCountControl({ value, onChange }: { value: number; onChange: (count: number) => void }) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => setDraft(String(value)), [value])

  function commitDraft() {
    const parsed = Number(draft)
    const next = Math.min(78, Math.max(1, Number.isInteger(parsed) ? parsed : 1))
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  function step(amount: number) {
    const next = Math.min(78, Math.max(1, value + amount))
    setDraft(String(next))
    onChange(next)
  }

  return <label className="count-control">
    <span className="visually-hidden">Cards to draw</span>
    <button type="button" aria-label="Decrease card count" onClick={() => step(-1)} disabled={value <= 1}>−</button>
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label="Cards to draw"
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value
        if (!/^\d*$/.test(nextDraft)) return
        setDraft(nextDraft)
        const next = Number(nextDraft)
        if (nextDraft && Number.isInteger(next) && next >= 1 && next <= 78) onChange(next)
      }}
      onBlur={commitDraft}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
    />
    <button type="button" aria-label="Increase card count" onClick={() => step(1)} disabled={value >= 78}>+</button>
  </label>
}

function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [manifests, setManifests] = useState<DeckManifest[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [showShuffleHelp, setShowShuffleHelp] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const stateRef = useRef<AppState | null>(null)
  const shuffleHelpRef = useRef<HTMLDivElement>(null)
  const holding = useRef(false)
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frozenWrite = useRef<Promise<void>>(Promise.resolve())
  const shuffleMotion = useRef(0)
  const activePointer = useRef<number | null>(null)
  const activeKey = useRef<string | null>(null)
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
    const currentUrl = new URL(window.location.href)
    const canonicalPath = canonicalGalleryPath(currentUrl.pathname)
    if (canonicalPath !== currentUrl.pathname) {
      currentUrl.pathname = canonicalPath
      window.history.replaceState(window.history.state, '', currentUrl)
    }
  }, [])

  useEffect(() => {
    let alive = true
    const manifestLoads = deckIds.map((id) => fetch(appPath(`decks/${id}/deck.json`)).then((response) => {
      if (!response.ok) throw new Error(`The ${id === 'nocturne' ? 'Nocturne' : id === 'veil' ? 'The Veil' : 'Crystal Geometry'} deck manifest could not be loaded.`)
      return response.json() as Promise<DeckManifest>
    }))
    Promise.all([Promise.all(manifestLoads), loadState()]).then(([loadedManifests, saved]) => {
      if (!alive) return
      const cathedral = loadedManifests.find((deck) => deck.id === 'cathedral')
      if (!cathedral || loadedManifests.some((deck) => deck.cards.length !== 78)) throw new Error('Each deck must contain exactly 78 cards.')
      const cathedralIds = cathedral.cards.map((card) => card.id)
      if (loadedManifests.some((deck) => deck.cards.map((card) => card.id).join('\u0000') !== cathedralIds.join('\u0000'))) {
        throw new Error('Every deck must contain the same 78 cards in the same order.')
      }
      setManifests(loadedManifests)
      const selectedDeckId = loadedManifests.some((deck) => deck.id === saved?.deckId) ? saved?.deckId ?? 'cathedral' : 'cathedral'
      const selectedManifest = loadedManifests.find((deck) => deck.id === selectedDeckId)!
      const canonicalCards = new Map(selectedManifest.cards.map((card) => [card.id, card]))
      const hydrate = <T extends { id: string; orientation: 'upright' | 'reversed' }>(card: T) => ({ ...card, ...(canonicalCards.get(card.id) ?? {}), orientation: card.orientation })
      const migrated = saved ? {
        ...saved,
        deckId: selectedDeckId,
        deck: { ...saved.deck, cards: saved.deck.cards.map(hydrate) },
        reading: saved.reading?.map((entry) => ({ ...entry, card: hydrate(entry.card) })) ?? null,
        // A hold cannot resume after reload. Preserve the last mutation and
        // recover into a settled, drawable state.
        shuffleStatus: saved.stage === 'shuffling'
          ? (saved.shuffleStatus === 'holding' || !saved.shuffleStatus ? 'frozen' as const : saved.shuffleStatus)
          : saved.shuffleStatus,
      } : null
      const initialState = migrated ?? {
        stage: 'setup' as const, deckId: 'cathedral', deck: createReadyDeck(cathedral.cards), spread: null,
        reading: null, drawCount: 20, sourceText: '',
      }
      stateRef.current = initialState
      setState(initialState)
    }).catch((reason: unknown) => {
      if (alive) setError(reason instanceof Error ? reason.message : 'Arcana could not start.')
    })
    return () => { alive = false }
  }, [])

  const manifest = manifests.find((deck) => deck.id === state?.deckId) ?? manifests.find((deck) => deck.id === 'cathedral') ?? null

  useEffect(() => {
    if (state) void saveState(state).catch(() => notify('error', 'Your latest changes could not be saved in this browser.'))
  }, [state])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') releaseShuffle()
    }
    const onWindowPointerEnd = (event: PointerEvent) => {
      if (activePointer.current === event.pointerId) releaseShuffle()
    }
    window.addEventListener('blur', releaseShuffle)
    window.addEventListener('pointerup', onWindowPointerEnd)
    window.addEventListener('pointercancel', onWindowPointerEnd)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('blur', releaseShuffle)
      window.removeEventListener('pointerup', onWindowPointerEnd)
      window.removeEventListener('pointercancel', onWindowPointerEnd)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      holding.current = false
      if (shuffleTimer.current) clearTimeout(shuffleTimer.current)
    }
  }, [])

  useEffect(() => {
    if (state?.stage !== 'shuffling') {
      setShowShuffleHelp(false)
      return
    }
    if (!showShuffleHelp) return

    const onPointerDown = (event: PointerEvent) => {
      if (!shuffleHelpRef.current?.contains(event.target as Node)) setShowShuffleHelp(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowShuffleHelp(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showShuffleHelp, state?.stage])

  const parsed = useMemo(() => state?.sourceText.trim() ? parseSpread(state.sourceText) : null, [state?.sourceText])
  const count = parsed ? parsed.positions.length : (state?.drawCount ?? 20)
  const remaining = state ? remainingCards(state.deck) : 78
  const deckStatus = remaining <= 13 ? 'critical' : remaining <= 26 ? 'low' : 'normal'

  function update(patch: Partial<AppState>) {
    const current = stateRef.current
    if (!current) return
    const next = { ...current, ...patch }
    stateRef.current = next
    setState(next)
    setToast(null)
  }

  function selectDeck(deckId: string) {
    const current = stateRef.current
    const selected = manifests.find((deck) => deck.id === deckId)
    if (!current || !selected || current.deckId === deckId) return
    const cardsById = new Map(selected.cards.map((card) => [card.id, card]))
    const hydrate = <T extends { id: string; orientation: 'upright' | 'reversed' }>(card: T) => ({ ...card, ...(cardsById.get(card.id) ?? {}), orientation: card.orientation })
    update({
      deckId,
      deck: { ...current.deck, cards: current.deck.cards.map(hydrate) },
      reading: current.reading?.map((entry) => ({ ...entry, card: hydrate(entry.card) })) ?? null,
    })
  }

  function onSpreadChange(sourceText: string) {
    const current = stateRef.current
    if (!current) return
    const spread = sourceText.trim() ? parseSpread(sourceText) : null
    const next = { ...current, sourceText, spread, drawCount: spread ? spread.positions.length : 20 }
    stateRef.current = next
    setState(next)
    setToast(null)
  }

  function beginShuffle() {
    const current = stateRef.current
    if (!current) return
    if (!parsed && current.sourceText.trim()) {
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
    update({ deck: shuffleDeck(current.deck), spread: parsed, stage: 'shuffling', shuffleStatus: remaining === 1 ? 'frozen' : 'ready', reading: null, drawCount: count })
  }

  function applyShuffleStep() {
    if (!holding.current) return
    const current = stateRef.current
    if (!current || current.stage !== 'shuffling') return
    const next: AppState = { ...current, deck: cycleTopCardToBottom(current.deck), shuffleStatus: 'holding' }
    stateRef.current = next
    setState(next)
    shuffleMotion.current += 1
    if (shuffleMotion.current % 3 === 0 && typeof navigator.vibrate === 'function') navigator.vibrate(8)
    void saveState(next).catch(() => notify('error', 'Your latest changes could not be saved in this browser.'))
    if (remainingCards(next.deck) > 1) {
      shuffleTimer.current = setTimeout(applyShuffleStep, 300 + Math.floor(Math.random() * 61))
    } else {
      releaseShuffle()
    }
  }

  function startShuffle() {
    const current = stateRef.current
    if (!current || current.stage !== 'shuffling' || holding.current || remainingCards(current.deck) < 2) return
    holding.current = true
    update({ shuffleStatus: 'holding' })
    applyShuffleStep()
  }

  function onShufflePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || (activePointer.current !== null)) return
    event.preventDefault()
    activePointer.current = event.pointerId
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Pointer capture is unavailable in some test browsers. */ }
    startShuffle()
  }

  function onShufflePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (activePointer.current !== event.pointerId) return
    event.preventDefault()
    releaseShuffle()
  }

  function onShufflePointerCancel() {
    releaseShuffle()
  }

  function onShuffleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    if (event.repeat || activeKey.current) return
    activeKey.current = event.key
    startShuffle()
  }

  function onShuffleKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== activeKey.current) return
    event.preventDefault()
    releaseShuffle()
  }

  function releaseShuffle() {
    if (!holding.current) return
    holding.current = false
    activePointer.current = null
    activeKey.current = null
    if (shuffleTimer.current) {
      clearTimeout(shuffleTimer.current)
      shuffleTimer.current = null
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(0)
    const current = stateRef.current
    if (!current || current.stage !== 'shuffling') return
    const frozen: AppState = { ...current, shuffleStatus: 'frozen' }
    stateRef.current = frozen
    setState(frozen)
    frozenWrite.current = saveState(frozen).catch(() => notify('error', 'The settled deck could not be saved in this browser.'))
  }

  async function deal() {
    const current = stateRef.current
    if (!current || current.stage !== 'shuffling' || current.shuffleStatus !== 'frozen' || holding.current || dealing.current) return
    dealing.current = true
    try {
      await frozenWrite.current
      // Saving the frozen deck can outlive the shuffle screen. Do not let a
      // draw that was started there overwrite a newer reset or navigation.
      if (stateRef.current !== current) return
      const result = drawCards(current.deck, count)
      const reading = mapReading(result.cards, parsed ?? current.spread)
      const nextState: AppState = {
        ...current,
        deck: result.deck,
        spread: parsed ?? current.spread,
        reading,
        stage: 'reading',
        shuffleStatus: undefined,
        drawCount: count,
      }
      // Save the immutable draw before starting its visual presentation.
      await saveState(nextState)
      setToast(null)
      stateRef.current = nextState
      setState(nextState)
    } catch (reason) {
      notify('error', reason instanceof Error ? reason.message : 'The cards could not be drawn or saved.')
    } finally {
      dealing.current = false
    }
  }

  function newReading() {
    if (!state) return
    update({ stage: 'setup', shuffleStatus: undefined, spread: null, reading: null, sourceText: '', drawCount: 20 })
  }

  function resetDeck() {
    if (!state || !manifest) return
    releaseShuffle()
    update({ deck: createReadyDeck(manifest.cards), stage: 'setup', shuffleStatus: undefined, spread: null, reading: null, drawCount: 20, sourceText: '' })
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

  const cardBackUrl = assetPath(`decks/${manifest.id}/${manifest.cardBack}`)

  if (isGalleryPath(window.location.pathname)) {
    const galleryId = galleryDeckId(window.location.pathname)
    const galleryManifest = manifests.find((deck) => deck.id === galleryId) ?? manifest
    const galleryBackUrl = assetPath(`decks/${galleryManifest.id}/${galleryManifest.cardBack}`)
    return <DeckGallery deckId={galleryManifest.id} deckName={galleryManifest.id === 'cathedral' ? 'Crystal Geometry' : galleryManifest.name} cards={galleryManifest.cards} cardBackUrl={galleryBackUrl} onReturn={() => { window.location.href = appPath() }} />
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Arcana home">
          <img className="brand-logo" src={assetPath('icons/arcana.svg')} alt="" />
          <span><strong>Arcana</strong></span>
        </a>
        <nav className="steps" aria-label="Reading steps">
          <span className={state.stage === 'setup' ? 'step active' : 'step'}><i>01</i> Prepare</span>
          <span className="step-rule" />
          <span className={state.stage === 'shuffling' ? 'step active' : 'step'}><i>02</i> Shuffle</span>
          <span className="step-rule" />
          <span className={state.stage === 'reading' ? 'step active' : 'step'}><i>03</i> Reading</span>
        </nav>
        <div className={`deck-status deck-status-${deckStatus}`} role="status" aria-label={`${remaining} ${remaining === 1 ? 'card remains' : 'cards remain'}${deckStatus === 'critical' ? ', very low' : deckStatus === 'low' ? ', running low' : ''}`}>
          <span className="status-dot" aria-hidden="true" />
          {remaining} <span>{remaining === 1 ? 'card remains' : 'cards remain'}</span>
        </div>
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

            <DeckPicker manifests={manifests} selectedDeckId={manifest.id} onSelect={selectDeck} />
          </div>

          <div className="draw-settings">
            <div className="draw-summary"><span className="summary-icon">✧</span><span><strong>{parsed ? `${count} card${count === 1 ? '' : 's'} will be drawn` : 'Cards to draw'}</strong><small>{parsed ? 'One card for each position' : 'Choose how many cards to bring to the table'}</small></span></div>
            {!parsed && <CardCountControl value={count} onChange={(drawCount) => update({ drawCount })} />}
          </div>
          <div className="setup-actions">
            <button className="primary-button shuffle-start-button" onClick={beginShuffle}>
              <span>Shuffle the deck</span><svg className="shuffle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2 6h2.5c2 0 3.2.9 4.3 2.5l6.4 9c1.1 1.6 2.4 2.5 4.3 2.5H22"/><path d="m18 14 4 4-4 4"/><path d="M2 18h2.5c2 0 3.2-.9 4.3-2.5l6.4-9C16.3 4.9 17.6 4 19.5 4H22"/><path d="m18 2 4 4-4 4"/></svg>
            </button>
            {remaining < 78 && <button className="text-button reset-setup" onClick={resetDeck}>Reset the Deck</button>}
          </div>
          <p className="privacy-note"><span aria-hidden="true">◈</span> Your cards and readings stay on this device.</p>
        </section>}

        {state.stage === 'shuffling' && <section className="shuffle-view" aria-labelledby="screen-title">
          <div className="eyebrow"><span /> THE TABLE IS SET <span /></div>
          <h1 id="screen-title">Set the <em>deck</em>{state.spread?.title && <> for <span className="shuffle-spread-title">{state.spread.title}</span></>}</h1>
          <div className="shuffle-guidance" ref={shuffleHelpRef}>
            <div className="shuffle-instructions">
              <p className="ceremony-line">Hold while the cards move.<br />Release when the moment feels right.</p>
              <button
                type="button"
                className="shuffle-help-toggle"
                aria-label="How shuffling works"
                aria-expanded={showShuffleHelp}
                aria-controls="shuffle-help-popover"
                onClick={() => setShowShuffleHelp((open) => !open)}
              >?</button>
            </div>
            <div id="shuffle-help-popover" className="shuffle-help-popover" role="region" aria-label="How shuffling works" hidden={!showShuffleHelp}>
              <p>Choosing “Shuffle the deck” randomizes the order and orientation of every undrawn card before you reach this page.</p>
              <p>Hold to cycle the top card to the bottom, one card at a time every 300–360 ms. Release to set the deck, then choose Draw Cards to reveal your reading.</p>
            </div>
          </div>
          <div className={`shuffle-table ${state.shuffleStatus === 'holding' ? 'is-shuffling' : ''} ${state.shuffleStatus === 'frozen' ? 'is-frozen' : ''}`} aria-hidden="true">
            <span className="shuffle-orbit orbit-one" /><span className="shuffle-orbit orbit-two" />
            <div className="shuffle-stack"><img src={cardBackUrl} alt="" /><img src={cardBackUrl} alt="" /><img src={cardBackUrl} alt="" /></div>
            <span className="shuffle-spark spark-a">✧</span><span className="shuffle-spark spark-b">·</span><span className="shuffle-spark spark-c">✦</span>
          </div>
          <p className="shuffle-status" role="status" aria-live="polite">
            {state.shuffleStatus === 'holding' ? 'The cards are moving.' : state.shuffleStatus === 'frozen' ? 'The deck is set.' : 'Ready when you are.'}
          </p>
          <button
            className={`primary-button hold-shuffle-button ${state.shuffleStatus === 'holding' ? 'is-held' : ''}`}
            type="button"
            aria-label="Hold to shuffle; release to stop"
            aria-pressed={state.shuffleStatus === 'holding'}
            onPointerDown={onShufflePointerDown}
            onPointerUp={onShufflePointerUp}
            onPointerCancel={onShufflePointerCancel}
            onLostPointerCapture={onShufflePointerCancel}
            onKeyDown={onShuffleKeyDown}
            onKeyUp={onShuffleKeyUp}
          >
            <span>{state.shuffleStatus === 'holding' ? 'Release to stop' : 'Hold to shuffle'}</span><svg className="shuffle-icon hold-shuffle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2 6h2.5c2 0 3.2.9 4.3 2.5l6.4 9c1.1 1.6 2.4 2.5 4.3 2.5H22"/><path d="m18 14 4 4-4 4"/><path d="M2 18h2.5c2 0 3.2-.9 4.3-2.5l6.4-9C16.3 4.9 17.6 4 19.5 4H22"/><path d="m18 2 4 4-4 4"/></svg>
          </button>
          <p className="draw-count-note">A reading of <strong>{count}</strong> {count === 1 ? 'card' : 'cards'}</p>
          <button className="primary-button draw-button" onClick={deal} disabled={state.shuffleStatus !== 'frozen' || holding.current}><span>Draw cards</span><svg className="draw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="12" height="17" rx="1.5"/><path d="M7 7h4M18 8v12m-4-4 4 4 4-4"/></svg></button>
          {state.shuffleStatus === 'frozen' && <button className="text-button return-button" onClick={() => update({ shuffleStatus: 'ready' })}>Shuffle again</button>}
          <button className="text-button return-button" onClick={() => { releaseShuffle(); update({ stage: 'setup', shuffleStatus: undefined }) }}>Return to preparation</button>
        </section>}

        {state.stage === 'reading' && state.reading && <ReadingView reading={state.reading} spread={state.spread} onCopy={copyReading} onNew={newReading} onReset={remaining < 78 ? resetDeck : undefined} />}
      </main>
      {toast && <NotificationToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      {updateReady && <div className="update-toast" role="status"><span>A new version of Arcana is available.</span><button onClick={() => updateServiceWorker(true)}>Update</button><button className="dismiss" aria-label="Dismiss update notice" onClick={() => setUpdateReady(false)}>×</button></div>}
    </div>
  )
}

export default App
