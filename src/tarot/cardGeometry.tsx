import type { Suit } from '../types/tarot'

export const palettes: Record<Suit | 'major', { a: string; b: string; c: string }> = {
  major: { a: 'var(--cg-lavender)', b: 'var(--cg-cyan)', c: 'var(--cg-silver-lilac-bright)' },
  wands: { a: 'var(--cg-amber)', b: 'var(--cg-flame)', c: 'var(--cg-silver-lilac-bright)' },
  cups: { a: 'var(--cg-cyan)', b: 'var(--cg-blue)', c: 'var(--cg-lavender)' },
  swords: { a: 'var(--cg-silver)', b: 'var(--cg-ice)', c: 'var(--cg-lavender)' },
  pentacles: { a: 'var(--cg-emerald)', b: 'var(--cg-teal)', c: 'var(--cg-silver-lilac)' },
}

export const nocturnePalettes: Record<Suit | 'major', { a: string; b: string; c: string }> = {
  major: { a: '#897aa4', b: '#655c7b', c: '#e0dce9' },
  wands: { a: '#9480a1', b: '#6b617e', c: '#e2ddea' },
  cups: { a: '#8389ad', b: '#646a89', c: '#e0e2ef' },
  swords: { a: '#9b9daf', b: '#6f7389', c: '#eeedf2' },
  pentacles: { a: '#89929a', b: '#626b78', c: '#e0e3e6' },
}

export function Crystal({ x, y, size = 30, rotation = 0, colors, glow = false }: { x: number; y: number; size?: number; rotation?: number; colors: typeof palettes.major; glow?: boolean }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${size / 36})`}>
    <g className={glow ? 'crystal-glow' : undefined}>
      <path d="M0-36 21-17 17 20 0 34-17 20-21-17Z" fill="var(--glass-url)" stroke="var(--frame-url)" strokeWidth="1.15"/>
      <path d="M0-36 0 34-17 20-21-17Z" fill={colors.b} opacity=".48"/>
      <path d="M0-36 21-17 0-11Z" fill={colors.c} opacity=".54"/>
      <path d="M0-11 21-17 17 20 0 34Z" fill={colors.a} opacity=".5"/>
      <path d="M0-11-21-17 0 34Z" fill={colors.b} opacity=".36"/>
      <path d="M-21-17 0-11 21-17M0-11V34" fill="none" stroke="#e3f7ff" strokeOpacity=".64" strokeWidth=".8"/>
      <path d="M0-11 17 20M0-11-17 20" fill="none" stroke="#9cecff" strokeOpacity=".46" strokeWidth=".7"/>
    </g>
  </g>
}

export function Star({ x, y, r = 8, points = 4, color = '#c6f2ff', opacity = .9 }: { x: number; y: number; r?: number; points?: number; color?: string; opacity?: number }) {
  const inner = r * .28
  const vertices = Array.from({ length: points * 2 }, (_, i) => {
    const a = (Math.PI * i / points) - Math.PI / 2
    const radius = i % 2 ? inner : r
    return `${Math.cos(a) * radius},${Math.sin(a) * radius}`
  }).join(' ')
  return <polygon points={vertices} transform={`translate(${x} ${y})`} fill={color} opacity={opacity}/>
}

export function SuitSigil({ suit, x, y, size = 1, colors }: { suit: Suit; x: number; y: number; size?: number; colors: typeof palettes.major }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} className={`sigil sigil-${suit}`} stroke="var(--frame-url)" strokeWidth="1.1" fill="none" strokeLinejoin="round">
    {suit === 'wands' && <><path d="M0-37 7-18 4 29 0 38-4 29-7-18Z" fill="var(--glass-url)"/><path d="M0-29 0 30M-5-3 5-9M-4 8 4 2" stroke={colors.c}/><path d="M-13-15 0-26 13-15M-10 15 0 8 10 15" stroke={colors.a} opacity=".7"/></>}
    {suit === 'cups' && <><path d="M-27-19H27L20 7Q16 20 0 21-16 20-20 7Z" fill="var(--glass-url)"/><path d="M-20-7Q0 2 20-7M-12 2Q0 9 12 2M-15 21V30M15 21V30M-19 31H19" stroke={colors.c}/><path d="M-28-24Q0-34 28-24" stroke={colors.b}/></>}
    {suit === 'swords' && <><path d="M0-39 7-5 4 18 0 24-4 18-7-5Z" fill="var(--glass-url)"/><path d="M-23 18H23M0 18V35M-14 8 14 8M0-30V17"/><path d="M-6-7 0-18 6-7" stroke={colors.c}/></>}
    {suit === 'pentacles' && <><circle r="29"/><circle r="23" stroke={colors.a} opacity=".9"/><path d="M0-19 4-6 18-6 7 2 11 16 0 8-11 16-7 2-18-6-4-6Z" fill={colors.a} fillOpacity=".18"/><circle r="5" fill={colors.c}/><path d="M0-29V-23M29 0H23M0 29V23M-29 0H-23" stroke={colors.c}/></>}
  </g>
}

export function Halo({ cx = 120, cy = 201, r = 68, colors, orbit = false }: { cx?: number; cy?: number; r?: number; colors: typeof palettes.major; orbit?: boolean }) {
  return <g className={orbit ? 'orbiting-halo' : undefined}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--frame-url)" strokeWidth=".9" opacity=".73"/>
    <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={colors.b} strokeWidth=".75" strokeDasharray="1 5" opacity=".8"/>
    <ellipse cx={cx} cy={cy} rx={r + 12} ry={r * .34} transform={`rotate(-32 ${cx} ${cy})`} fill="none" stroke={colors.a} strokeWidth=".8" opacity=".62"/>
    {Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <path key={i} d={`M${cx + Math.cos(a) * (r - 4)} ${cy + Math.sin(a) * (r - 4)}L${cx + Math.cos(a) * (r + 3)} ${cy + Math.sin(a) * (r + 3)}`} stroke="#9cecff" strokeWidth=".8" opacity=".8"/> })}
  </g>
}

export function CrystalOrb({ x, y, r, colors }: { x: number; y: number; r: number; colors: typeof palettes.major }) {
  return <g>
    <circle cx={x} cy={y} r={r + 4} fill="none" stroke="var(--frame-url)" strokeWidth=".9"/>
    <circle cx={x} cy={y} r={r} fill="var(--orb-url)" stroke={colors.c} strokeOpacity=".75"/>
    <path d={`M${x} ${y-r} ${x+r*.72} ${y-r*.28} ${x+r*.56} ${y+r*.66} ${x} ${y+r} ${x-r*.68} ${y+r*.5} ${x-r*.78} ${y-r*.25}Z`} fill="var(--glass-url)" stroke={colors.a} strokeOpacity=".65"/>
    <path d={`M${x} ${y-r}V${y+r}M${x-r*.78} ${y-r*.25}L${x+r*.72} ${y-r*.28}M${x-r*.68} ${y+r*.5}L${x+r*.56} ${y+r*.66}`} stroke="#d8f7ff" strokeOpacity=".6" strokeWidth=".7"/>
  </g>
}
