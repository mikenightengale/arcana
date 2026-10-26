import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState, DeckCard, DeckManifest, RuntimeCard } from './types/tarot'
import App from './App'

const mocks = vi.hoisted(() => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
  writeText: vi.fn(),
}))

vi.mock('./persistence/db', () => ({ loadState: mocks.loadState, saveState: mocks.saveState }))
vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: () => ({ updateServiceWorker: vi.fn() }) }))
vi.mock('./tarot/CrystalCard', () => ({ CrystalCard: () => null }))

const cards: DeckCard[] = Array.from({ length: 78 }, (_, number) => ({
  id: `card-${number}`, name: `Card ${number}`, arcana: number < 22 ? 'major' : 'minor', number,
}))
const manifest: DeckManifest = { id: 'cathedral', name: 'Cathedral', cardBack: 'back.svg', cards }
const nocturneManifest: DeckManifest = {
  id: 'nocturne', name: 'Nocturne', cardBack: 'backs/nocturne.svg',
  cards: cards.map((card) => ({ ...card, visual: { renderer: card.arcana === 'major' ? 'major' : 'pip', theme: 'nocturne', layout: 'orbit' } })),
}
const veilManifest: DeckManifest = {
  id: 'veil', name: 'The Veil', cardBack: 'backs/veil.svg',
  cards: cards.map((card) => ({ ...card, visual: { renderer: card.arcana === 'major' ? 'major' : 'pip', theme: 'veil', layout: 'threshold' } })),
}
const position = { number: 1, title: 'Focus', question: 'What should I notice?' }
const readingCard: RuntimeCard = { ...cards[0], id: 'the-fool', name: 'The Fool', orientation: 'reversed' }
const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
const state: AppState = {
  stage: 'reading',
  deck: { cards: cards.map((card, index) => ({ ...card, orientation: index % 2 ? 'upright' : 'reversed' })), nextCardIndex: 1, resetAt: 1 },
  spread: { title: 'A title that must be copied', positions: [position] },
  reading: [{ position, card: readingCard }],
  drawCount: 1,
  sourceText: '',
}

beforeEach(() => {
  mocks.loadState.mockResolvedValue(state)
  mocks.saveState.mockResolvedValue(undefined)
  mocks.writeText.mockResolvedValue(undefined)
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const deck = url.includes('/nocturne/') ? nocturneManifest : url.includes('/veil/') ? veilManifest : manifest
    return Promise.resolve({ ok: true, json: async () => deck })
  }))
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }) })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: mocks.writeText } })
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  vi.unstubAllGlobals()
  if (originalMatchMediaDescriptor) Object.defineProperty(window, 'matchMedia', originalMatchMediaDescriptor)
  else delete (window as Partial<Window>).matchMedia
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('reading copy notifications', () => {
  it('shows the reversed guide meaning with a spread question without changing copied text', async () => {
    render(<App />)

    expect(await screen.findByText('Pause before a leap; uncertainty or avoidable risk may need attention.')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Copy reading' }))
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledTimes(1))
    expect(mocks.writeText).toHaveBeenLastCalledWith('A title that must be copied\n\n1. What should I notice?\nThe Fool — Reversed')
    expect(mocks.writeText.mock.calls[0][0]).not.toContain('Pause before a leap')
  })

  it('shows the upright guide meaning for an open draw without a spread', async () => {
    mocks.loadState.mockResolvedValue({
      ...state,
      spread: null,
      reading: [{ card: { ...readingCard, orientation: 'upright' } }],
    })
    render(<App />)

    expect(await screen.findByText('New beginnings, openness, and a willingness to explore.')).toBeInTheDocument()
  })

  it('allows repeated copies and reports each success', async () => {
    render(<App />)
    const copyButton = await screen.findByRole('button', { name: 'Copy reading' })

    fireEvent.click(copyButton)
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Reading copied to clipboard.')).toBeInTheDocument()
    expect(mocks.writeText).toHaveBeenLastCalledWith('A title that must be copied\n\n1. What should I notice?\nThe Fool — Reversed')

    fireEvent.click(copyButton)
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Reading copied to clipboard.')).toBeInTheDocument()
  })

  it('shows clipboard failures as error toasts', async () => {
    mocks.writeText.mockRejectedValueOnce(new Error('Clipboard denied'))
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Copy reading' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Clipboard access was unavailable.')
  })

  it('shows invalid spread input as a warning toast', async () => {
    mocks.loadState.mockResolvedValue({ ...state, stage: 'setup', spread: null, reading: null, sourceText: 'not a numbered spread' })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Shuffle the deck' }))
    const warning = await screen.findByText(/We couldn’t find numbered or bulleted questions/)
    expect(warning.closest('.notification-toast')).toHaveClass('notification-toast-warning')
  })
})

