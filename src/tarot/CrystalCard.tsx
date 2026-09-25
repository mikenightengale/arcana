import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DeckCard, Suit } from '../types/tarot'

const palettes: Record<Suit | 'major', { a: string; b: string; c: string }> = {
  major: { a: 'var(--cg-lavender)', b: 'var(--cg-cyan)', c: 'var(--cg-silver-lilac-bright)' },
  wands: { a: 'var(--cg-amber)', b: 'var(--cg-flame)', c: 'var(--cg-silver-lilac-bright)' },
  cups: { a: 'var(--cg-cyan)', b: 'var(--cg-blue)', c: 'var(--cg-lavender)' },
  swords: { a: 'var(--cg-silver)', b: 'var(--cg-ice)', c: 'var(--cg-lavender)' },
  pentacles: { a: 'var(--cg-emerald)', b: 'var(--cg-teal)', c: 'var(--cg-silver-lilac)' },
}

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

function Crystal({ x, y, size = 30, rotation = 0, colors, glow = false }: { x: number; y: number; size?: number; rotation?: number; colors: typeof palettes.major; glow?: boolean }) {
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

function Star({ x, y, r = 8, points = 4, color = '#c6f2ff', opacity = .9 }: { x: number; y: number; r?: number; points?: number; color?: string; opacity?: number }) {
  const inner = r * .28
  const vertices = Array.from({ length: points * 2 }, (_, i) => {
    const a = (Math.PI * i / points) - Math.PI / 2
    const radius = i % 2 ? inner : r
    return `${Math.cos(a) * radius},${Math.sin(a) * radius}`
  }).join(' ')
  return <polygon points={vertices} transform={`translate(${x} ${y})`} fill={color} opacity={opacity}/>
}

function SuitSigil({ suit, x, y, size = 1, colors }: { suit: Suit; x: number; y: number; size?: number; colors: typeof palettes.major }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} className={`sigil sigil-${suit}`} stroke="var(--frame-url)" strokeWidth="1.1" fill="none" strokeLinejoin="round">
    {suit === 'wands' && <><path d="M0-37 7-18 4 29 0 38-4 29-7-18Z" fill="var(--glass-url)"/><path d="M0-29 0 30M-5-3 5-9M-4 8 4 2" stroke={colors.c}/><path d="M-13-15 0-26 13-15M-10 15 0 8 10 15" stroke={colors.a} opacity=".7"/></>}
    {suit === 'cups' && <><path d="M-27-19H27L20 7Q16 20 0 21-16 20-20 7Z" fill="var(--glass-url)"/><path d="M-20-7Q0 2 20-7M-12 2Q0 9 12 2M-15 21V30M15 21V30M-19 31H19" stroke={colors.c}/><path d="M-28-24Q0-34 28-24" stroke={colors.b}/></>}
    {suit === 'swords' && <><path d="M0-39 7-5 4 18 0 24-4 18-7-5Z" fill="var(--glass-url)"/><path d="M-23 18H23M0 18V35M-14 8 14 8M0-30V17"/><path d="M-6-7 0-18 6-7" stroke={colors.c}/></>}
    {suit === 'pentacles' && <><circle r="29"/><circle r="23" stroke={colors.a} opacity=".9"/><path d="M0-19 4-6 18-6 7 2 11 16 0 8-11 16-7 2-18-6-4-6Z" fill={colors.a} fillOpacity=".18"/><circle r="5" fill={colors.c}/><path d="M0-29V-23M29 0H23M0 29V23M-29 0H-23" stroke={colors.c}/></>}
  </g>
}

function Halo({ cx = 120, cy = 201, r = 68, colors, orbit = false }: { cx?: number; cy?: number; r?: number; colors: typeof palettes.major; orbit?: boolean }) {
  return <g className={orbit ? 'orbiting-halo' : undefined}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--frame-url)" strokeWidth=".9" opacity=".73"/>
    <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={colors.b} strokeWidth=".75" strokeDasharray="1 5" opacity=".8"/>
    <ellipse cx={cx} cy={cy} rx={r + 12} ry={r * .34} transform={`rotate(-32 ${cx} ${cy})`} fill="none" stroke={colors.a} strokeWidth=".8" opacity=".62"/>
    {Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <path key={i} d={`M${cx + Math.cos(a) * (r - 4)} ${cy + Math.sin(a) * (r - 4)}L${cx + Math.cos(a) * (r + 3)} ${cy + Math.sin(a) * (r + 3)}`} stroke="#9cecff" strokeWidth=".8" opacity=".8"/> })}
  </g>
}

