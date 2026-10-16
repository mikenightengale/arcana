const depths = [
  { count: 10, label: '10 cards', title: 'One focused question', structure: 'Keep one clearly defined question at the center. Use the cards to clarify its context, influences, and next step.' },
  { count: 20, label: '20 cards', title: 'One subject with multiple dimensions', structure: 'Approximately 3–5 thematic sections, with one clearly defined question assigned to each card.' },
  { count: 45, label: '40–50 cards', title: 'Comprehensive situation analysis', structure: 'Group questions into thematic sections covering the situation, motivations, obstacles, choices, and likely direction. Start with 45 cards; adjust to 40–50 as needed.' },
  { count: 60, label: '60 cards', title: 'Extensive cross-topic investigation', structure: 'Separate each related topic into its own thematic section, then include a section exploring how those topics connect.' },
  { count: 70, label: '70 cards', title: 'Full-spectrum exploration', structure: 'Map the entire interconnected situation in distinct thematic sections, including background, participants, dynamics, alternatives, and integration.' },
]

export function ReadingDepth({ count, locked, onChange }: { count: number; locked: boolean; onChange: (count: number) => void }) {
  const selected = depths.find((depth) => depth.count === 45 ? count >= 40 && count <= 50 : depth.count === count)
  return <section className="reading-depth" aria-labelledby="reading-depth-title">
    <h2 id="reading-depth-title">Choose your reading depth</h2>
    {locked && <p className="field-hint">Your pasted spread sets the card count. Clear it to choose a preset or custom count.</p>}
    <fieldset disabled={locked}>
      <legend className="visually-hidden">Reading depth presets</legend>
      {depths.map((depth) => <label key={depth.count} className="depth-option">
        <input type="radio" name="reading-depth" checked={selected === depth} onChange={() => onChange(depth.count)} />
        <span><strong>{depth.label}</strong> — {depth.title}</span>
      </label>)}
    </fieldset>
    <div className="depth-structure" role="status">
      <small>SUGGESTED STRUCTURE</small>
      <h3>{selected?.title ?? 'Custom reading depth'}</h3>
      <p>{selected?.structure ?? 'Choose a count that fits your question. Keep each thematic section focused and assign one clearly defined question to each card.'}</p>
      <p>For longer spreads, interpret patterns within each section before connecting themes across the reading.</p>
    </div>
  </section>
}
