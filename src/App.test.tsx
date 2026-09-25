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
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manifest }))
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
    const warning = await screen.findByText(/We couldn’t find numbered positions/)
    expect(warning.closest('.notification-toast')).toHaveClass('notification-toast-warning')
  })
})

describe('interactive shuffle', () => {
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
    act(() => vi.advanceTimersByTime(150))
    expect([...mocks.saveState.mock.calls].map(([saved]) => saved as AppState).some((saved) => saved.shuffleStatus === 'holding' && saved.deck.cards.map((card) => card.id).join() !== firstStep.join())).toBe(true)
    act(() => fireEvent.keyUp(hold, { key: ' ', code: 'Space' }))
    expect(screen.getByText('The deck is set.')).toBeInTheDocument()
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
  })
})
