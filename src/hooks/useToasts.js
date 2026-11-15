import { useCallback, useEffect, useRef, useState } from 'react'

const TOAST_DURATION = 3000

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const nextIdRef = useRef(0)
  const timersRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id)

    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    )
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = nextIdRef.current + 1
    nextIdRef.current = id

    setToasts((currentToasts) => [...currentToasts, { id, message, type }])

    const timer = window.setTimeout(() => {
      timersRef.current.delete(id)
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
    }, TOAST_DURATION)

    timersRef.current.set(id, timer)

    return id
  }, [])

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return { toasts, showToast, dismissToast }
}
