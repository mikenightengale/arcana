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

export async function saveState(state: AppState): Promise<void> {
  await (await dbPromise).put('current-state', state, 'active')
}
