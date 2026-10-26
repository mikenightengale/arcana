import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPresetSpread, spreadLibrary } from '../tarot/spreads'
import type { AppState } from '../types/tarot'

const { openDB } = vi.hoisted(() => ({ openDB: vi.fn() }))
vi.mock('idb', () => ({ openDB }))

const state = { stage: 'setup' } as unknown as AppState

function makeDatabase(options: { get?: () => Promise<unknown>; put?: () => Promise<unknown> } = {}) {
  const listeners = new Map<string, EventListener>()
  return {
    get: vi.fn(options.get ?? (() => Promise.resolve(state))),
    put: vi.fn(options.put ?? (() => Promise.resolve())),
    addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
    close: vi.fn(),
    emitClose() { listeners.get('close')?.(new Event('close')) },
  }
}

describe('IndexedDB connection recovery', () => {
  beforeEach(() => {
    vi.resetModules()
    openDB.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reopens the database after the browser closes its connection', async () => {
    const first = makeDatabase()
    const second = makeDatabase()
    openDB.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    const { loadState } = await import('./db')

    expect(await loadState()).toBe(state)
    first.emitClose()
    expect(await loadState()).toBe(state)
    expect(openDB).toHaveBeenCalledTimes(2)
  })

  it('retries a draw save once when its cached connection is already closing', async () => {
    const closing = makeDatabase({
      put: () => Promise.reject(Object.assign(new Error("Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing."), { name: 'InvalidStateError' })),
    })
    const fresh = makeDatabase()
    openDB.mockResolvedValueOnce(closing).mockResolvedValueOnce(fresh)
    const { saveState } = await import('./db')

    await expect(saveState(state)).resolves.toBeUndefined()
    expect(closing.put).toHaveBeenCalledTimes(1)
    expect(closing.close).toHaveBeenCalledTimes(1)
    expect(fresh.put).toHaveBeenCalledTimes(1)
    expect(openDB).toHaveBeenCalledTimes(2)
  })
})


describe('preset active state persistence', () => {
  it('round trips edited questions and visual metadata through the existing active-state store', async () => {
    vi.resetModules()
    openDB.mockReset()
    const spread = createPresetSpread(spreadLibrary.find(s => s.id === 'celtic-cross')!)
    spread.positions[1].question = 'What crosses my path?'
    const active = { ...state, preparationMode: 'library', spread } as AppState
    let stored: AppState | undefined
    const db = makeDatabase({ get: async () => structuredClone(stored) })
    const put = vi.fn(async (...args: unknown[]) => { stored = structuredClone(args[1] as AppState) })
    Object.assign(db, { put })
    openDB.mockResolvedValue(db)
    const { saveState, loadState } = await import('./db')
    await saveState(active)
    const restored = await loadState()
    expect(restored).toEqual(active)
    expect(restored?.spread?.positions[1]).toMatchObject({ question: 'What crosses my path?', layout: { rotation: 90, layer: 2 } })
    expect(db.put).toHaveBeenCalledWith('current-state', active, 'active')
  })
})
