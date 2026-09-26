export type Orientation = 'upright' | 'reversed'
export type Stage = 'setup' | 'shuffling' | 'reading'
export type ShuffleStatus = 'ready' | 'holding' | 'frozen'
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Arcana = 'major' | 'minor'

export interface CardVisual {
  renderer: 'major' | 'pip' | 'court'
  theme?: 'crystal' | 'nocturne'
  composition?: string
  primarySymbol?: string
  layout: string
  animation?: string
  symbolCount?: number
}

export interface DeckCard {
  id: string
  name: string
  arcana: Arcana
  number?: number
  suit?: Suit
  rank?: string
  visual?: CardVisual
}

export interface DeckManifest {
  id: string
  name: string
  cardBack: string
  cards: DeckCard[]
}

export interface RuntimeCard extends DeckCard {
  orientation: Orientation
}

export interface DeckState {
  cards: RuntimeCard[]
  nextCardIndex: number
  resetAt: number
}

export interface TarotPosition {
  number: number
  title?: string
  question: string
}

export interface TarotSpread {
  title?: string
  positions: TarotPosition[]
}

export interface ReadingPosition {
  position?: TarotPosition
  card: RuntimeCard
}

export interface AppState {
  stage: Stage
  /** Selected presentation deck; omitted on older saved states. */
  deckId?: string
  /** Optional for compatibility with browser states saved before hold-to-shuffle. */
  shuffleStatus?: ShuffleStatus
  deck: DeckState
  spread: TarotSpread | null
  reading: ReadingPosition[] | null
  drawCount: number
  sourceText: string
}