function CrystalOrb({ x, y, r, colors }: { x: number; y: number; r: number; colors: typeof palettes.major }) {
  return <g>
    <circle cx={x} cy={y} r={r + 4} fill="none" stroke="var(--frame-url)" strokeWidth=".9"/>
    <circle cx={x} cy={y} r={r} fill="var(--orb-url)" stroke={colors.c} strokeOpacity=".75"/>
    <path d={`M${x} ${y-r} ${x+r*.72} ${y-r*.28} ${x+r*.56} ${y+r*.66} ${x} ${y+r} ${x-r*.68} ${y+r*.5} ${x-r*.78} ${y-r*.25}Z`} fill="var(--glass-url)" stroke={colors.a} strokeOpacity=".65"/>
    <path d={`M${x} ${y-r}V${y+r}M${x-r*.78} ${y-r*.25}L${x+r*.72} ${y-r*.28}M${x-r*.68} ${y+r*.5}L${x+r*.56} ${y+r*.66}`} stroke="#d8f7ff" strokeOpacity=".6" strokeWidth=".7"/>
  </g>
}

function MajorScene({ card, colors }: { card: DeckCard; colors: typeof palettes.major }) {
  const id = card.id
  const triangle = <path d="M120 105 184 232 56 232Z" fill="none" stroke="var(--frame-url)" strokeWidth="1" opacity=".68"/>
  if (id === 'the-magician') return <>
    <Halo cy={195} r={61} colors={colors} orbit/>{triangle}<path d="M73 266Q120 242 167 266M82 276Q120 258 158 276" fill="none" stroke={colors.b} strokeWidth="1"/>
    <path d="M81 146C53 120 68 95 120 128 172 95 187 120 159 146 187 171 172 197 120 163 68 197 53 171 81 146Z" fill="none" stroke={colors.c} strokeWidth="1.2" className="orbiting-halo"/>
    <CrystalOrb x={120} y={193} r={20} colors={colors}/>{(['wands','cups','swords','pentacles'] as Suit[]).map((s, i) => <g key={s} className="suit-orbit" style={{ '--orbit-delay': `${i * -1.5}s` } as CSSProperties}><SuitSigil suit={s} x={120} y={123} size={.38} colors={palettes[s]}/></g>)}
    <Star x={71} y={219} r={6} color={colors.c}/><Star x={169} y={219} r={6} color={colors.c}/>
  </>
  if (id === 'the-hermit') return <>
    <path d="M44 269 79 217 94 237 120 179 147 237 163 214 197 269Z" fill="#18234a" stroke={colors.b} strokeOpacity=".55"/>
    <path d="M57 269 92 232 103 247 121 211 145 247 161 231 187 269" fill="none" stroke={colors.c} strokeOpacity=".45"/>
    <Halo cy={175} r={45} colors={colors}/><path d="M118 96V154M118 112 151 130" stroke="var(--frame-url)" strokeWidth="2"/>
    <path d="M149 122 159 130 150 139 141 130Z" fill="#c6f2ff" className="lantern-glow"/><circle cx="150" cy="130" r="20" fill={colors.c} opacity=".12" className="lantern-glow"/>
    <Crystal x={120} y={197} size={27} colors={colors}/><path d="M92 282H148M100 289H140" stroke="var(--frame-url)"/>
  </>
  if (id === 'the-tower') return <>
    <path d="M85 263V155L94 155 94 134 108 134 108 113 132 113 132 134 146 134 146 155 155 155V263Z" fill="#171b3f" stroke="var(--frame-url)" strokeWidth="1.4"/>
    <path d="M95 263V176L106 162 120 178 134 158 145 175V263" fill="none" stroke={colors.b} strokeWidth="1.2"/>
    <path d="M170 105 141 145 157 150 117 199 128 161 108 158 144 111Z" fill={colors.c} opacity=".82" className="tower-flash"/>
    <path d="M54 218 81 205M160 212 186 228M69 258 89 247M151 244 174 255" stroke={colors.a} strokeWidth="1" className="tower-shards"/>
    {[0,1,2,3,4].map(i=><path key={i} d={`M${73+i*20} ${278+(i%2)*8}l7-13 5 15z`} fill="var(--glass-url)" stroke={colors.c} strokeOpacity=".55"/>)}
  </>
  if (id === 'the-star') return <>
    <Halo cy={183} r={72} colors={colors} orbit/><path d="M52 267Q78 248 100 266T148 266T188 265" fill="none" stroke={colors.b} strokeWidth="1.2"/>
    <path d="M66 279Q91 262 113 279T160 278T185 278M61 290Q91 274 120 290T178 290" fill="none" stroke={colors.c} strokeOpacity=".64"/>
    <Star x={120} y={180} r={34} points={8} color="#e1d2ff"/><Star x={120} y={180} r={19} points={8} color={colors.c}/><circle cx="120" cy="180" r="5" fill="#eef1ff" className="star-core"/>
    {Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7-Math.PI/2;return <g key={i}><path d={`M120 180L${120+Math.cos(a)*56} ${183+Math.sin(a)*61}`} stroke={colors.a} strokeOpacity=".22"/><Star x={120+Math.cos(a)*59} y={183+Math.sin(a)*64} r={i%2?6:8} color={i%2?colors.c:'#c6f2ff'} opacity={.9}/></g>})}
    <path d="M68 230Q88 245 106 228M172 230Q152 245 134 228" fill="none" stroke={colors.b} strokeWidth="2" opacity=".7"/>
  </>
  if (id === 'the-fool') return <><path d="M45 269 94 247 120 254 151 238 196 269Z" fill="#17204a" stroke={colors.b}/><path d="M46 267Q82 233 105 212T165 157" fill="none" stroke={colors.c} strokeDasharray="2 5"/><Crystal x={166} y={150} size={32} colors={colors} glow/>{Array.from({length:7},(_,i)=><Star key={i} x={93+i*11} y={221-i*10} r={i%2?3:5} color={colors.c}/>)}<Halo cx={166} cy={150} r={38} colors={colors}/></>
  if (id === 'the-high-priestess') return <><path d="M67 267V142H88V267M152 267V142H173V267" fill="#101733" stroke="var(--frame-url)"/><path d="M72 150H83M157 150H168M72 258H83M157 258H168" stroke={colors.c}/><path d="M70 132V112H85V132M155 132V112H170V132" fill="none" stroke={colors.a}/><path d="M120 116A31 31 0 1 0 120 178A22 22 0 1 1 120 116Z" fill={colors.c} opacity=".8"/><path d="M88 185Q120 209 152 185M91 197Q120 220 149 197M96 209Q120 229 144 209" fill="none" stroke={colors.b}/><Halo cy={177} r={54} colors={colors}/></>
  if (id === 'the-empress') return <><Halo cy={185} r={48} colors={colors}/><circle cx="120" cy="185" r="17" fill="none" stroke={colors.c}/><path d="M120 202V262M120 235C88 233 78 208 83 196 104 197 119 213 120 235ZM120 226C151 222 163 201 156 188 137 191 121 205 120 226Z" fill="#193b42" stroke={colors.b}/>{Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 120 185)`}><path d="M120 179Q104 158 120 143Q136 158 120 179Z" fill="var(--glass-url)" stroke={colors.a}/></g>)}<Star x={120} y={185} r={7} color={colors.c}/></>
  if (id === 'the-emperor') return <><path d="M68 250 68 157 120 127 172 157 172 250Z" fill="#182044" stroke="var(--frame-url)" strokeWidth="1.4"/><path d="M82 239V168L120 147 158 168V239ZM95 222V182L120 168 145 182V222Z" fill="none" stroke={colors.b}/><path d="M120 105 134 132 120 145 106 132Z" fill="var(--glass-url)" stroke={colors.c}/><path d="M75 261H165M84 270H156" stroke="var(--frame-url)"/><Halo cy={190} r={72} colors={colors}/></>
  if (id === 'the-hierophant') return <><path d="M64 266V180Q64 120 120 112Q176 120 176 180V266M83 266V185Q83 139 120 133Q157 139 157 185V266" fill="none" stroke="var(--frame-url)" strokeWidth="1.3"/><path d="M89 190 120 159 151 190 120 221Z" fill="var(--glass-url)" stroke={colors.b}/><path d="M120 221V260M107 243H133" stroke={colors.c}/><CircleGeometry colors={colors}/></>
  if (id === 'the-lovers') return <><Halo cy={188} r={61} colors={colors}/><Crystal x={82} y={193} size={37} rotation={-18} colors={colors}/><Crystal x={158} y={193} size={37} rotation={18} colors={colors}/><Star x={120} y={177} r={18} points={8} color={colors.c}/><path d="M82 228Q120 254 158 228M90 240Q120 260 150 240" fill="none" stroke={colors.a}/><path d="M82 145 120 127 158 145" fill="none" stroke="var(--frame-url)"/></>
  if (id === 'the-chariot') return <><path d="M71 220 91 164H149L169 220 153 244H87Z" fill="#182143" stroke="var(--frame-url)"/><path d="M80 224H160M94 164V145H146V164" fill="none" stroke={colors.c}/><Crystal x={120} y={197} size={34} colors={colors} glow/><path d="M54 242 89 228M186 242 151 228" stroke={colors.a} strokeWidth="2"/><path d="M61 231 53 242 67 239M179 231 187 242 173 239" fill={colors.a}/><circle cx="78" cy="257" r="11" fill="none" stroke="var(--frame-url)"/><circle cx="162" cy="257" r="11" fill="none" stroke="var(--frame-url)"/></>
  if (id === 'strength') return <><path d="M78 162C75 131 99 125 120 147 141 125 165 131 162 162 158 195 82 195 78 162Z" fill="var(--glass-url)" stroke={colors.c}/><path d="M81 165Q120 149 159 165M120 151V184" fill="none" stroke="var(--frame-url)"/><path d="M79 205C54 177 58 147 120 147 182 147 186 177 161 205 186 231 171 258 120 225 69 258 54 231 79 205Z" fill="none" stroke={colors.a} className="orbiting-halo"/><Star x={120} y={184} r={13} color={colors.c}/></>
  if (id === 'wheel-of-fortune') return <><Halo cy={192} r={84} colors={colors} orbit/><g className="wheel-inner"><circle cx="120" cy="192" r="57" fill="#111a38" stroke="var(--frame-url)" strokeWidth="1.4"/><circle cx="120" cy="192" r="43" fill="none" stroke={colors.b}/>{Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 120 192)`}><path d="M120 149 128 185 120 192 112 185Z" fill="var(--glass-url)" stroke={colors.c}/></g>)}<Crystal x={120} y={192} size={23} colors={colors}/></g>{[0,1,2,3].map(i=><Star key={i} x={[120,202,120,38][i]} y={[99,192,285,192][i]} r={7} color={colors.c}/>)}</>
  if (id === 'justice') return <><path d="M120 118V260M86 143H154M94 143 74 185H114ZM146 143 126 185H166Z" fill="none" stroke="var(--frame-url)" strokeWidth="1.3"/><path d="M74 185Q94 207 114 185M126 185Q146 207 166 185M104 260H136M93 270H147" fill="none" stroke={colors.b}/><Crystal x={120} y={161} size={21} colors={colors}/><path d="M120 104 129 119 120 133 111 119Z" fill={colors.c}/><Halo cy={186} r={69} colors={colors}/></>
  if (id === 'the-hanged-man') return <><path d="M73 127H167M83 127V259M157 127V259M83 146H157" fill="none" stroke="var(--frame-url)"/><g transform="rotate(180 120 193)"><Crystal x={120} y={190} size={47} colors={colors} glow/><path d="M120 150V228M98 167 142 213M142 167 98 213" fill="none" stroke={colors.b}/></g><Halo cy={191} r={64} colors={colors} orbit/><path d="M96 259H144" stroke={colors.c}/></>
  if (id === 'death') return <><path d="M119 138 138 154 131 180 144 196 130 219 134 244 120 258" fill="none" stroke={colors.c} strokeWidth="2"/><path d="M121 137 102 153 109 179 96 195 110 218 106 242 120 258" fill="none" stroke={colors.a} strokeWidth="1.4"/><Crystal x={91} y={190} size={27} rotation={-20} colors={colors}/><Crystal x={151} y={191} size={36} rotation={17} colors={colors} glow/><path d="M61 259Q94 238 119 260T179 259" fill="none" stroke={colors.b}/>{[0,1,2].map(i=><circle key={i} cx={106+i*8} cy={201+i*11} r="1.7" fill={colors.c} className="death-fragment" style={{'--fragment-delay':`${i*.7}s`} as CSSProperties}/>)}</>
  if (id === 'temperance') return <><path d="M85 156H111L108 185Q98 194 88 185ZM129 208H155L152 237Q142 246 132 237Z" fill="var(--glass-url)" stroke="var(--frame-url)"/><path d="M102 186C135 189 105 205 139 209" fill="none" stroke={colors.c} strokeWidth="2" strokeDasharray="3 3" className="energy-flow"/><Halo cy={190} r={63} colors={colors}/><Crystal x={120} y={195} size={27} colors={colors}/><path d="M89 151 107 151M133 203 151 203" stroke={colors.c}/></>
  if (id === 'the-devil') return <><path d="M120 119 171 156 160 232 120 263 80 232 69 156Z" fill="#251337" stroke="#dc7187" strokeWidth="1.2"/><path d="M99 142 120 128 141 142M88 219 120 242 152 219" fill="none" stroke="#e6a2c2"/><Crystal x={120} y={187} size={39} colors={{a:'#e47289',b:'#6a3c9e',c:'#e3b8eb'}} glow/><path d="M73 170Q120 202 167 170M76 196Q120 225 164 196" fill="none" stroke="#d86286" strokeWidth="1.2" className="devil-pulse"/><circle cx="120" cy="109" r="8" fill="none" stroke="#d86286"/></>
  if (id === 'the-moon') return <><circle cx="120" cy="152" r="35" fill={colors.c} opacity=".15"/><path d="M126 119A35 35 0 1 0 126 185A25 25 0 1 1 126 119Z" fill="#c7c0ff"/><path d="M57 259V191Q57 164 80 164T103 191V259ZM137 259V191Q137 164 160 164T183 191V259Z" fill="#121932" stroke="var(--frame-url)"/><path d="M47 259H113M127 259H193M120 203Q85 220 120 249Q155 220 120 203Z" fill="none" stroke={colors.b}/><path d="M44 217Q82 207 109 218M131 219Q158 207 196 216" fill="none" stroke={colors.c} opacity=".5" className="lunar-mist"/></>
  if (id === 'the-sun') return <><g className="sun-rays">{Array.from({length:16},(_,i)=><path key={i} d="M120 176V112" transform={`rotate(${i*22.5} 120 176)`} stroke={i%2?colors.a:colors.c} strokeWidth={i%2?1:2} opacity=".76"/>)}</g><circle cx="120" cy="177" r="42" fill="var(--orb-url)" stroke="var(--frame-url)"/><Star x={120} y={177} r={25} points={8} color="#c6f2ff"/><circle cx="120" cy="177" r="7" fill="#eef1ff"/><path d="M55 255Q120 229 185 255M65 265H175" fill="none" stroke={colors.b}/></>
  if (id === 'judgement') return <><path d="M120 116V167M102 132H138M108 153H132" fill="none" stroke="var(--frame-url)" strokeWidth="2"/><Star x={120} y={115} r={15} points={8} color={colors.c}/>{[-1,0,1].map((v)=><g key={v} transform={`translate(${v*39} 0)`}><path d={`M${120+v*0} 254 111 218 116 187 120 174 124 187 129 218Z`} fill="var(--glass-url)" stroke={colors.b}/><path d={`M${120} 231V189`} stroke={colors.c}/></g>)}<path d="M78 264Q120 238 162 264" fill="none" stroke={colors.a}/></>
  return <><Halo cy={191} r={77} colors={colors} orbit/><circle cx="120" cy="191" r="59" fill="none" stroke={colors.b}/><circle cx="120" cy="191" r="43" fill="none" stroke={colors.c} strokeDasharray="2 4"/><Crystal x={120} y={191} size={35} colors={colors} glow/><path d="M120 105V125M120 257V277M34 191H54M186 191H206M59 130 73 144M167 238 181 252M181 130 167 144M73 238 59 252" stroke="var(--frame-url)" strokeWidth="1.4"/>{[0,1,2,3].map(i=><SuitSigil key={i} suit={(['wands','cups','swords','pentacles'] as Suit[])[i]} x={[120,194,120,46][i]} y={[116,191,266,191][i]} size={.26} colors={palettes[(['wands','cups','swords','pentacles'] as Suit[])[i]]}/>)}</>
}

