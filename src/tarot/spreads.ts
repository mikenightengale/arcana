import type { TarotPosition, TarotSpread } from '../types/tarot'

export const spreadCategories = ['Traditional', 'Relationships', 'Investigative', 'Guidance & Decisions', 'Spiritual & Energetic'] as const
export interface SpreadDefinition extends TarotSpread {
  id: string
  title: string
  category: typeof spreadCategories[number]
  description: string
  cardCount: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  useCases: string[]
  provenance: 'Traditional' | 'Arcana preset'
  positions: (TarotPosition & { id: string; meaning: string; layout: { x: number; y: number; rotation?: number; layer?: number }; drawOrder: number; displayOrder: number })[]
}
type PositionSeed = [label: string, meaning: string, question: string]
type Point = [number, number, number?, number?]
const grid = (count: number, columns = 3): Point[] => Array.from({ length: count }, (_, i) => [i % columns * 160, Math.floor(i / columns) * 230])
const horseshoe: Point[] = [[0,0],[145,150],[290,250],[435,290],[580,250],[725,150],[870,0]]
function define(id: string, title: string, category: SpreadDefinition['category'], difficulty: SpreadDefinition['difficulty'], description: string, useCases: string[], seeds: PositionSeed[], points: Point[]): SpreadDefinition {
  return { id, title, category, difficulty, description, useCases, cardCount: seeds.length,
    provenance: category === 'Traditional' ? 'Traditional' : 'Arcana preset',
    positions: seeds.map(([label, meaning, question], i) => ({ id: `${id}-${i + 1}`, number: i + 1, title: label, meaning, question, type: 'tarot', drawOrder: i, displayOrder: i,
      layout: { x: points[i][0], y: points[i][1], rotation: points[i][2], layer: points[i][3] } })), }
}
export const spreadLibrary: SpreadDefinition[] = [
  define('three-card', 'Three-Card Spread', 'Traditional', 'Beginner', 'Follow a simple thread from what shaped the situation to where it may lead. A compact reading keeps everyday guidance focused.', ['Daily readings', 'Quick guidance', 'Simple decisions'], [
    ['Past', 'The background that shaped this moment.', 'What past influence is shaping this situation?'],
    ['Present', 'The situation as it stands now.', 'What deserves my attention in the present?'],
    ['Future', 'The direction developing from current conditions.', 'Where is this situation likely to lead?'],
  ], grid(3)),
  define('five-cross', 'Five-Card Cross', 'Traditional', 'Beginner', 'Place a situation at the center of its obstacles, roots, and surroundings to find a useful next step.', ['Additional context', 'Feeling stuck', 'Practical guidance'], [
    ['Current Situation', 'The central issue.', 'What defines the current situation?'],
    ['Primary Obstacle', 'The main challenge to movement.', 'What is the primary obstacle?'],
    ['Underlying Foundation', 'The roots supporting the issue.', 'What foundation underlies this situation?'],
    ['External Influences', 'Forces arriving from outside.', 'What external influences are affecting this situation?'],
    ['Guidance', 'A constructive way forward.', 'What guidance will help me move forward?'],
  ], [[160,230],[0,230],[160,460],[320,230],[160,0]]),
  define('horseshoe', 'Horseshoe Spread', 'Traditional', 'Intermediate', 'Trace a developing circumstance through its history, hidden pressures, and likely direction. Useful when events are still unfolding.', ['Developing circumstances', 'Changing influences', 'Next steps'], [
    ['Past', 'Events leading here.', 'What past events brought this situation here?'],
    ['Present', 'Current conditions.', 'What is happening now?'],
    ['Hidden Influences', 'Less apparent pressures.', 'What hidden influences are at work?'],
    ['Obstacles', 'Challenges along the path.', 'What obstacles need attention?'],
    ['External Influences', 'The surrounding environment.', 'What outside influences shape the path?'],
    ['Advice', 'A helpful response.', 'How can I respond constructively?'],
    ['Likely Outcome', 'The developing direction.', 'What outcome is likely on the current path?'],
  ], horseshoe),
  define('celtic-cross', 'Celtic Cross', 'Traditional', 'Advanced', 'Explore a complicated situation through its central tension, foundations, timing, and surrounding conditions. The cross and staff bring multiple perspectives into one reading.', ['Complex situations', 'Comprehensive investigations', 'Interconnected influences'], [
    ['Present Situation', 'The heart of the matter.', 'What defines the present situation?'],
    ['Crossing Influence', 'What intersects or challenges the center.', 'What influence is crossing this situation?'],
    ['Conscious Focus', 'What occupies conscious attention.', 'What is my conscious focus?'],
    ['Underlying Foundation', 'The deeper roots.', 'What foundation underlies the situation?'],
    ['Recent Past', 'What is receding.', 'What recent past influence is passing?'],
    ['Near Future', 'What is approaching.', 'What is developing in the near future?'],
    ['Self / Personal Position', 'Your stance within the situation.', 'What is my personal position in this situation?'],
    ['External Environment', 'People and conditions around you.', 'How is the external environment influencing events?'],
    ['Hopes and Fears', 'Desires and apprehensions.', 'What hopes and fears are shaping my approach?'],
    ['Likely Outcome', 'The direction under current conditions.', 'What outcome is likely if the current path continues?'],
  ], [[180,250],[180,250,90,2],[180,0],[180,500],[0,250],[360,250],[560,660],[560,440],[560,220],[560,0]]),
  define('nine-tableau', 'Nine-Card Tableau', 'Traditional', 'Intermediate', 'Read a three-by-three field to compare roots, present patterns, and developing possibilities. Rows connect context, agency, and direction.', ['Pattern recognition', 'Multiple aspects', 'Connections between influences'], [
    ['Past Context', 'The earlier setting.', 'What past context frames this situation?'],
    ['Present Context', 'The current setting.', 'What defines the present context?'],
    ['Emerging Context', 'The changing setting.', 'What context is emerging?'],
    ['Inherited Pattern', 'A pattern carried forward.', 'What pattern am I carrying from the past?'],
    ['Central Theme', 'The center linking the tableau.', 'What central theme connects these influences?'],
    ['Developing Pattern', 'A pattern taking shape.', 'What pattern is developing now?'],
    ['Past Resource', 'Something useful from experience.', 'What resource can I draw from past experience?'],
    ['Present Action', 'Available agency now.', 'What action can I take in the present?'],
    ['Possible Direction', 'The direction these threads suggest.', 'What possible direction brings these threads together?'],
  ], grid(9)),
  define('hidden-influences', 'Hidden Influences', 'Investigative', 'Intermediate', 'Separate visible circumstances from concealed influences and misunderstandings. Use it when an unclear situation needs several distinct lines of inquiry.', ['Unclear circumstances', 'Concealed factors', 'Changing situations'], [
    ['What Is Visible?', 'The apparent circumstances.', 'What is visible in this situation?'],
    ['What Remains Hidden?', 'What has not come into view.', 'What remains hidden?'],
    ['What Is Influencing Events?', 'The forces shaping movement.', 'What is influencing events?'],
    ['What Is Being Misunderstood?', 'An interpretation needing attention.', 'What is being misunderstood?'],
    ['What Is Changing?', 'An active transition.', 'What is changing?'],
    ['What May Emerge?', 'What may come into view.', 'What may emerge as events develop?'],
    ['What Deserves Attention?', 'The most useful focus.', 'What deserves my attention?'],
  ], grid(7)),
  define('intention-action', 'Intention vs. Action', 'Investigative', 'Intermediate', 'Examine intention, motivation, capability, willingness, behavior, and outcome separately. Use it when promises and results need careful comparison.', ['Promises and follow-through', 'Capability assessment', 'Conflicting signals'], [
    ['Stated Intention', 'The intention being expressed.', 'What is the stated intention?'],
    ['Underlying Motivation', 'What drives that intention.', 'What motivation underlies the stated intention?'],
    ['Actual Capability', 'The capacity to carry it out.', 'What is the actual capability to act?'],
    ['Willingness to Act', 'Readiness to use that capacity.', 'What is the willingness to act?'],
    ['Likely Behavior', 'Actions suggested by current conditions.', 'What behavior is likely?'],
    ['Observable Outcome', 'The result that could become apparent.', 'What observable outcome is likely to follow?'],
  ], grid(6)),
  define('truth-revelation', 'Truth & Revelation', 'Investigative', 'Advanced', 'Compare surface narratives, missing information, distortions, and contradictions before synthesizing the reading. Useful for unresolved questions with competing interpretations.', ['Conflicting interpretations', 'Missing information', 'Unresolved questions'], [
    ['Surface Narrative', 'The account currently in view.', 'What is the surface narrative?'],
    ['Underlying Reality', 'The deeper circumstances.', 'What underlies the surface narrative?'],
    ['Missing Information', 'An important gap.', 'What information is missing?'],
    ['Possible Distortion', 'Where the picture may be altered.', 'What possible distortion affects the picture?'],
    ['Internal Contradiction', 'Tension within the account.', 'What internal contradiction deserves examination?'],
    ['External Influence', 'A surrounding force.', 'What external influence affects this account?'],
    ['What May Become Clear', 'An emerging understanding.', 'What may become clear?'],
    ['Overall Synthesis', 'How the separate threads relate.', 'How do these threads fit together overall?'],
  ], grid(8,4)),
  define('relationship-dynamics', 'Relationship Dynamics', 'Relationships', 'Intermediate', 'Give each person space in the reading, then examine the shared connection and its direction. Useful when perspectives differ or a relationship is changing.', ['Differing perspectives', 'Interpersonal connections', 'Relationship development'], [
    ['Your Position', 'Your experience of the connection.', 'What is my current position in this connection?'],
    ['Their Position', 'The other person’s experience.', 'What is the other person’s current position?'],
    ['Your Contribution', 'What you bring to the dynamic.', 'What am I contributing to the relationship?'],
    ['Their Contribution', 'What they bring to the dynamic.', 'What is the other person contributing?'],
    ['Shared Connection', 'The meeting point between you.', 'What defines our shared connection?'],
    ['Obstacle', 'A challenge in the dynamic.', 'What obstacle affects this connection?'],
    ['Possible Direction', 'How the connection may develop.', 'What direction may this relationship take?'],
  ], [[0,0],[360,0],[0,230],[360,230],[180,230],[180,460],[180,690]]),
  define('decision-crossroads', 'Decision Crossroads', 'Guidance & Decisions', 'Beginner', 'Compare two options using the same three questions for each. The balanced columns make benefits, challenges, and likely directions easy to compare.', ['Two available choices', 'Tradeoffs', 'Choosing a direction'], [
    ['Option A — Opportunity', 'The potential of the first option.', 'What opportunity does option A offer?'],
    ['Option A — Challenge', 'The cost or difficulty of the first option.', 'What challenge does option A present?'],
    ['Option A — Direction', 'Where the first option may lead.', 'Where is option A likely to lead?'],
    ['Option B — Opportunity', 'The potential of the second option.', 'What opportunity does option B offer?'],
    ['Option B — Challenge', 'The cost or difficulty of the second option.', 'What challenge does option B present?'],
    ['Option B — Direction', 'Where the second option may lead.', 'Where is option B likely to lead?'],
  ], [[0,0],[0,230],[0,460],[230,0],[230,230],[230,460]]),
  define('spiritual-communication', 'Spiritual Communication', 'Spiritual & Energetic', 'Advanced', 'Structure a spiritual communication into presence, intention, message, and guidance. Distinct positions help keep the message separate from its interpretation and suggested response.', ['Spiritual messages', 'Intentions and guidance', 'Structured communication'], [
    ['Communicating Presence', 'The character of the presence.', 'What characterizes the communicating presence?'],
    ['Intention', 'The purpose of the communication.', 'What is the intention behind this communication?'],
    ['Central Message', 'The heart of what is conveyed.', 'What is the central message?'],
    ['Context', 'The setting that gives the message meaning.', 'What context helps me understand this message?'],
    ['Interpretive Challenge', 'Where understanding may be difficult.', 'What might I misunderstand about this message?'],
    ['Guidance', 'The guidance being offered.', 'What guidance is being offered?'],
    ['Boundary', 'A boundary for the exchange.', 'What boundary deserves attention in this communication?'],
    ['Suggested Response', 'A way to respond.', 'How am I invited to respond?'],
    ['Integration', 'How the message connects to the wider path.', 'How can I integrate this communication?'],
  ], grid(9)),
  define('energetic-connection', 'Energetic Connection', 'Spiritual & Energetic', 'Intermediate', 'Explore an energetic connection through its nature, reciprocal influences, boundaries, and development. Useful when you want to understand how a connection is functioning.', ['Connection dynamics', 'Energetic boundaries', 'Connection development'], [
    ['Nature of the Connection', 'The connection’s central quality.', 'What is the nature of this energetic connection?'],
    ['Your Energy', 'What you bring into the connection.', 'What energy am I bringing to this connection?'],
    ['Other Energy', 'What comes from the other side.', 'What energy is arriving from the other side?'],
    ['Supporting Influence', 'What nourishes the connection.', 'What influence supports this connection?'],
    ['Disrupting Influence', 'What creates friction.', 'What influence disrupts this connection?'],
    ['Boundary', 'The boundary needing attention.', 'What boundary will serve this connection?'],
    ['Development', 'How the connection may unfold.', 'How is this connection likely to develop?'],
  ], [[180,0],[0,230],[360,230],[0,460],[360,460],[180,460],[180,690]]),
]

export function validateSpread(definition: SpreadDefinition): string[] {
  const errors: string[] = []
  const positions = definition.positions
  if (positions.length !== definition.cardCount || !positions.length) errors.push('Card count must match positions')
  if (new Set(positions.map(p => p.id)).size !== positions.length) errors.push('Position IDs must be unique')
  for (const key of ['drawOrder', 'displayOrder'] as const) {
    if (positions.map(p => p[key]).sort((a,b) => a-b).some((order,i) => order !== i)) errors.push(`${key} must be a complete ordering`)
  }
  if (positions.some(p => !p.id || !p.title || !p.meaning || !p.question.trim() || !Number.isFinite(p.layout.x) || !Number.isFinite(p.layout.y) || !Number.isFinite(p.layout.rotation ?? 0))) errors.push('Invalid position')
  return errors
}

export function createPresetSpread(definition: SpreadDefinition): TarotSpread {
  return { presetId: definition.id, title: definition.title, category: definition.category, description: definition.description,
    useCases: [...definition.useCases], provenance: definition.provenance,
    positions: definition.positions.map(p => ({ ...p, layout: { ...p.layout } })).sort((a,b) => a.displayOrder - b.displayOrder) }
}
