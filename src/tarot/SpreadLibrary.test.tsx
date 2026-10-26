import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { SpreadLibrary } from './SpreadLibrary'
import { SpreadLayout } from './SpreadLayout'
import { createPresetSpread, spreadLibrary } from './spreads'
import { mapReading } from './mapping'
import type { TarotSpread } from '../types/tarot'
vi.mock('./CrystalCard', () => ({ CrystalCard: ({ card, reversed }: { card: {name:string}; reversed:boolean }) => <span>{card.name}{reversed ? ', reversed' : ''}</span> }))
afterEach(cleanup)
function Library({ onBegin = vi.fn() }) {
  const [spread, setSpread] = useState<TarotSpread | null>(null)
  return <SpreadLibrary spread={spread} onSelect={setSpread} onBegin={onBegin} cardBackUrl="back.svg" />
}
describe('spread library and spatial renderer', () => {
  it('browses all presets, filters categories, and shows actual preview positions', () => {
    render(<Library />)
    expect(document.querySelectorAll('.spread-choice')).toHaveLength(12)
    fireEvent.click(screen.getByRole('button', { name: 'Investigative' }))
    expect(document.querySelectorAll('.spread-choice')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Intention vs. Action/ }))
    expect(screen.getByRole('region', { name: 'Intention vs. Action layout' })).toBeInTheDocument()
    expect(document.querySelectorAll('.spread-slot')).toHaveLength(6)
    expect(screen.getByText('The intention being expressed.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Position 3: Actual Capability, undrawn' }))
    expect(screen.getByLabelText('Question for Actual Capability')).toHaveValue('What is the actual capability to act?')
  })
  it('customizes questions, retains edits when inspecting another position, and validates blank questions', () => {
    const begin = vi.fn()
    render(<Library onBegin={begin} />)
    fireEvent.click(screen.getByRole('button', { name: /Three-Card Spread/ }))
    const question = screen.getByLabelText('Question for Past')
    fireEvent.change(question, { target: { value: 'What shaped my career?' } })
    fireEvent.click(screen.getByRole('button', { name: '2. Present' }))
    fireEvent.click(screen.getByRole('button', { name: '1. Past' }))
    expect(screen.getByLabelText('Question for Past')).toHaveValue('What shaped my career?')
    fireEvent.change(screen.getByLabelText('Question for Past'), { target: { value: ' ' } })
    expect(screen.getByRole('button', { name: 'Begin this spread' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Question for Past'), { target: { value: 'What shaped my career?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Begin this spread' }))
    expect(begin).toHaveBeenCalledOnce()
  })
  it('renders reversed cards in assigned positions and exposes a keyboard-accessible list', () => {
    const spread = createPresetSpread(spreadLibrary[0])
    const reading = mapReading([{id:'the-fool',name:'The Fool',arcana:'major',orientation:'reversed'}], spread)
    render(<SpreadLayout spread={spread} reading={reading} />)
    const slot = screen.getByRole('button', { name: 'Position 1: Past, The Fool, reversed' })
    expect(within(slot).getByText('The Fool, reversed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Position 2: Present, undrawn' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Spread positions' }).querySelectorAll('button')).toHaveLength(3)
    expect(screen.getByRole('region', { name: 'Scrollable spread table' })).toHaveAttribute('tabindex','0')
  })
})