function CircleGeometry({ colors }: { colors: typeof palettes.major }) { return <><circle cx="120" cy="192" r="51" fill="none" stroke={colors.b}/><path d="M120 141 164 217H76Z" fill="none" stroke="var(--frame-url)"/><circle cx="120" cy="192" r="10" fill={colors.c} fillOpacity=".25" stroke={colors.c}/></> }

function pipPositions(count: number, layout: string) {
  if (count === 1) return [[120, 196, 1.18]]
  if (layout === 'crossed' && count === 3) return [[120, 158, .95, -5], [94, 207, .95, -42], [146, 207, .95, 42]]
  if (layout === 'tree') return [[120,143, .62],[88,177,.62],[152,177,.62],[72,213,.62],[104,213,.62],[136,213,.62],[168,213,.62],[88,249,.62],[152,249,.62],[120,279,.62]]
  if (layout === 'diagonal' && count === 8) return Array.from({length:count},(_,i)=>[65+i*16, 266-i*21, .48, -36])
  if (layout === 'ascending' || layout === 'descending') return Array.from({length:count},(_,i)=>[73+(i%4)*31, layout==='ascending' ? 258-Math.floor(i/4)*54-(i%4)*8 : 145+Math.floor(i/4)*54+(i%4)*8, .52])
  if (layout === 'mirrored') return Array.from({length:count},(_,i)=>{const row=Math.floor(i/2); return [i%2?156:84, 153+row*33, .52]})
  if (layout === 'constellation') {
    const points = [[120,145],[79,170],[159,176],[102,194],[143,202],[68,222],[119,231],[174,229],[91,260],[151,263]]
    return Array.from({length:count},(_,i)=>[...points[i],.48])
  }
  if (layout === 'path') return Array.from({length:count},(_,i)=>[67+i*(106/Math.max(1,count-1)), 229-Math.sin(i/Math.max(1,count-1)*Math.PI*2)*42, .5])
  if (layout === 'fractured') return Array.from({length:count},(_,i)=>{const a=(Math.PI*2*i/count)-Math.PI/2;return [120+Math.cos(a)*(i%2?69:47),196+Math.sin(a)*(i%2?69:47),.48]})
  if (layout === 'crescent' || layout === 'arc') return Array.from({length:count},(_,i)=>{const a=Math.PI*(.12+i/(Math.max(1,count-1))*.76); return [120+Math.cos(a)*69, 215-Math.sin(a)*70, .46]})
  if (layout === 'spiral') return Array.from({length:count},(_,i)=>{const a=i*2.15, r=8+i*9; return [120+Math.cos(a)*r,197+Math.sin(a)*r,.49]})
  if (count === 7) return [[120,151,.55],[83,181,.55],[157,181,.55],[70,218,.55],[120,218,.55],[170,218,.55],[120,267,.55]]
  const radius = count <= 4 ? 42 : count <= 6 ? 59 : 69
  return Array.from({length:count},(_,i)=>{const a=(Math.PI*2*i/count)-Math.PI/2;return [120+Math.cos(a)*radius,196+Math.sin(a)*radius,.49]})
}

