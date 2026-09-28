import type { CSSProperties } from 'react'
import type { DeckCard, Suit } from '../types/tarot'
import { nocturnePalettes, SuitSigil } from './cardGeometry'

type Ink = typeof nocturnePalettes.major

export function NocturneScene({ card }: { card: DeckCard }) {
  const colors = nocturnePalettes[card.suit ?? 'major']
  if (card.arcana === 'major') return <MajorNocturne card={card} colors={colors}/>
  if (['page', 'knight', 'queen', 'king'].includes(card.rank ?? '')) return <CourtNocturne card={card} colors={colors}/>
  return <PipsNocturne card={card} colors={colors}/>
}

function MajorNocturne({ card, colors: ink }: { card: DeckCard; colors: Ink }) {
  const silver = ink.c
  const violet = ink.a
  const hairline = { fill: 'none', stroke: silver, strokeWidth: 1.15, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const moon = <g {...hairline}><circle cx="120" cy="157" r="31"/><path d="M130 127a31 31 0 1 0 0 60 23 23 0 1 1 0-60Z" fill="#c5c2d0" stroke="none"/></g>

  switch (card.id) {
    case 'the-fool': return <g {...hairline}><path d="M38 278 83 251 110 264 146 235 205 278Z" fill="#101017"/><circle cx="121" cy="144" r="12"/><path d="m114 157-9 34 19 19 19-29-17-19ZM105 190l-27 22m49-3 27 27m-47-46 2 42-15 37m30-29 24 26M158 112l12 149m-12-149 12-17 7 21-7 19"/><path d="M158 112 138 128" stroke={violet}/><path d="M74 263q-9-17-21-7l4 18 18 2m-10-16-4 11" stroke={violet}/></g>
    case 'the-magician': return <g {...hairline}><path d="M80 266V163h80v103M91 177h58M103 266v-72h34v72M120 123V96m-14 13q14-16 28 0-14 15-28 0ZM69 267h102M62 277h116M88 142q32 20 64 0"/><path d="m120 186 9 16h-18zM120 220c-19-14-23-1 0 16 23-17 19-30 0-16Z" stroke={violet}/><circle cx="120" cy="192" r="76" stroke={violet} strokeDasharray="2 7"/></g>
    case 'the-high-priestess': return <g {...hairline}><path d="M68 269V147h27v122m50 0V147h27v122M80 147v-15h3v15m72 0v-15h3v15M95 149q25 18 50 0v112H95Z" fill="#0c0b11"/><path d="M120 127a24 24 0 1 0 0 48 18 18 0 1 1 0-48Z" fill={silver} stroke="none"/><path d="M95 191q25 20 50 0m-48 14q23 18 46 0m-46 14q23 18 46 0" stroke={violet}/></g>
    case 'the-empress': return <g {...hairline}><path d="M80 267q7-44 40-50 33 6 40 50m-69-75q-12-23 6-34l23 15 23-15q18 11 6 34l-29 21Z" fill="#111017"/><path d="m95 155-8-19 17 10 16-20 16 20 17-10-8 19Zm25 62v-32m0 20q-28-26-34-3 22 7 34 22m0-19q28-26 34-3-22 7-34 22" stroke={violet}/><circle cx="120" cy="131" r="38" stroke={violet} strokeDasharray="1 5"/></g>
    case 'the-emperor': return <g {...hairline}><path d="M72 268V175l17-22 15 15 16-24 16 24 15-15 17 22v93ZM85 268v-67q35-27 70 0v67M102 231h36v37M74 175h92m-76-24 6-15 7 15m33 0 7-15 6 15" fill="#111017"/><path d="M120 107v31m-12-18h24m-43 13-13-12m82 0-13 12" stroke={violet}/></g>
    case 'the-hierophant': return <g {...hairline}><path d="M65 270V169q0-41 55-54 55 13 55 54v101m-18 0v-94q0-27-37-37-37 10-37 37v94M102 165l18-17 18 17v31h-36Zm18 31v43m-14 0h28" fill="#101017"/><path d="M97 127v-17m23 12v-23m23 28v-17M98 231l22-15 22 15" stroke={violet}/></g>
    case 'the-lovers': return <g {...hairline}><path d="M74 268V187q0-21 23-21t23 21v81m23 0v-81q0-21 23-21t23 21v81M52 151q68-62 136 0m-112 8q44-32 88 0"/><path d="M120 111v-17m-11 10 11-14 11 14m-43 33 32 19 32-19M91 230q29 25 58 0" stroke={violet}/><path d="M120 142q-13-13-13 0 13 16 26 0 0-13-13 0Z" fill={silver} stroke="none"/></g>
    case 'the-chariot': return <g {...hairline}><path d="M78 166h84l18 99H60Zm16-21h52v21H94Zm12-18 14-19 14 19Zm14-21v-14m-7 7h14M70 235h100M83 266v13m74-13v13" fill="#111017"/><path d="M76 189H58m124 0h-18M120 168v79m-28-47 28-22 28 22" stroke={violet}/><circle cx="75" cy="256" r="12"/><circle cx="165" cy="256" r="12"/></g>
    case 'strength': return <g {...hairline}><circle cx="120" cy="155" r="17"/><path d="M101 152q-18-24-28-4l11 12-12 9 11 16 21-10m34-23q18-24 28-4l-11 12 12 9-11 16-21-10m-30-14 14 14 14-14m-28 43q14-13 28 0l16 28h-60Z" fill="#111017"/><path d="M88 135q32-28 64 0m-61 71q29 32 58 0m-46-33q17 9 34 0" stroke={violet}/><path d="M101 151q19 9 38 0"/></g>
    case 'the-hermit': return <g {...hairline}><path d="M45 277 80 225l21 19 19-67 22 67 19-21 35 54ZM120 180v-57m0 11 30 16m-30-16-13 12m18 34 27-19 16 19-16 19Z" fill="#101017"/><circle cx="151" cy="146" r="22" stroke={violet}/><path d="M151 134v24m-9-12h18" stroke={violet}/></g>
    case 'wheel-of-fortune': return <g {...hairline}><circle cx="120" cy="193" r="75"/><circle cx="120" cy="193" r="56" stroke={violet}/><circle cx="120" cy="193" r="15"/><path d="M120 118v60m0 30v60m-75-75h60m30 0h60M67 140l42 42m22 22 42 42m0-106-42 42m-22 22-42 42"/><path d="m120 143 12 38-12 12-12-12Zm0 100-12-38 12-12 12 12Z" fill="#111017" stroke={violet}/></g>
    case 'justice': return <g {...hairline}><circle cx="120" cy="130" r="17"/><path d="M120 147v102m-47-76h94m-68 0-22 48h44Zm68 0-22 48h44Zm-60 48q14 18 28 0m16 0q14 18 28 0M102 249h36m-47 15h58"/><path d="M120 105v16m-8-8h16m-53 90h44m24 0h44" stroke={violet}/></g>
    case 'the-hanged-man': return <g {...hairline}><path d="M69 130h102M83 130v138m74-138v138m-74-111h74"/><g transform="rotate(180 120 194)"><circle cx="120" cy="157" r="13"/><path d="M120 170v49m0-39-22 24m22-24 22 24m-22 15-18 36m18-36 18 36m-16-111 16 14-16 14-16-14Z" fill="#111017"/></g><circle cx="120" cy="194" r="56" stroke={violet} strokeDasharray="2 5"/></g>
    case 'death': return <g {...hairline}><path d="M124 145q26-18 48 4l-12 11-11-5 7 18-26 5-8-18ZM128 178l-10 28 14 20-13 12 7 22m-7-54-23 14 11 18-16 14m41-26 21 11-10 19 12 17" fill="#111017"/><circle cx="132" cy="132" r="14"/><path d="M120 115v-18m-9 9h18M45 273h150M58 260l15-14 15 14m61-4 13-17 13 17" stroke={violet}/><path d="M55 267h130"/></g>
    case 'temperance': return <g {...hairline}><path d="M82 168h34l-4 31q-13 11-26 0Zm42 39h34l-4 31q-13 11-26 0Zm-22 36q16 19 36-1m-30-42q20-12 37 4" fill="#111017"/><path d="M120 138v63m-19-58q19-20 38 0m-56 133h74m-48-40 11 15 11-15" stroke={violet}/><path d="M120 201q-21-13-21-23m21 23q21-13 21-23"/></g>
    case 'the-devil': return <g {...hairline}><path d="M120 111 169 139l-9 78-40 36-40-36-9-78Zm-26 32-18-21 27 3m45 18 18-21-27 3M94 202h52m-44 27 18-13 18 13" fill="#101017"/><circle cx="105" cy="174" r="5" fill={silver}/><circle cx="135" cy="174" r="5" fill={silver}/><path d="M111 190h18m-9-79v-19m-37 160v16m74-16v16" stroke={violet}/><path d="M120 207v27m-34-7-23 22m111-22 23 22"/></g>
    case 'the-tower': return <g {...hairline}><path d="M84 268V157h24v-23h24v23h24v111ZM73 156l47-45 47 45M98 182h12v18H98Zm32 0h12v18h-12Z" fill="#101017"/><path d="m164 105-36 57 22-2-40 58 14-43-22 1 41-60Z" fill={silver} stroke="none"/><path d="M51 215 69 229m120-14-18 14m-95 28-12 12m112-12 12 12" stroke={violet}/></g>
    case 'the-star': return <g {...hairline}><path d="M120 126 128 151 154 151 133 166 141 191 120 176 99 191 107 166 86 151 112 151Z"/><path d="M74 213q22 20 44 0m4 0q22 20 44 0m-82 19 34 30m48-30-34 30m-48 0h96" stroke={violet}/><circle cx="120" cy="157" r="59" stroke={violet} strokeDasharray="1 6"/>{[0,1,2,3,4,5,6].map((i)=><circle key={i} cx={68+i*17} cy={218+(i%2)*10} r="2.2" fill={silver}/>)}</g>
    case 'the-moon': return <g {...hairline}>{moon}<path d="M46 267V201q0-29 24-29t24 29v66m76 0V201q0-29 24-29t24 29v66M94 190q26 15 52 0m-26 12q-38 18 0 49 38-31 0-49Z"/><path d="M54 267q12-12 24 0m84 0q12-12 24 0" stroke={violet}/></g>
    case 'the-sun': return <g {...hairline}><circle cx="120" cy="151" r="37"/><circle cx="120" cy="151" r="20" stroke={violet}/>{Array.from({length:12},(_,i)=><path key={i} d="M120 99v-14" transform={`rotate(${i*30} 120 151)`}/>)}<path d="M57 266q63-26 126 0M80 268v-37m80 37v-37m-80 8 40-26 40 26"/><path d="M102 222q18-12 36 0l-5 23h-26Z" fill="#111017"/><circle cx="120" cy="211" r="9"/></g>
    case 'judgement': return <g {...hairline}><path d="M120 122v43m-19-25h38m-28 25h18m-9-43 16-18m-16 18-16-18"/><path d="M58 267q62-29 124 0m-113-12 8-50 14-18 14 18 8 50m18 0 8-50 14-18 14 18 8 50"/><path d="M55 183q65-31 130 0m-65-61v-18" stroke={violet}/><circle cx="120" cy="103" r="13"/></g>
    default: return <g {...hairline}><path d="M69 268q-9-79 51-124 60 45 51 124-51 24-102 0Zm14-3q37 14 74 0m-61-27q24 17 48 0m-24-94v112"/><circle cx="120" cy="180" r="63" stroke={violet}/><path d="M92 175q28-21 56 0m-56 17q28 21 56 0M120 116l7 14h-14Z" stroke={violet}/></g>
  }
}

function PipsNocturne({ card, colors }: { card: DeckCard; colors: Ink }) {
  const suit: Suit = card.suit ?? 'wands'
  const number = ({ ace: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 } as Record<string, number>)[card.rank ?? ''] ?? 1
  const positions = number === 1 ? [[120, 195]] : Array.from({ length: number }, (_, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const rows = Math.ceil(number / 2)
    return [column === 0 ? 86 : 154, 197 - ((rows - 1) * 29) / 2 + row * 29]
  })
  return <g>{positions.map(([x, y], index) => <g key={index} className="nocturne-pip" style={{ '--pip-delay': `${(index * .37).toFixed(2)}s` } as CSSProperties} opacity={index % 2 ? '.84' : '1'}>
    <SuitSigil suit={suit} x={x} y={y} size={.56} colors={colors}/>
  </g>)}</g>
}

function CourtNocturne({ card, colors }: { card: DeckCard; colors: Ink }) {
  const suit = card.suit ?? 'cups'
  const rank = card.rank ?? 'page'
  const crown = rank === 'king' || rank === 'queen'
  return <g fill="#100f15" stroke={colors.c} strokeWidth="1.05" strokeLinejoin="round">
    <path d="M67 267v-79q0-54 53-61 53 7 53 61v79Zm15-5v-73q0-38 38-48 38 10 38 48v73"/>
    {rank === 'knight' && <path d="m74 241 84-94 18 18-92 85Z" fill="none" stroke={colors.a}/>}
    <circle cx="120" cy="151" r="18"/>
    <path d={rank === 'queen' ? 'M101 137l-7-21 19 12 7-22 9 22 18-12-7 21Z' : rank === 'king' ? 'M101 139l-6-18 17 11 8-23 8 23 17-11-6 18Z' : 'M106 137v-20l14 12 14-12v20Z'} fill="#14121a" stroke={colors.a}/>
    <path d="M100 181q20 17 40 0m-43 55q23-18 46 0m-39 13q16 12 32 0" fill="none" stroke={colors.a}/>
    <g transform="translate(120 211)"><SuitSigil suit={suit} x={0} y={0} size={rank === 'page' ? .55 : .68} colors={colors}/></g>
    {crown && <path d="M89 267h62m-53 8h44" fill="none" stroke={colors.a}/>}
  </g>
}
