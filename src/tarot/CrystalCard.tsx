import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DeckCard } from '../types/tarot'
import { palettes } from './cardGeometry'
import { MajorScene } from './MajorScene'
import { CourtScene, PipScene } from './MinorScenes'
import { NocturneCard } from './NocturneCard'

const roman = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
const visibilityListeners = new WeakMap<Element, (visible: boolean) => void>()
let viewportObserver: IntersectionObserver | null = null

function watchVisibility(element: Element, listener: (visible: boolean) => void) {
  if (!viewportObserver) {
    viewportObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibilityListeners.get(entry.target)?.(entry.isIntersecting))
    }, { rootMargin: '80px' })
  }
  visibilityListeners.set(element, listener)
  viewportObserver.observe(element)
  return () => {
    visibilityListeners.delete(element)
    viewportObserver?.unobserve(element)
  }
}

type CrystalCardProps = { card: DeckCard; reversed?: boolean; animations?: boolean; className?: string; reveal?: boolean; showLabels?: boolean }

export function CrystalCard(props: CrystalCardProps) {
  return props.card.visual?.theme === 'nocturne' ? <NocturneCard {...props} /> : <CrystalGeometryCard {...props} />
}

function CrystalGeometryCard({ card, reversed = false, animations = true, className = '', reveal = false, showLabels = true }: CrystalCardProps) {
  const theme = card.suit ?? 'major'
  const colors = palettes[theme]
  // Each card instance needs its own paint servers (gallery, preview, and deal animation can coexist).
  const uid = useId().replace(/:/g, '')
  const cardRef = useRef<SVGSVGElement>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (!animations) { setInView(false); return }
    if (!('IntersectionObserver' in window)) { setInView(true); return }
    const node = cardRef.current
    if (!node) return
    return watchVisibility(node, setInView)
  }, [animations, card.id])
  let seed = 0
  for (const char of card.id) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const phase = `-${((seed % 9000) / 1000).toFixed(2)}s`
  const animationName = card.visual?.animation ?? 'crystal-breath'
  const motionActive = animations && inView
  const minorNumerals: Record<string, string> = { ace: 'I', two: 'II', three: 'III', four: 'IV', five: 'V', six: 'VI', seven: 'VII', eight: 'VIII', nine: 'IX', ten: 'X' }
  const numeral = card.arcana === 'major' ? roman[card.number ?? 0] : (minorNumerals[card.rank ?? ''] ?? card.rank?.toUpperCase() ?? '')
  const isCourt = card.arcana === 'minor' && ['page','knight','queen','king'].includes(card.rank ?? '')
  let scene: ReactNode
  if (card.arcana === 'major') scene = <MajorScene card={card} colors={colors}/>
  else if (isCourt) scene = <CourtScene card={card} colors={colors}/>
  else scene = <PipScene card={card} colors={colors}/>
  return <svg ref={cardRef} className={`crystal-card ${motionActive ? 'motion-on' : 'motion-off'} ${reveal ? 'card-reveal' : ''} ${className}`} data-animation={animationName} style={{ '--card-phase': phase } as CSSProperties} viewBox="0 0 240 384" role="img" aria-label={`${card.name}${reversed ? ', reversed' : ''}`} preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id={`base-${uid}`} x2=".2" y2="1"><stop stopColor="#101936"/><stop offset=".5" stopColor="#080d20"/><stop offset="1" stopColor="#111327"/></linearGradient>
      <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={colors.c} stopOpacity=".8"/><stop offset=".48" stopColor={colors.a} stopOpacity=".48"/><stop offset="1" stopColor={colors.b} stopOpacity=".78"/></linearGradient>
      <linearGradient id={`frame-${uid}`}><stop stopColor="#7057b5"/><stop offset=".5" stopColor="#d2c5ff"/><stop offset="1" stopColor="#7057b5"/></linearGradient>
      <radialGradient id={`orb-${uid}`}><stop stopColor={colors.c} stopOpacity=".6"/><stop offset=".5" stopColor={colors.a} stopOpacity=".18"/><stop offset="1" stopColor="#070b1c" stopOpacity="0"/></radialGradient>
      <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g className="whole-card" transform={reversed ? 'rotate(180 120 192)' : undefined}>
      <rect width="240" height="384" fill={`url(#base-${uid})`}/><rect width="240" height="384" fill={`url(#orb-${uid})`} opacity=".44"/>
      <path d="M18 34Q120 8 222 34V350Q120 376 18 350Z" fill="none" stroke={`url(#frame-${uid})`} strokeOpacity=".48" strokeWidth=".7"/>
      <path d="M24 40Q120 17 216 40V344Q120 367 24 344Z" fill="none" stroke="#9e8ce1" strokeOpacity=".19" strokeWidth=".7"/>
      <g className="ambient-stars" opacity=".8">{Array.from({length:20},(_,i)=>{const x=32+((i*53+17)%176), y=51+((i*79+23)%278);return <circle key={i} cx={x} cy={y} r={i%5===0?1.1:.55} fill={i%3===0?colors.c:'#c6f2ff'} style={{'--twinkle-delay':`${((i*1.73)%8).toFixed(2)}s`} as CSSProperties}/>})}</g>
      <path d="M29 58 39 48 49 58 39 68Z M191 58 201 48 211 58 201 68Z M29 326 39 316 49 326 39 336Z M191 326 201 316 211 326 201 336Z" fill="none" stroke={`url(#frame-${uid})`} strokeWidth=".9"/>
      <path d="M39 90V71M201 90V71M39 294V313M201 294V313" stroke={`url(#frame-${uid})`} strokeWidth=".7" opacity=".7"/>
      <path d="M48 49Q120 35 192 49M48 335Q120 349 192 335" fill="none" stroke={`url(#frame-${uid})`} strokeWidth=".55" opacity=".65"/>
      <g fill="none" stroke={`url(#frame-${uid})`} strokeWidth=".65" opacity=".35">
        <path d="M40 91C40 81 52 78 56 87 58 92 54 96 50 94M200 91C200 81 188 78 184 87 182 92 186 96 190 94M40 293C40 303 52 306 56 297 58 292 54 288 50 290M200 293C200 303 188 306 184 297 182 292 186 288 190 290"/>
        <path d="M120 71 126 77 120 83 114 77ZM120 301 126 307 120 313 114 307Z"/>
      </g>
      {showLabels && <text x="120" y="57" textAnchor="middle" className="card-numeral">{numeral}</text>}
      <g className={`card-scene card-${uid} suit-${card.suit ?? 'major'}`} style={{'--accent':colors.a} as CSSProperties}>
        <path d="M120 101 212 197 120 293 28 197Z M120 106V288M35 197H205" fill="none" stroke={colors.c} strokeOpacity=".075" strokeWidth=".8"/>

        <g className="scene-engraving" fill="none" stroke={`url(#frame-${uid})`} strokeWidth=".65" opacity=".29">
          <circle cx="120" cy="197" r="91"/><circle cx="120" cy="197" r="85" stroke={colors.b} strokeDasharray="1 5"/>
          <ellipse cx="120" cy="197" rx="101" ry="37" transform="rotate(-35 120 197)" stroke={colors.a}/>
          {Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return <path key={i} d={`M${120+Math.cos(a)*87} ${197+Math.sin(a)*87}L${120+Math.cos(a)*93} ${197+Math.sin(a)*93}`}/>})}
          <path d="M120 102V119M120 275V292M25 197H43M197 197H215" stroke={colors.c}/>
        </g>
        <g style={{'--glass-url':`url(#glass-${uid})`,'--frame-url':`url(#frame-${uid})`,'--orb-url':`url(#orb-${uid})`} as CSSProperties}>{scene}</g>
      </g>
      <path d="M47 310H193" stroke={`url(#frame-${uid})`} strokeOpacity=".6" strokeWidth=".7"/>
      <path d="M55 316 61 322 67 316M173 316 179 322 185 316" fill="none" stroke={colors.c} strokeWidth=".8"/>
      {showLabels && <text x="120" y="337" textAnchor="middle" className="card-title" style={{ fontSize: card.name.length > 15 ? 10.5 : 12.5, fontWeight: 600 }}>{card.name.toUpperCase()}</text>}
      {showLabels && card.suit && <text x="120" y="352" textAnchor="middle" className="card-suit-label">{card.suit.toUpperCase()}</text>}
      <path d="M97 365H143" stroke={`url(#frame-${uid})`} strokeWidth=".7"/><circle cx="120" cy="365" r="2" fill={colors.c}/>
    </g>
  </svg>
}
