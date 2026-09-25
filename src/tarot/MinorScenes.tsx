import type { CSSProperties } from 'react'
import type { DeckCard } from '../types/tarot'
import { Crystal, Halo, Star, SuitSigil, palettes } from './cardGeometry'

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

export function PipScene({ card, colors }: { card: DeckCard; colors: typeof palettes.major }) {
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

export function CourtScene({ card, colors }: { card: DeckCard; colors: typeof palettes.major }) {
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

