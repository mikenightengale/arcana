import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
const readingCard: RuntimeCard = { ...cards[0], orientation: 'reversed' }
const state: AppState = {
  stage: 'reading',
  deck: { cards: cards.map((card, index) => ({ ...card, orientation: index % 2 ? 'upright' : 'reversed' })), nextCardIndex: 1, resetAt: 1 },
  spread: { title: 'A title that must not be copied', positions: [position] },
  reading: [{ position, card: readingCard }],
  drawCount: 1,
  sourceText: '',
}

beforeEach(() => {
  mocks.loadState.mockResolvedValue(state)
  mocks.saveState.mockResolvedValue(undefined)
  mocks.writeText.mockResolvedValue(undefined)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => manifest }))
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: mocks.writeText } })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('reading copy notifications', () => {
  it('allows repeated copies and reports each success', async () => {
    render(<App />)
    const copyButton = await screen.findByRole('button', { name: 'Copy reading' })

    fireEvent.click(copyButton)
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Reading copied to clipboard.')).toBeInTheDocument()
    expect(mocks.writeText).toHaveBeenLastCalledWith('1. What should I notice?\nCard 0 — Reversed')

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
