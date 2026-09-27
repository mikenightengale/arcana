import { openDB, type IDBPDatabase } from 'idb'
import type { AppState } from '../types/tarot'

let dbPromise: Promise<IDBPDatabase> | undefined

function invalidateConnection(connection: Promise<IDBPDatabase>): void {
  if (dbPromise === connection) dbPromise = undefined
}

function getDatabase(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    let connection: Promise<IDBPDatabase> | undefined
    connection = openDB('cathedral-arcana', 1, {
      upgrade(db) {
        db.createObjectStore('current-state')
      },
      blocking() {
        if (!connection) return
        invalidateConnection(connection)
        void connection.then((db) => db.close(), () => undefined)
      },
      terminated() {
        if (connection) invalidateConnection(connection)
      },
    })
    dbPromise = connection
    void connection.then((db) => {
      db.addEventListener('close', () => invalidateConnection(connection!))
    }, () => invalidateConnection(connection!))
  }
  return dbPromise
}

function isClosingDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const details = error as { name?: unknown; message?: unknown }
  return details.name === 'InvalidStateError'
    || (typeof details.message === 'string' && details.message.toLowerCase().includes('database connection is closing'))
}

async function withDatabase<T>(operation: (db: IDBPDatabase) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const connection = getDatabase()
    const db = await connection
    try {
      return await operation(db)
    } catch (error) {
      if (attempt > 0 || !isClosingDatabaseError(error)) throw error
      invalidateConnection(connection)
      db.close()
    }
  }
}

export async function loadState(): Promise<AppState | undefined> {
  return withDatabase((db) => db.get('current-state', 'active')) as Promise<AppState | undefined>
}

// Keep writes in order: the draw's explicit save must never be overtaken by an
// earlier effect save that was still waiting for IndexedDB to open.
let pendingWrite: Promise<unknown> = Promise.resolve()

export async function saveState(state: AppState): Promise<void> {
  const write = pendingWrite.catch(() => undefined).then(() =>
    withDatabase((db) => db.put('current-state', state, 'active')).then(() => undefined),
  )
  pendingWrite = write
  await write
}