function PipScene({ card, colors }: { card: DeckCard; colors: typeof palettes.major }) {
  const suit = card.suit ?? 'wands'
  const count = card.visual?.symbolCount ?? (card.rank === 'ace' ? 1 : Number(card.rank))
  const layout = card.visual?.layout ?? 'orbit'
  const positions = pipPositions(count, layout)
  return <>
    {layout === 'tree' && <path d="M120 126V287M120 152 88 177M120 152 152 177M120 187 72 213M120 187 104 213M120 187 136 213M120 187 168 213M120 230 88 249M120 230 152 249" fill="none" stroke={colors.a} strokeOpacity=".28"/>}
    {layout === 'gateway' && <><path d="M65 270V188Q65 128 120 128T175 188V270M81 270V190Q81 145 120 145T159 190V270" fill="none" stroke="var(--frame-url)"/></>}
    {layout === 'fractured' && <><path d="M63 185 177 205M71 226 169 165" stroke={colors.a} strokeOpacity=".28"/><Crystal x={120} y={197} size={23} colors={colors}/></>}
    {layout === 'diagonal' && Array.from({length:3},(_,i)=><path key={i} d={`M${57+i*7} ${263-i*5}L${181+i*5} ${117-i*3}`} stroke={colors.c} strokeOpacity={.16} strokeWidth="5"/>)}
    <Halo cy={197} r={80} colors={colors}/>
    {positions.map(([x,y,scale,rotation],i)=><g key={i} transform={`rotate(${rotation ?? 0} ${x} ${y})`}><g className="pip-symbol" style={{'--pip-delay':`${(i*0.37 + (card.rank?.length ?? 0)*.23).toFixed(2)}s`} as CSSProperties}><SuitSigil suit={suit} x={x} y={y} size={scale} colors={colors}/>{count===1 && <><circle cx={x} cy={y} r="42" fill="none" stroke={colors.c} strokeOpacity=".3"/><Star x={x} y={y-50} r={7} color={colors.c}/></>}</g></g>)}
    {card.id === 'three-of-swords' && <><Crystal x={120} y={195} size={26} colors={colors}/><path d="M120 132V245M78 175 162 215M162 175 78 215" stroke={colors.c} strokeWidth="1.5"/><path d="M108 184 120 198 131 185" fill="none" stroke="#d2c5ff"/></>}
    {card.id === 'seven-of-cups' && <path d="M53 250Q85 232 120 250T187 250M60 263Q89 247 120 263T180 263" fill="none" stroke={colors.c} strokeOpacity=".52"/>}
  </>
}

