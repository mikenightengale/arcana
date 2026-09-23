export type Orientation = 'upright' | 'reversed'
export type Stage = 'setup' | 'shuffling' | 'reading'
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Arcana = 'major' | 'minor'

export interface DeckCard {
  id: string
  name: string
  arcana: Arcana
  number?: number
  suit?: Suit
  rank?: string
  image: string
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
  deck: DeckState
  spread: TarotSpread | null
  reading: ReadingPosition[] | null
  drawCount: number
  sourceText: string
}
