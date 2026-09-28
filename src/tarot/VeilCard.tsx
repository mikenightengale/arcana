import { useId, type CSSProperties, type ReactNode } from 'react'
import type { DeckCard, Suit } from '../types/tarot'
import { VeilScene } from './VeilScene'

const roman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
const minorNumerals: Record<string, string> = { ace: 'I', two: 'II', three: 'III', four: 'IV', five: 'V', six: 'VI', seven: 'VII', eight: 'VIII', nine: 'IX', ten: 'X' }
const veilPalettes: Record<Suit | 'major', { a: string; b: string; c: string }> = {
  major: { a: '#6d477d', b: '#302033', c: '#d5d0d8' },
  wands: { a: '#795184', b: '#37243d', c: '#d4ccd8' },
  cups: { a: '#654c79', b: '#292236', c: '#d4d0dc' },
  swords: { a: '#6c6578', b: '#28232f', c: '#e0dde3' },
  pentacles: { a: '#625064', b: '#302732', c: '#d5d1d7' },
}

type VeilCardProps = { card: DeckCard; reversed?: boolean; animations?: boolean; className?: string; reveal?: boolean; showLabels?: boolean }

export function VeilCard({ card, reversed = false, animations = true, className = '', reveal = false, showLabels = false }: VeilCardProps) {
  const uid = useId().replace(/:/g, '')
  const colors = veilPalettes[card.suit ?? 'major']
  const numeral = card.arcana === 'major' ? roman[card.number ?? 0] : (minorNumerals[card.rank ?? ''] ?? card.rank?.toUpperCase() ?? '')
  const starSeed = Array.from(card.id).reduce((seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0, 7)
  const stars = Array.from({ length: 44 }, (_, index) => {
    const x = 18 + ((starSeed + index * 73 + index * index * 17) % 204)
    const y = 23 + ((starSeed * 3 + index * 53 + index * index * 11) % 338)
    return { x, y, rx: index % 5 === 0 ? 1.05 : index % 3 === 0 ? .72 : .48, ry: index % 5 === 0 ? .72 : .48, opacity: index % 4 === 0 ? .3 : .17, delay: `${-((index * .83) % 9).toFixed(2)}s` }
  })
  const scene: ReactNode = <VeilScene card={card} colors={colors} />

  return <svg className={`veil-card ${animations ? 'motion-on' : 'motion-off'} ${reveal ? 'card-reveal' : ''} ${className}`} viewBox="0 0 240 384" role="img" aria-label={`${card.name}${reversed ? ', reversed' : ''}`} preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id={`veil-ground-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#35213f"/><stop offset=".38" stopColor="#211428"/><stop offset=".72" stopColor="#120d19"/><stop offset="1" stopColor="#07060b"/></linearGradient>
      <linearGradient id={`veil-silver-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#777080"/><stop offset=".48" stopColor="#e0dce4"/><stop offset="1" stopColor="#938a9d"/></linearGradient>
      <radialGradient id={`veil-art-smoke-${uid}`} cx="34%" cy="42%" r="72%"><stop stopColor="#a07bb4" stopOpacity=".37"/><stop offset=".46" stopColor="#60476f" stopOpacity=".22"/><stop offset="1" stopColor="#100d14" stopOpacity="0"/></radialGradient>
      <filter id={`veil-desaturate-${uid}`}><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <g transform={reversed ? 'rotate(180 120 192)' : undefined}>
      <rect width="240" height="384" fill={`url(#veil-ground-${uid})`} />
      <rect className="veil-art-smoke" width="240" height="384" fill={`url(#veil-art-smoke-${uid})`} />
      <g className="veil-stars" aria-hidden="true">{stars.map((star, index) => <ellipse className="veil-star" key={index} cx={star.x} cy={star.y} rx={star.rx} ry={star.ry} fill="#c5b5d0" opacity={star.opacity} style={{ '--star-delay': star.delay } as CSSProperties} />)}</g>
      <path className="veil-frame" d="M17 365Q23 324 17 285Q13 235 19 185Q14 126 19 78Q21 31 58 25Q80 20 104 25Q132 19 161 24Q194 18 216 38Q228 55 222 96Q228 142 221 185Q227 240 220 287Q226 329 221 366Q191 361 164 367Q136 371 116 366Q87 372 62 366Q39 371 17 365Z" fill="none" stroke={`url(#veil-silver-${uid})`} strokeWidth=".8" />
      <path d="M27 350Q34 319 27 284Q24 237 30 188Q25 134 30 81Q31 41 62 36Q86 31 105 36Q134 30 160 35Q190 30 207 47Q218 63 213 98Q219 144 212 188Q218 240 211 284Q216 319 208 351Q180 347 158 352Q132 356 114 351Q88 357 65 352Q44 357 27 350Z" fill="none" stroke="#705b78" strokeWidth=".55" opacity=".54" />
      <g className="veil-sigil" fill="none" stroke={`url(#veil-silver-${uid})`} strokeWidth=".8" opacity=".76">
        <path d="M120 50Q108 62 120 76Q132 64 120 50Z" />
        <path d="M120 56Q115 63 120 70Q125 63 120 56Z" fill="#d8d2dc" stroke="none" />
      </g>
      {showLabels && <text x="120" y="48" textAnchor="middle" className="veil-numeral">{numeral}</text>}
      <g className="veil-scene-layer">
        <g className="veil-echo" style={{ '--veil-echo': `${(card.number ?? card.id.length) % 5 - 2}px` } as CSSProperties}>
          <g transform="translate(-5 1)" opacity=".3" className="veil-echo" style={{ '--glass-url': `url(#veil-glass-${uid})`, '--frame-url': `url(#veil-silver-${uid})`, '--orb-url': `url(#veil-art-smoke-${uid})`, filter: `url(#veil-desaturate-${uid}) drop-shadow(0 0 5px rgba(210,198,218,.22))` } as CSSProperties}>{scene}</g>
        </g>
        <g className="veil-subject" style={{ '--glass-url': `url(#veil-glass-${uid})`, '--frame-url': `url(#veil-silver-${uid})`, '--orb-url': `url(#veil-art-smoke-${uid})`, filter: `url(#veil-desaturate-${uid}) drop-shadow(0 0 5px rgba(148,105,162,.34))` } as CSSProperties}>{scene}</g>
        <g className="veil-thread" aria-hidden="true">{scene}</g>
      </g>
      <path d="M40 314Q65 304 88 311Q119 319 147 310Q174 302 200 314Q184 324 197 342Q170 351 143 345Q116 339 91 347Q63 352 43 340Q54 328 40 314Z" fill="#110d15" fillOpacity=".75" stroke={`url(#veil-silver-${uid})`} strokeWidth=".65" opacity=".76" />
      <path d="M61 319Q83 327 104 318M138 318Q160 326 181 318M64 338Q91 344 115 335Q144 345 177 336" fill="none" stroke="#88768f" strokeWidth=".55" opacity=".54" />
      <path d="M115 306Q120 300 125 306Q120 313 115 306Z" fill="#a38bac" />
      {showLabels && <text x="120" y="332" textAnchor="middle" className="veil-title" style={{ fontSize: card.name.length > 15 ? 10 : 12 }}>{card.name.toUpperCase()}</text>}
      {showLabels && card.suit && <text x="120" y="344" textAnchor="middle" className="veil-suit">{card.suit.toUpperCase()}</text>}
      <path d="M108 362Q120 357 132 362M120 358v8m-3-4 3-4 3 4-3 4Z" fill="none" stroke="#a38bac" strokeWidth=".65" opacity=".72" />
    </g>
    <defs>
      <linearGradient id={`veil-glass-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b2a6bb" stopOpacity=".38"/><stop offset=".52" stopColor="#6f4f7b" stopOpacity=".5"/><stop offset="1" stopColor="#28202f" stopOpacity=".64"/></linearGradient>
    </defs>
  </svg>
}