describe('multiple spread setup', () => {
  it('counts all questions across titled spreads and previews each title', async () => {
    mocks.loadState.mockResolvedValue({
      ...state,
      stage: 'setup',
      spread: null,
      reading: null,
      sourceText: '',
      drawCount: 20,
    })
    render(<App />)
    const prompt = `Tarot Spread — “First”\n\n1. What is first?\n\nTarot Spread — “Second”\n\n1. What is next?`
    fireEvent.change(await screen.findByLabelText(/Your spread/), { target: { value: prompt } })
    expect(screen.getByText('2 questions detected')).toBeInTheDocument()
    expect(screen.getByText('2 cards will be drawn')).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})

describe('interactive shuffle', () => {
  beforeEach(() => {
    let value = 0
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array)[0] = value++
      return array
    })
  })

  function lastSaved(predicate: (saved: AppState) => boolean): AppState | undefined {
    return mocks.saveState.mock.calls.map(([saved]) => saved as AppState).reverse().find(predicate)
  }

  function setupState(): AppState {
    return {
      ...state,
      stage: 'setup',
      deck: { cards: cards.map((card) => ({ ...card, orientation: 'upright' })), nextCardIndex: 0, resetAt: 1 },
      spread: null,
      reading: null,
      drawCount: 1,
      sourceText: '',
      shuffleStatus: undefined,
    }
  }

  it('resets into a fresh shuffled deck and clears drawn reading progress', async () => {
    vi.mocked(globalThis.crypto.getRandomValues).mockImplementation((array) => {
      (array as Uint32Array)[0] = 0
      return array
    })
    mocks.loadState.mockResolvedValue(state)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reset the Deck' }))
    const reset = mocks.saveState.mock.calls.map(([saved]) => saved as AppState).at(-1)!
    expect(reset.deck.cards.map((card) => card.id)).toEqual([...cards.slice(1), cards[0]].map((card) => card.id))
    expect(reset.deck.cards.every((card) => card.orientation === 'upright')).toBe(true)
    expect(reset.deck.nextCardIndex).toBe(0)
    expect(reset.stage).toBe('setup')
    expect(reset.spread).toBeNull()
    expect(reset.reading).toBeNull()
  })

  it('defaults saved states without a deck choice to Crystal Geometry', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    expect(await screen.findByRole('button', { name: /Crystal Geometry/ })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(mocks.saveState.mock.calls.some(([saved]) => (saved as AppState).deckId === 'cathedral')).toBe(true))
  })

  it('explains the shuffle mechanics and dismisses the help with Escape or an outside press', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))

    const help = screen.getByRole('button', { name: 'How shuffling works' })
    expect(help).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(help)
    expect(help).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'How shuffling works' })).toHaveTextContent('order and orientation of every undrawn card')
    expect(screen.getByRole('region', { name: 'How shuffling works' })).toHaveTextContent('one card at a time every 300–360 ms')
    expect(screen.getByRole('region', { name: 'How shuffling works' })).toHaveTextContent('Release to set the deck')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'How shuffling works' })).not.toBeInTheDocument()

    fireEvent.click(help)
    fireEvent.pointerDown(screen.getByText('Ready when you are.'))
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'How shuffling works' })).not.toBeInTheDocument()
  })

  it('switches Nocturne artwork while retaining progress and persists the selected deck', async () => {
    const starting = setupState()
    starting.deck.cards = [...starting.deck.cards.slice(12), ...starting.deck.cards.slice(0, 12)]
    starting.deck.nextCardIndex = 9
    starting.deck.cards[0].orientation = 'reversed'
    const logicalCards = starting.deck.cards.map(({ id, orientation }) => ({ id, orientation }))
    mocks.loadState.mockResolvedValue(starting)
    const { unmount } = render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /Nocturne/ }))
    await waitFor(() => expect(mocks.saveState.mock.calls.some(([saved]) => (saved as AppState).deckId === 'nocturne')).toBe(true))
    const saved = mocks.saveState.mock.calls.map(([value]) => value as AppState).reverse().find((value) => value.deckId === 'nocturne')!
    expect(saved.deck.nextCardIndex).toBe(9)
    expect(saved.deck.cards.map(({ id, orientation }) => ({ id, orientation }))).toEqual(logicalCards)
    expect(saved.deck.cards[0]).toMatchObject({ id: logicalCards[0].id, orientation: 'reversed', visual: { theme: 'nocturne' } })
    expect(await screen.findByRole('button', { name: /Nocturne/ })).toHaveAttribute('aria-pressed', 'true')

    unmount()
    mocks.loadState.mockResolvedValue(saved)
    render(<App />)
    expect(await screen.findByRole('button', { name: /Nocturne/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to The Veil, renders its deck option, retains progress, and restores it from saved state', async () => {
    const starting = setupState()
    starting.deck.nextCardIndex = 4
    starting.deck.cards[0].orientation = 'reversed'
    mocks.loadState.mockResolvedValue(starting)
    const { unmount } = render(<App />)

    expect(await screen.findByRole('button', { name: /The Veil/ })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: /The Veil/ }))
    await waitFor(() => expect(mocks.saveState.mock.calls.some(([saved]) => (saved as AppState).deckId === 'veil')).toBe(true))
    const saved = mocks.saveState.mock.calls.map(([value]) => value as AppState).reverse().find((value) => value.deckId === 'veil')!
    expect(saved.deck.nextCardIndex).toBe(4)
    expect(saved.deck.cards[0]).toMatchObject({ id: cards[0].id, orientation: 'reversed', visual: { theme: 'veil', layout: 'threshold' } })
    expect(await screen.findByRole('button', { name: /The Veil/ })).toHaveAttribute('aria-pressed', 'true')

    unmount()
    mocks.loadState.mockResolvedValue(saved)
    render(<App />)
    expect(await screen.findByRole('button', { name: /The Veil/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes the working deck during a hold, freezes immediately on release, and draws that order', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))
    const hold = await screen.findByRole('button', { name: 'Hold to shuffle; release to stop' })
    vi.useFakeTimers()

    act(() => fireEvent.pointerDown(hold, { button: 0, pointerId: 7 }))
    expect(hold).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Draw cards' })).toBeDisabled()
    const duringHold = lastSaved((saved) => saved.shuffleStatus === 'holding' && saved.deck.cards.map((card) => card.id).join() !== cards.map((card) => card.id).join())
    expect(duringHold).toBeDefined()
    const workingOrder = duringHold!.deck.cards.map((card) => card.id)

    act(() => fireEvent.pointerUp(hold, { pointerId: 7 }))
    expect(screen.getByText('The deck is set.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draw cards' })).toBeEnabled()
    const frozen = lastSaved((saved) => saved.shuffleStatus === 'frozen')!
    expect(frozen.deck.cards.map((card) => card.id)).toEqual(workingOrder)

    const savesAtRelease = mocks.saveState.mock.calls.length
    act(() => { vi.advanceTimersByTime(1000) })
    expect(mocks.saveState.mock.calls.slice(savesAtRelease).every(([saved]) => (saved as AppState).deck.cards.map((card) => card.id).join() === workingOrder.join())).toBe(true)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Draw cards' }))
      await Promise.resolve()
    })
    expect(screen.getByText(frozen.deck.cards[0].name)).toBeInTheDocument()
    const drawn = lastSaved((saved) => saved.stage === 'reading')!
    expect(drawn.deck.cards.map((card) => card.id)).toEqual(workingOrder)
    expect(drawn.deck.nextCardIndex).toBe(1)
  })

  it('does not finish a pending draw after returning to preparation', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))
    const hold = await screen.findByRole('button', { name: 'Hold to shuffle; release to stop' })
    fireEvent.pointerDown(hold, { button: 0, pointerId: 9 })

    let finishFrozenSave!: () => void
    const frozenSave = new Promise<void>((resolve) => { finishFrozenSave = resolve })
    mocks.saveState.mockImplementation((saved: AppState) => saved.shuffleStatus === 'frozen' ? frozenSave : Promise.resolve())
    fireEvent.pointerUp(hold, { pointerId: 9 })
    fireEvent.click(screen.getByRole('button', { name: 'Draw cards' }))
    fireEvent.click(screen.getByRole('button', { name: 'Return to preparation' }))
    expect(await screen.findByRole('heading', { name: /Prepare your reading/ })).toBeInTheDocument()

    await act(async () => { finishFrozenSave(); await frozenSave })

    expect(screen.getByRole('heading', { name: /Prepare your reading/ })).toBeInTheDocument()
    expect(mocks.saveState.mock.calls.map(([saved]) => saved as AppState).some((saved) => saved.stage === 'reading')).toBe(false)
  })

  it('freezes safely on pointer cancellation and can resume the same deck on a later hold', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))
    const hold = await screen.findByRole('button', { name: 'Hold to shuffle; release to stop' })
    vi.useFakeTimers()
    act(() => fireEvent.pointerDown(hold, { button: 0, pointerId: 2 }))
    const firstSession = lastSaved((saved) => saved.shuffleStatus === 'holding')!.deck.cards.map((card) => card.id)
    act(() => fireEvent.pointerCancel(hold, { pointerId: 2 }))
    expect(screen.getByText('The deck is set.')).toBeInTheDocument()
    expect(lastSaved((saved) => saved.shuffleStatus === 'frozen')!.deck.cards.map((card) => card.id)).toEqual(firstSession)

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Shuffle again' })))
    act(() => fireEvent.pointerDown(hold, { button: 0, pointerId: 3 }))
    const resumed = lastSaved((saved) => saved.shuffleStatus === 'holding')!
    expect(resumed.deck.cards.map((card) => card.id)).not.toEqual(firstSession)
    act(() => fireEvent.pointerUp(hold, { pointerId: 3 }))
  })

  it('recovers a persisted interrupted hold as frozen and does not resume it after reload', async () => {
    const interrupted = { ...setupState(), stage: 'shuffling' as const, shuffleStatus: 'holding' as const }
    mocks.loadState.mockResolvedValue(interrupted)
    render(<App />)
    expect(await screen.findByText('The deck is set.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draw cards' })).toBeEnabled()
    expect(mocks.saveState.mock.calls.some(([saved]) => (saved as AppState).shuffleStatus === 'holding')).toBe(false)
  })

  it('makes the last remaining card drawable without starting a no-op shuffle', async () => {
    mocks.loadState.mockResolvedValue({
      ...setupState(),
      deck: { cards: cards.map((card) => ({ ...card, orientation: 'upright' })), nextCardIndex: 77, resetAt: 1 },
    })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))
    expect(screen.getByText('The deck is set.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draw cards' })).toBeEnabled()
  })

  it('uses keyboard hold and release even with reduced motion enabled', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }) })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Shuffle the deck/ }))
    const hold = await screen.findByRole('button', { name: 'Hold to shuffle; release to stop' })
    vi.useFakeTimers()
    act(() => fireEvent.keyDown(hold, { key: ' ', code: 'Space', repeat: false }))
    expect(hold).toHaveAttribute('aria-pressed', 'true')
    const firstStep = lastSaved((saved) => saved.shuffleStatus === 'holding')!.deck.cards.map((card) => card.id)
    act(() => fireEvent.keyDown(hold, { key: ' ', code: 'Space', repeat: true }))
    act(() => vi.advanceTimersByTime(250))
    expect([...mocks.saveState.mock.calls].map(([saved]) => saved as AppState).every((saved) => saved.shuffleStatus !== 'holding' || saved.deck.cards.map((card) => card.id).join() === firstStep.join())).toBe(true)
    act(() => vi.advanceTimersByTime(110))
    expect([...mocks.saveState.mock.calls].map(([saved]) => saved as AppState).some((saved) => saved.shuffleStatus === 'holding' && saved.deck.cards.map((card) => card.id).join() !== firstStep.join())).toBe(true)
    act(() => fireEvent.keyUp(hold, { key: ' ', code: 'Space' }))
    expect(screen.getByText('The deck is set.')).toBeInTheDocument()
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
  })
})

