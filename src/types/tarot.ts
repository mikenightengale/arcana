export type Orientation = 'upright' | 'reversed'
export type Stage = 'setup' | 'shuffling' | 'reading'
export type ShuffleStatus = 'ready' | 'holding' | 'frozen'
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Arcana = 'major' | 'minor'

export interface CardVisual {
  renderer: 'major' | 'pip' | 'court'
  theme?: 'crystal' | 'nocturne' | 'veil'
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

export type QuestionType = 'tarot' | 'yes-no'
export type YesNoAnswer = 'Yes' | 'No' | 'Other'
export type YesNoAnswers = Record<number, YesNoAnswer>

export interface PositionLayout { x: number; y: number; rotation?: number; layer?: number }

export interface TarotPosition {
  id?: string
  meaning?: string
  layout?: PositionLayout
  drawOrder?: number
  displayOrder?: number
  type?: QuestionType
  number: number
  title?: string
  question: string
  /** Section heading when the prompt contains multiple spreads. */
  sectionTitle?: string
}

export interface TarotSpread {
  presetId?: string
  category?: string
  description?: string
  useCases?: string[]
  provenance?: 'Traditional' | 'Arcana preset'
  title?: string
  positions: TarotPosition[]
}

export interface ReadingPosition {
  position?: TarotPosition
  card: RuntimeCard
}

export interface AppState {
  preparationMode?: 'free' | 'custom' | 'library'
  stage: Stage
  /** Selected presentation deck; omitted on older saved states. */
  deckId?: string
  /** Optional for compatibility with browser states saved before hold-to-shuffle. */
  shuffleStatus?: ShuffleStatus
  deck: DeckState
  spread: TarotSpread | null
  reading: ReadingPosition[] | null
  drawCount: number
  questionType?: QuestionType
  yesNoAnswers?: YesNoAnswers
  sourceText: string
}
