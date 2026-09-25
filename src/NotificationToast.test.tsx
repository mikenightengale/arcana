import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationToast, type ToastMessage } from './NotificationToast'

const toast = (variant: ToastMessage['variant']): ToastMessage => ({ id: 1, variant, message: `${variant} message` })

afterEach(() => vi.useRealTimers())

describe('notification toasts', () => {
  it('announces success and warning toasts as status messages and allows dismissal', () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<NotificationToast toast={toast('success')} onDismiss={onDismiss} />)

    expect(screen.getByRole('status')).toHaveTextContent('success message')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(onDismiss).toHaveBeenCalledOnce()

    rerender(<NotificationToast toast={toast('warning')} onDismiss={onDismiss} />)
    expect(screen.getByRole('status')).toHaveTextContent('warning message')
  })

  it('announces errors urgently and dismisses them after the longer timeout', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<NotificationToast toast={toast('error')} onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent('error message')
    act(() => vi.advanceTimersByTime(6999))
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('automatically dismisses success notifications sooner', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<NotificationToast toast={toast('success')} onDismiss={onDismiss} />)

    act(() => vi.advanceTimersByTime(3999))
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