describe('manual yes/no readings', () => {
  function setupState(): AppState {
    return {
      ...state,
      stage: 'setup',
      spread: null,
      reading: null,
      sourceText: '',
      drawCount: 20,
      deck: { cards: cards.map((card) => ({ ...card, orientation: 'upright' })), nextCardIndex: 0, resetAt: 1 },
      shuffleStatus: undefined,
    }
  }

  function lastSaved(predicate: (saved: AppState) => boolean): AppState | undefined {
    return mocks.saveState.mock.calls.map(([saved]) => saved as AppState).reverse().find(predicate)
  }

  it('skips cards and shuffle for a yes/no investigation with a descriptive title and subsection', async () => {
    const exhausted = { ...setupState(), deck: { ...setupState().deck, nextCardIndex: 78 } }
    mocks.loadState.mockResolvedValue(exhausted)
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Your spread', { exact: false }), { target: { value: `### Why Did the Dream Specifically Show Toxic Friend A Kissing Me? — Yes/No Investigation

### I. Why a Kiss Instead of Another Form of Interaction?

* Was the kiss chosen because Toxic Friend A specifically desires kissing me?
* Was the kiss intended to communicate literal sexual desire rather than a general desire for approval?` } })
    expect(screen.getByText('0 cards will be drawn')).toBeInTheDocument()
    expect(document.querySelectorAll('.question-type-badge')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Answer questions' }))
    expect(await screen.findByRole('heading', { name: 'Your reading' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio', { name: 'Yes' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Draw cards' })).not.toBeInTheDocument()
    const saved = lastSaved((value) => value.stage === 'reading')!
    expect(saved.reading).toEqual([])
    expect(saved.deck).toEqual(exhausted.deck)
    fireEvent.click(screen.getAllByRole('radio', { name: 'Other' })[1])
    expect(screen.getAllByRole('radio', { name: 'Other' })[1]).toBeChecked()
  })

  it('routes an unheaded list of binary questions directly to answers', async () => {
    mocks.loadState.mockResolvedValue(setupState())
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Your spread', { exact: false }), { target: { value: '* Is it ready?\n* Would that be helpful?' } })
    expect(screen.getByText('0 cards will be drawn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Answer questions' }))
    expect(await screen.findAllByRole('radio', { name: 'No' })).toHaveLength(2)
    expect(lastSaved((value) => value.stage === 'reading')?.deck.nextCardIndex).toBe(0)
  })

  it('starts without shuffling even with an exhausted deck, saves exclusive answers, and restores them', async () => {
    mocks.loadState.mockResolvedValue({ ...state, stage: 'setup', reading: null, spread: null, sourceText: '', deck: { ...state.deck, nextCardIndex: 78 } })
    const view = render(<App />)
    fireEvent.change(await screen.findByLabelText('Your spread', { exact: false }), { target: { value: '## 🔮 Yes/No Questions — “Check”\n25. Is it ready?' } })
    expect(screen.getByText('0 cards will be drawn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Answer questions' }))
    const yes = await screen.findByRole('radio', { name: 'Yes' })
    fireEvent.click(yes)
    expect(yes).toBeChecked()
    expect(yes.closest('label')).toHaveClass('answer-yes')
    expect(yes.nextElementSibling?.querySelector('[aria-hidden]')).toHaveTextContent('✓')
    fireEvent.click(screen.getByRole('radio', { name: 'Other' }))
    expect(yes).not.toBeChecked()
    const other = screen.getByRole('radio', { name: 'Other' })
    expect(other.closest('label')).toHaveClass('answer-other')
    expect(other.nextElementSibling?.querySelector('[aria-hidden]')).toHaveTextContent('!')
    await waitFor(() => expect(mocks.saveState).toHaveBeenLastCalledWith(expect.objectContaining({ stage: 'reading', reading: [], yesNoAnswers: { 0: 'Other' }, deck: expect.objectContaining({ nextCardIndex: 78 }) })))
    const saved = mocks.saveState.mock.calls.at(-1)![0]
    view.unmount()
    mocks.loadState.mockResolvedValue(saved)
    render(<App />)
    expect(await screen.findByRole('radio', { name: 'Other' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Copy reading' }))
    await waitFor(() => expect(mocks.writeText).toHaveBeenLastCalledWith('Check\n\n25. Is it ready?\nOther'))
  })

  it('draws only the tarot positions in a mixed reading and copies both result types', async () => {
    mocks.loadState.mockResolvedValue({ ...state, stage: 'setup', reading: null, spread: null, sourceText: '' })
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Your spread', { exact: false }), { target: { value: '## Tarot Spread — “Tarot”\n1. What now?\n## Yes/No Questions — “Check”\n25. Is it ready?' } })
    expect(screen.getByText('1 card will be drawn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle the deck' }))
    const hold = screen.getByRole('button', { name: 'Hold to shuffle; release to stop' })
    fireEvent.keyDown(hold, { key: ' ' })
    fireEvent.keyUp(hold, { key: ' ' })
    fireEvent.click(screen.getByRole('button', { name: 'Draw cards' }))
    const no = await screen.findByRole('radio', { name: 'No' })
    fireEvent.click(no)
    expect(no.closest('label')).toHaveClass('answer-no')
    expect(no.nextElementSibling?.querySelector('[aria-hidden]')).toHaveTextContent('✕')
    await waitFor(() => expect(mocks.saveState).toHaveBeenLastCalledWith(expect.objectContaining({ reading: expect.any(Array), yesNoAnswers: { 1: 'No' } })))
    const saved = mocks.saveState.mock.calls.at(-1)![0] as AppState
    expect(saved.reading).toHaveLength(1)
    expect(saved.deck.nextCardIndex).toBe(2)
    expect(saved.reading![0].position?.question).toBe('What now?')
    fireEvent.click(screen.getByRole('button', { name: 'Copy reading' }))
    await waitFor(() => expect(mocks.writeText.mock.calls.at(-1)?.[0]).toContain('Check\n\n25. Is it ready?\nNo'))
    expect(mocks.writeText.mock.calls.at(-1)?.[0]).toContain('Tarot\n\n1. What now?\nCard ')
  })

  it('automatically detects a plain part heading without a type dropdown', async () => {
    mocks.loadState.mockResolvedValue({ ...state, stage: 'setup', reading: null, sourceText: '' })
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Your spread', { exact: false }), { target: { value: 'Part 2 — Yes/No Questions\n1. Ready?' } })
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Answer questions' }))
    expect(await screen.findByRole('radio', { name: 'Yes' })).toBeInTheDocument()
  })
})

describe('reading depth presets', () => {
  beforeEach(() => mocks.loadState.mockResolvedValue(null))

  it('defaults to 20, applies presets, supports custom counts, and respects pasted question counts', async () => {
    render(<App />)
    expect(await screen.findByRole('radio', { name: '20 cards — One subject with multiple dimensions' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '40–50 cards — Comprehensive situation analysis' }))
    expect(screen.getByRole('textbox', { name: 'Cards to draw' })).toHaveValue('45')
    fireEvent.change(screen.getByRole('textbox', { name: 'Cards to draw' }), { target: { value: '50' } })
    expect(screen.getByRole('radio', { name: '40–50 cards — Comprehensive situation analysis' })).toBeChecked()
    fireEvent.change(screen.getByLabelText(/Your spread/), { target: { value: '1. What matters?' } })
    expect(screen.getByText('1 card will be drawn')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '10 cards — One focused question' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Your spread/), { target: { value: '' } })
    expect(screen.getByRole('textbox', { name: 'Cards to draw' })).toHaveValue('20')
    fireEvent.click(screen.getByRole('radio', { name: '70 cards — Full-spectrum exploration' }))
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle the deck' }))
    expect(await screen.findByText('70', { selector: '.draw-count-note strong' })).toBeInTheDocument()
  })
})

describe('preset spread readings', () => {
  beforeEach(() => mocks.loadState.mockResolvedValue(null))

  it('previews and edits without consuming cards, reloads the draft, draws through the existing shuffle, and restores the reading', async () => {
    const view = render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Spread Library' }))
    expect(screen.getByRole('button', { name: /Shuffle the deck/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Celtic Cross/ }))
    fireEvent.change(screen.getByLabelText('Question for Present Situation'), { target: { value: 'What surrounds my project?' } })
    await waitFor(() => expect(mocks.saveState).toHaveBeenLastCalledWith(expect.objectContaining({ preparationMode: 'library', spread: expect.objectContaining({ presetId: 'celtic-cross' }) })))
    const draft = mocks.saveState.mock.calls.at(-1)![0] as AppState
    expect(draft.deck.nextCardIndex).toBe(0)
    expect(draft.reading).toBeNull()
    expect(draft.spread!.positions[0].question).toBe('What surrounds my project?')
    view.unmount()
    mocks.loadState.mockResolvedValue(draft)
    const restored = render(<App />)
    expect(await screen.findByLabelText('Question for Present Situation')).toHaveValue('What surrounds my project?')
    fireEvent.click(screen.getByRole('button', { name: 'Begin this spread' }))
    expect(await screen.findByRole('button', { name: 'Draw cards' })).toBeDisabled()
    expect(document.querySelectorAll('.spread-slot')).toHaveLength(10)
    const hold = screen.getByRole('button', { name: 'Hold to shuffle; release to stop' })
    fireEvent.keyDown(hold, { key: ' ' })
    fireEvent.keyUp(hold, { key: ' ' })
    const frozen = [...mocks.saveState.mock.calls].reverse().find(([value]) => (value as AppState).shuffleStatus === 'frozen')![0] as AppState
    expect(frozen.deck.nextCardIndex).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'Draw cards' }))
    await screen.findByRole('heading', { name: 'Your reading' })
    const drawn = mocks.saveState.mock.calls.at(-1)![0] as AppState
    expect(drawn.reading).toHaveLength(10)
    expect(drawn.deck.nextCardIndex).toBe(10)
    expect(drawn.reading!.map(entry => entry.card.id)).toEqual(frozen.deck.cards.slice(0,10).map(card => card.id))
    expect(drawn.reading!.map(entry => entry.position?.number)).toEqual([1,2,3,4,5,6,7,8,9,10])
    expect(drawn.reading![0].position?.question).toBe('What surrounds my project?')
    fireEvent.click(screen.getByRole('button', { name: 'Copy reading' }))
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('Category: Traditional')))
    expect(mocks.writeText.mock.calls.at(-1)![0]).toContain('1. **Present Situation**\n   What surrounds my project?')
    restored.unmount()
    mocks.loadState.mockResolvedValue(drawn)
    render(<App />)
    await screen.findByRole('heading', { name: 'Your reading' })
    expect(screen.getByRole('region', { name: 'Celtic Cross layout' })).toBeInTheDocument()
    expect(screen.getByText('What surrounds my project?', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '68 cards remain' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Prepare another reading' }))
    expect(screen.getByRole('button', { name: 'Free Draw' })).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('status', { name: '68 cards remain' })).toBeInTheDocument()
  })

  it('does not shuffle a preset when there are too few remaining cards', async () => {
    mocks.loadState.mockResolvedValue({ ...state, stage: 'setup', spread: null, reading: null, sourceText: '', deck: { ...state.deck, nextCardIndex: 77 } })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Spread Library' }))
    fireEvent.click(screen.getByRole('button', { name: /Three-Card Spread/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin this spread' }))
    expect(await screen.findByText('3 cards requested. 1 cards remain. Reset the deck before continuing.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Draw cards' })).not.toBeInTheDocument()
  })
})
