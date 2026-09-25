import { openDB } from 'idb'
import type { AppState } from '../types/tarot'

const dbPromise = openDB('cathedral-arcana', 1, {
  upgrade(db) {
    db.createObjectStore('current-state')
  },
})

export async function loadState(): Promise<AppState | undefined> {
  return (await dbPromise).get('current-state', 'active') as Promise<AppState | undefined>
}

// Keep writes in order: the draw's explicit save must never be overtaken by an
// earlier effect save that was still waiting for IndexedDB to open.
let pendingWrite: Promise<unknown> = Promise.resolve()

export async function saveState(state: AppState): Promise<void> {
  const write = pendingWrite.catch(() => undefined).then(async () => {
    await (await dbPromise).put('current-state', state, 'active')
  })
  pendingWrite = write
  await write
}