function CourtScene({ card, colors }: { card: DeckCard; colors: typeof palettes.major }) {
  const suit = card.suit ?? 'cups'
  const rank = card.rank ?? 'page'
  const scale = rank === 'king' ? 1.45 : rank === 'queen' ? 1.28 : rank === 'knight' ? 1.16 : 1
  return <>
    <path d={rank === 'knight' ? 'M57 257 172 133M75 270 190 146' : 'M62 262V178Q62 132 120 118Q178 132 178 178V262'} fill="none" stroke="var(--frame-url)" strokeWidth={rank === 'king' ? 1.5 : 1}/>
    <Halo cy={192} r={rank === 'king' ? 78 : 66} colors={colors} orbit={rank === 'queen'}/>
    {rank === 'page' && <><path d="M95 255Q120 236 145 255M103 264H137" fill="none" stroke={colors.b}/><Star x={120} y={137} r={11} color={colors.c}/><circle cx="120" cy="137" r="19" fill="none" stroke={colors.a} strokeDasharray="2 3"/></>}
    {rank === 'knight' && <><path d="M74 240 120 178 166 240M89 248 120 207 151 248" fill="none" stroke={colors.b}/><path d="M64 258 90 245M176 146 190 133" stroke={colors.c} strokeWidth="2"/></>}
    {rank === 'queen' && <><path d="M83 172Q120 138 157 172M80 213Q120 246 160 213M91 158Q120 177 149 158" fill="none" stroke={colors.c}/><path d="M120 120A21 21 0 1 0 120 162A15 15 0 1 1 120 120Z" fill={colors.c} opacity=".65"/></>}
    {rank === 'king' && <><path d="M84 153 98 126 120 145 142 126 156 153V172H84Z" fill="#171a38" stroke="var(--frame-url)"/><circle cx="98" cy="128" r="3" fill={colors.c}/><circle cx="120" cy="145" r="3" fill={colors.c}/><circle cx="142" cy="128" r="3" fill={colors.c}/><path d="M85 251H155M93 260H147" stroke={colors.a}/></>}
    <g transform={`translate(120 202) scale(${scale})`}><SuitSigil suit={suit} x={0} y={0} size={rank === 'king' ? 1.14 : .93} colors={colors}/></g>
    {rank !== 'page' && [0,1,2,3].map(i=><Star key={i} x={[76,164,76,164][i]} y={[164,164,234,234][i]} r={4+scale} color={colors.c}/>) }
  </>
}

export function CrystalCard({ card, reversed = false, animations = true, className = '', reveal = false, showLabels = true }: { card: DeckCard; reversed?: boolean; animations?: boolean; className?: string; reveal?: boolean; showLabels?: boolean }) {
  const theme = card.suit ?? 'major'
  const colors = palettes[theme]
  const uid = card.id.replace(/[^a-z0-9]/gi, '')
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
