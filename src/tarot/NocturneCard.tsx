import { useId, type CSSProperties } from 'react'
import type { DeckCard } from '../types/tarot'
import { NocturneScene } from './NocturneScene'

const roman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
const minorNumerals: Record<string, string> = { ace: 'I', two: 'II', three: 'III', four: 'IV', five: 'V', six: 'VI', seven: 'VII', eight: 'VIII', nine: 'IX', ten: 'X' }

export function NocturneCard({ card, reversed = false, animations = true, className = '', reveal = false, showLabels = true }: {
  card: DeckCard
  reversed?: boolean
  animations?: boolean
  className?: string
  reveal?: boolean
  showLabels?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const numeral = card.arcana === 'major' ? roman[card.number ?? 0] : (minorNumerals[card.rank ?? ''] ?? card.rank?.toUpperCase() ?? '')
  let seed = 0
  for (const char of card.id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const phase = `-${((seed % 9000) / 1000).toFixed(2)}s`

  return <svg className={`nocturne-card ${animations ? 'motion-on' : 'motion-off'} ${reveal ? 'card-reveal' : ''} ${className}`} style={{ '--nocturne-phase': phase } as CSSProperties} viewBox="0 0 240 384" role="img" aria-label={`${card.name}${reversed ? ', reversed' : ''}`} preserveAspectRatio="xMidYMid meet">
    <defs>
      <radialGradient id={`nocturne-paper-${uid}`} cx="48%" cy="42%" r="74%"><stop stopColor="#17141c"/><stop offset=".64" stopColor="#0a090e"/><stop offset="1" stopColor="#050508"/></radialGradient>
      <radialGradient id={`nocturne-aura-${uid}`} cx="50%" cy="48%" r="58%"><stop stopColor="#79618f" stopOpacity=".32"/><stop offset=".48" stopColor="#504366" stopOpacity=".16"/><stop offset="1" stopColor="#211a2c" stopOpacity="0"/></radialGradient>
      <linearGradient id={`nocturne-ink-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6b6875"/><stop offset=".48" stopColor="#d1cfda"/><stop offset="1" stopColor="#85808f"/></linearGradient>
      <clipPath id={`nocturne-scene-${uid}`}><path d="M39 82Q120 64 201 82V289Q120 310 39 289Z"/></clipPath>
    </defs>
    <g className="nocturne-whole-card" transform={reversed ? 'rotate(180 120 192)' : undefined}>
      <rect width="240" height="384" fill={`url(#nocturne-paper-${uid})`}/>
      <path className="nocturne-border" d="M15 369V57Q15 19 52 19H188Q225 19 225 57V369H15Z" fill="none" stroke={`url(#nocturne-ink-${uid})`} strokeWidth=".9" strokeDasharray="120 3 2 3" opacity=".7"/>
      <path className="nocturne-border-inner" d="M23 361V59Q23 29 53 29H187Q217 29 217 59V361H23Z" fill="none" stroke="#77727f" strokeWidth=".55" opacity=".46"/>
      <path d="M31 344V72Q31 38 64 38H176Q209 38 209 72V344" fill="none" stroke="#77727f" strokeWidth=".5" strokeDasharray="1 5" opacity=".35"/>
      <g className="nocturne-corners" fill="none" stroke={`url(#nocturne-ink-${uid})`} strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 78Q43 78 43 58Q58 58 58 43M24 88l9-9m-7 22 18-18m-7-36q0 18 18 18M216 78q-19 0-19-20-15 0-15-15m34 45-9-9m7 22-18-18m7-36q0 18-18 18M24 306q19 0 19 20 15 0 15 15m-34-25 9 9m-7-22 18 18m-7 36q0-18 18-18M216 306q-19 0-19 20-15 0-15 15m34-25-9 9m7-22-18 18m7 36q0-18-18-18"/>
        <path d="m38 56 5-9 5 9-5 9Zm159 0 5-9 5 9-5 9ZM38 328l5-9 5 9-5 9Zm159 0 5-9 5 9-5 9Z"/>
        <path d="M31 192h14m150 0h14M120 38v9m0 290v9" opacity=".55"/>
      </g>
      <g className="nocturne-header-mark" fill="none" stroke={`url(#nocturne-ink-${uid})`} strokeWidth=".8">
        <path d="M91 58h58m-47 5h36" opacity=".56"/>
        <circle cx="120" cy="69" r="9" opacity=".55"/>
        <path d="M120 61a8 8 0 1 0 0 16 6 6 0 1 1 0-16Z" fill="#c8c4d0" stroke="none"/>
        <path d="m120 82 3 5-3 5-3-5Z" fill="#92889e" stroke="none"/>
      </g>
      <g className="nocturne-stars" fill="#d5d2dc">
        {Array.from({ length: 14 }, (_, i) => {
          const x = 46 + ((i * 47 + 15) % 148)
          const y = 91 + ((i * 71 + 29) % 186)
          return <path key={i} d={`M${x} ${y - 1.7}l.55 1.15 1.15.55-1.15.55-.55 1.15-.55-1.15-1.15-.55 1.15-.55Z`} opacity={i % 3 === 0 ? '.64' : '.28'} style={{ '--star-delay': `${((i * 1.9) % 9).toFixed(1)}s` } as CSSProperties}/>
        })}
      </g>
      {showLabels && <text x="120" y="46" textAnchor="middle" className="nocturne-numeral">{numeral}</text>}
      <path className="nocturne-arch" d="M39 289V185Q39 100 120 81Q201 100 201 185V289" fill="none" stroke={`url(#nocturne-ink-${uid})`} strokeWidth=".8" opacity=".52"/>
      <g clipPath={`url(#nocturne-scene-${uid})`}><ellipse className="nocturne-aura" cx="120" cy="190" rx="93" ry="120" fill={`url(#nocturne-aura-${uid})`}/></g>
      <g className="nocturne-art" clipPath={`url(#nocturne-scene-${uid})`}>
        <g className="nocturne-scene"><NocturneScene card={card}/></g>
        <g className="nocturne-line-trace" aria-hidden="true"><NocturneScene card={card}/></g>
      </g>
      <g className="nocturne-title-plate" fill="none" stroke={`url(#nocturne-ink-${uid})`} strokeWidth=".75">
        <path d="M42 306h42l7 7h58l7-7h42v44H42Z"/>
        <path d="M50 313h32m76 0h32M50 343h140" opacity=".4"/>
        <path d="m120 303 4 4-4 4-4-4Z" fill="#8c8498" stroke="none"/>
      </g>
      {showLabels && <text x="120" y="330" textAnchor="middle" className="nocturne-title" style={{ fontSize: card.name.length > 15 ? 10 : 12 }}>{card.name.toUpperCase()}</text>}
      {showLabels && card.suit && <text x="120" y="342" textAnchor="middle" className="nocturne-suit">{card.suit.toUpperCase()}</text>}
      <path d="M111 359h18m-9-4v8" fill="none" stroke="#8c8498" strokeWidth=".7" opacity=".62"/>
    </g>
  </svg>
}
