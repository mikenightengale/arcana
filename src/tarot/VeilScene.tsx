import type { DeckCard, Suit } from '../types/tarot'

type Ink = { a: string; b: string; c: string }

export function VeilScene({ card, colors }: { card: DeckCard; colors: Ink }) {
  if (card.arcana === 'major') return <MajorVeil card={card} colors={colors} />
  if (['page', 'knight', 'queen', 'king'].includes(card.rank ?? '')) return <CourtVeil card={card} colors={colors} />
  return <PipVeil card={card} colors={colors} />
}

function MajorVeil({ card, colors }: { card: DeckCard; colors: Ink }) {
  const line = { fill: 'none', stroke: colors.c, strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (card.id) {
    case 'the-fool': return <g {...line}><path d="M34 270Q77 243 111 259T205 263M46 278Q91 261 124 271T196 275" stroke={colors.a}/><circle cx="132" cy="148" r="11"/><path d="M124 160Q111 183 128 205L151 218 163 202 146 184 146 161ZM130 203 104 233 92 269M142 211 171 239 181 272M117 179 95 191M142 178 162 164"/><path d="M91 191q-17-13-22 4l12 9 13-4m71-29 8-22m-9 21 18-12" stroke={colors.a}/><path d="M114 136q18-18 36 0" stroke={colors.a}/></g>
    case 'the-magician': return <g {...line}><path d="M83 266V178q0-43 37-54 37 11 37 54v88M97 266V190q0-29 23-35 23 6 23 35v76"/><path d="M75 266q45-17 90 0M87 275q33-11 66 0M120 126V91m-13 13q13-15 26 0-13 14-26 0Z" stroke={colors.a}/><path d="M85 159q-19-12-24 6l15 8m79-14q19-12 24 6l-15 8"/><path d="M120 170q-14-10-14 2 14 16 28 0 0-12-14-2Z" fill={colors.a} opacity=".5"/></g>
    case 'the-high-priestess': return <g {...line}><path d="M68 270V152q0-15 18-15t18 15v118m50 0V152q0-15 18-15t18 15v118"/><path d="M101 144q19 19 38 0v111q-19 16-38 0Z" fill={colors.b} stroke={colors.a}/><path d="M120 124q-16-17 0-31 16 14 0 31Zm-17 95q17-13 34 0m-30 12q13-10 26 0m-29 12q16-11 32 0" stroke={colors.a}/><path d="M82 120q9-12 18 0m40 0q9-12 18 0"/></g>
    case 'the-empress': return <g {...line}><ellipse cx="120" cy="192" rx="25" ry="33" fill={colors.b} stroke={colors.a}/><ellipse cx="120" cy="192" rx="62" ry="20" transform="rotate(-28 120 192)" stroke={colors.a}/><ellipse cx="120" cy="192" rx="55" ry="17" transform="rotate(42 120 192)" opacity=".72"/><path d="M108 192q12-16 24 0-12 16-24 0Z" fill={colors.c} stroke={colors.a}/><circle cx="120" cy="145" r="2" fill={colors.c}/><circle cx="73" cy="219" r="2" fill={colors.c}/><circle cx="169" cy="161" r="2" fill={colors.c}/><path d="M82 252q38 19 76 0m-61 9q23 12 46 0" stroke={colors.a}/></g>
    case 'the-emperor': return <g {...line}><path d="M65 270V184q0-42 55-57 55 15 55 57v86M83 270V190q0-26 37-36 37 10 37 36v80"/><path d="M84 207q36-18 72 0v50q-36 21-72 0Z" fill={colors.b}/><path d="M101 154q19 17 38 0m-29 40v37m20-37v37m-41-12h62m-55 22q24 11 48 0" stroke={colors.a}/><path d="M90 135q4-15 13 0m34 0q9-15 13 0"/></g>
    case 'the-hierophant': return <g {...line}><path d="M56 268V185q0-38 31-51m66 0q31 13 31 51v83M76 268V194q0-27 20-39m48 0q20 12 20 39v74"/><path d="M96 184q24-23 48 0v45q-24 21-48 0Z" fill={colors.b}/><path d="M101 123q19-24 38 0m-46 66q27 18 54 0m-48 43q21-17 42 0m-56 26q35-11 70 0" stroke={colors.a}/><circle cx="111" cy="207" r="2.2" fill={colors.c}/><circle cx="129" cy="207" r="2.2" fill={colors.c}/></g>
    case 'the-lovers': return <g {...line}><path d="M82 268V190q0-26 22-26t22 26v78m10 0V190q0-26 22-26t22 26v78"/><circle cx="104" cy="146" r="10"/><circle cx="158" cy="146" r="10"/><path d="M93 159q11 8 22 0m33 0q11 8 22 0m-74 55q28-19 56 0 28-19 56 0m-92 29q40-15 80 0" stroke={colors.a}/><path d="M120 140q-16-15-16 1 16 21 32 0 0-16-16-1Z" fill={colors.a}/></g>
    case 'the-chariot': return <g {...line}><path d="M64 264q56-35 112 0m-91-5V167q35-28 70 0v92m-57-80q22-16 44 0v57q-22 19-44 0Z" fill={colors.b}/><path d="M94 154q26 20 52 0m-35-15 9-18 9 18m-55 49-20-9m102 9 20-9m-96 66-12 22m80-22 12 22"/><path d="M68 207q-18-21-20 3l18 14m106-17q18-21 20 3l-18 14" stroke={colors.a}/></g>
    case 'strength': return <g {...line}><circle cx="120" cy="145" r="10"/><path d="M104 158q16 14 32 0l10 48-10 28 13 32m-45-108-12 48 14 30-13 29m12-61q15-14 30 0m-40-17q-21-15-25 5l18 10m59-15q21-15 25 5l-18 10"/><path d="M78 180q12-22 26-6l-8 17m68-11q-12-22-26-6l8 17m-57 35q24 23 48 0" stroke={colors.a}/></g>
    case 'the-hermit': return <g {...line}><path d="M42 270q32-35 55-4 23-76 46 0 23-30 55 4M120 266V161m0-9q-23 2-25 25 18 15 25-5 7 20 25 5-2-23-25-25Zm0 0V125"/><path d="M138 137q18-18 36 0-18 18-36 0Z" fill={colors.a}/><path d="M154 137h18m-18-9v18m-80 84q25 16 50 0m-44 13q22 13 44 0"/></g>
    case 'wheel-of-fortune': return <g {...line}><ellipse cx="120" cy="192" rx="69" ry="28" transform="rotate(-32 120 192)"/><ellipse cx="120" cy="192" rx="60" ry="21" transform="rotate(34 120 192)" stroke={colors.a}/><circle cx="120" cy="192" r="25" fill={colors.b} stroke={colors.a}/><circle cx="120" cy="192" r="7" fill={colors.c} stroke="none"/><path d="M120 111v34m0 94v34M47 192h32m82 0h32" stroke={colors.a}/><circle cx="64" cy="147" r="2.4" fill={colors.c}/><circle cx="177" cy="235" r="2.4" fill={colors.c}/><circle cx="165" cy="134" r="2" fill={colors.c}/></g>
    case 'justice': return <g {...line}><circle cx="120" cy="127" r="11"/><path d="M120 138v115m-45-70h90m-66 0-16 37q16 13 32 0Zm58 0-16 37q16 13 32 0Zm-54 47q21 17 42 0m-52 10h62m-31-115 14-16m-14 16-14-16"/><path d="M84 183q9-12 18 0m36 0q9-12 18 0" stroke={colors.a}/></g>
    case 'the-hanged-man': return <g {...line}><path d="M48 130q38 14 144 0m-31-12q4 15-12 20m-51-8q29 7 22 39"/><g transform="rotate(180 120 204)"><circle cx="120" cy="158" r="10"/><path d="M120 168v53m-23-33 23 14 23-14m-23 12-17 40m17-40 17 40"/></g><path d="M70 143q17 28 34 0m32 0q17 28 34 0m-61 86q23-17 46 0" stroke={colors.a}/></g>
    case 'death': return <g {...line}><path d="M120 116q-28 15-26 55l14 35-13 22 17 14-7 26m15-152q28 15 26 55l-14 35 13 22-17 14 7 26"/><path d="M93 171q27-18 54 0m-49 12h40m-31 16q10 8 20 0m-42 44 18 6m31-6-18 6m-51 15q55-23 110 0" stroke={colors.a}/><circle cx="108" cy="173" r="2.4" fill={colors.c}/><circle cx="132" cy="173" r="2.4" fill={colors.c}/></g>
    case 'temperance': return <g {...line}><circle cx="120" cy="135" r="11"/><path d="M103 150q17 14 34 0l-5 63q-12 13-24 0Zm-8 30h-26m66 16h26m-64-28q27 22 54 0m-50 15q23 20 46 0m-40-48q20-19 40 0"/><path d="M78 177q23 25 46 0m-8 20q23 25 46 0m-62 52q20 12 40 0" stroke={colors.a}/></g>
    case 'the-devil': return <g {...line}><path d="M120 118q-38 20-35 68 2 47 35 74 33-27 35-74 3-48-35-68Z" fill={colors.b} stroke={colors.a}/><path d="M95 159q25-17 50 0m-50 23q25 15 50 0m-38 29q13-8 26 0m-13-93v-23m-31 161-15 16m92-16 15 16"/><path d="M102 159q4-8 8 0m20 0q4-8 8 0" fill={colors.c}/><path d="M79 142q-14-19-22 0 12 17 22 0Zm82 0q14-19 22 0-12 17-22 0Z" stroke={colors.a}/></g>
    case 'the-tower': return <g {...line}><path d="M83 270V147q37-34 74 0v123M94 270V163q26-24 52 0v107"/><path d="m162 102-20 48 16-4-38 62 12-44-18 1 37-56Z" fill={colors.c} stroke={colors.a}/><path d="M69 179q-18 12-7 29m111-29q18 12 7 29M78 235l-20 22m104-22 20 22M96 147q24 18 48 0" stroke={colors.a}/></g>
    case 'the-star': return <g {...line}><path d="m120 95 10 58 38-37-27 51 59 1-58 16 38 41-50-29-10 60-10-60-50 29 38-41-58-16 59-1-27-51 38 37Z" fill={colors.b} stroke={colors.a}/><circle cx="120" cy="177" r="10" fill={colors.c}/><path d="M120 188v68m-44-35 28-24m60 24-28-24M72 126l10 9m86 44 10 8m-101 30-12 8m94-99 11-9" stroke={colors.a}/><circle cx="77" cy="165" r="2" fill={colors.c}/><circle cx="165" cy="121" r="2.5" fill={colors.c}/><circle cx="175" cy="249" r="2" fill={colors.c}/><circle cx="62" cy="236" r="1.8" fill={colors.c}/></g>
    case 'the-moon': return <g {...line}><path d="M120 102q-25 28 0 57 25-29 0-57Zm-68 68q18-21 36 0 18 21 36 0m16 0q18-21 36 0 18 21 36 0"/><path d="M49 268V214q0-19 18-19t18 19v54m88 0V214q0-19 18-19t18 19v54m-86-75q29 17 58 0m-58 16q29 17 58 0m-29-24v65" stroke={colors.a}/><path d="M68 244q0-10 4-15m100 15q0-10 4-15"/></g>
    case 'the-sun': return <g {...line}><path d="M120 107q-39 26 0 58 39-32 0-58Zm-52 61q52-29 104 0m-112 12q60-28 120 0m-127 14q67-27 134 0"/><path d="M83 207q37 28 74 0m-68 14q31 24 62 0m-52 12q21 17 42 0" stroke={colors.a}/><circle cx="109" cy="147" r="2" fill={colors.c}/><circle cx="131" cy="147" r="2" fill={colors.c}/></g>
    case 'judgement': return <g {...line}><path d="M120 110v55m-24-31q24-28 48 0m-82 132q2-47 31-55 17 11 27 30 10-19 27-30 29 8 31 55m-92-21q36-21 72 0m-60 13q24-15 48 0"/><path d="M55 177q65-38 130 0m-108-8q43-24 86 0" stroke={colors.a}/><circle cx="120" cy="109" r="5" fill={colors.c}/></g>
    case 'the-world': return <g {...line}><path d="M120 98q-48 13-55 72-8 69 55 104 63-35 55-104-7-59-55-72Z"/><path d="M88 153q32-21 64 0m-62 63q30-23 60 0m-30-73v94m-22-57q22 16 44 0m-55 90q33-14 66 0" stroke={colors.a}/><path d="M80 134q-15-13-23 4m103-4q15-13 23 4m-103 99q-13 14-24 2m104-2q13 14 24 2"/></g>
    default: return <g {...line}><path d="M120 117q-32 21-32 67t32 81q32-35 32-81t-32-67Z"/><path d="M97 164q23-18 46 0m-46 21q23-18 46 0m-46 21q23-18 46 0m-46 21q23-18 46 0" stroke={colors.a}/><path d="M54 271q33-25 66 0t66 0"/></g>
  }
}

function CourtVeil({ card, colors }: { card: DeckCard; colors: Ink }) {
  const rank = card.rank ?? 'page'
  const suit = card.suit ?? 'cups'
  const height = rank === 'king' ? 1.22 : rank === 'queen' ? 1.12 : rank === 'knight' ? 1.03 : .9
  const offsetY = rank === 'page' ? 12 : 0
  const crown = rank === 'king' || rank === 'queen'
  return <g transform={`translate(0 ${offsetY}) scale(1 ${height}) translate(0 -12)`} fill="none" stroke={colors.c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M83 269V194q0-36 37-45 37 9 37 45v75q-37 19-74 0Z" fill={colors.b}/>
    <circle cx="120" cy="137" r="13" fill={colors.b}/>
    <path d={rank === 'knight' ? 'M106 128q11-18 30-11l-4 16h-25Zm-18 61 67-47m-4 7 13 11' : rank === 'queen' ? 'M103 131q17 13 34 0m-31-8q14-20 28 0m-45 92q37-19 74 0' : rank === 'king' ? 'M100 127q20-17 40 0m-36-10 7-12 9 9 9-9 7 12m-58 97q42-20 84 0' : 'M107 126q13-15 26 0m-22 79q9-8 18 0'} />
    <path d="M99 179q21 15 42 0m-37 65q16-10 32 0" stroke={colors.a}/>
    <g transform="translate(120 213)"><VeilSuitMark suit={suit} colors={colors} /></g>
    {crown && <path d="M93 157q27-13 54 0m-48 6q21 11 42 0" stroke={colors.a}/>}
    {rank === 'knight' && <path d="M77 238q-19 3-12 19l17-1m81-19q19 3 12 19l-17-1" stroke={colors.a}/>}
  </g>
}

function pipCount(card: DeckCard) {
  const counts: Record<string, number> = { ace: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
  return counts[card.rank ?? ''] ?? 1
}

function PipVeil({ card, colors }: { card: DeckCard; colors: Ink }) {
  const count = Math.min(10, pipCount(card))
  const positions = count === 1 ? [[120, 190]] : Array.from({ length: count }, (_, index) => {
    const rows = Math.ceil(count / 2)
    const row = Math.floor(index / 2)
    return [index % 2 ? 151 : 89, 190 - ((rows - 1) * 27) / 2 + row * 27]
  })
  const suit = card.suit ?? 'wands'
  return <g>{positions.map(([x, y], index) => <g key={index} transform={`rotate(${index % 2 ? 5 : -5} ${x} ${y})`}>
    <ellipse cx={x} cy={y} rx="13" ry="15" fill={colors.b} stroke={colors.a} strokeWidth="1" />
    <ellipse cx={x} cy={y} rx="17" ry="5" fill="none" stroke={colors.a} strokeWidth=".7" opacity=".64" transform={`rotate(-28 ${x} ${y})`} />
    <g transform={`translate(${x} ${y})`}><VeilSuitMark suit={suit} colors={colors} /></g>
  </g>)}</g>
}

function VeilSuitMark({ suit, colors }: { suit: Suit; colors: Ink }) {
  if (suit === 'wands') return <g fill="none" stroke={colors.c} strokeWidth="1.2" strokeLinecap="round"><path d="M0 22V-13m-4 28h8"/><circle cx="0" cy="-19" r="5" fill={colors.b} stroke={colors.c}/><ellipse cx="0" cy="-19" rx="10" ry="3.4" transform="rotate(-28 0 -19)" stroke={colors.a}/><circle cx="-13" cy="-4" r="1.4" fill={colors.c} stroke="none"/><circle cx="12" cy="8" r="1.2" fill={colors.a} stroke="none"/></g>
  if (suit === 'cups') return <g fill="none" stroke={colors.c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M-16-15q16 5 32 0l-4 17q-12 13-24 0Zm-5-8q21 8 42 0m-21 30v11m-10 3q10-5 20 0"/><path d="M-8-7q8 5 16 0" stroke={colors.a}/></g>
  if (suit === 'swords') return <g fill="none" stroke={colors.c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22Q-2 4 1-19l5-9q2 19-3 30m-10 1q9 5 17 0M0 3v21m-7-1h14"/><path d="M2-14q-4 7-1 15" stroke={colors.a}/></g>
  return <g fill="none" stroke={colors.c} strokeWidth="1.1"><path d="M0-22q18 0 18 17T0 22q-18 0-18-17T0-22Z"/><path d="M0-15q12 0 12 10T0 15q-12 0-12-10T0-15Z" stroke={colors.a}/><path d="M-5 0q5-9 10 0-5 9-10 0Z" fill={colors.b}/><circle cx="0" cy="0" r="2" fill={colors.c}/></g>
}
