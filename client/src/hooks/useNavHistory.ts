import { useReducer, useCallback } from 'react'

interface NavState {
  history: string[]
  idx: number
}

type NavAction =
  | { type: 'push'; filename: string }
  | { type: 'back' }
  | { type: 'forward' }

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'push': {
      const trimmed = state.history.slice(0, state.idx + 1)
      return { history: [...trimmed, action.filename], idx: trimmed.length }
    }
    case 'back':
      return state.idx > 0 ? { ...state, idx: state.idx - 1 } : state
    case 'forward':
      return state.idx < state.history.length - 1
        ? { ...state, idx: state.idx + 1 }
        : state
    default:
      return state
  }
}

export function useNavHistory() {
  const [state, dispatch] = useReducer(navReducer, { history: [], idx: -1 })

  const push = useCallback((filename: string) => {
    dispatch({ type: 'push', filename })
  }, [])

  const back = useCallback(() => {
    dispatch({ type: 'back' })
  }, [])

  const forward = useCallback(() => {
    dispatch({ type: 'forward' })
  }, [])

  const canGoBack = state.idx > 0
  const canGoForward = state.idx < state.history.length - 1
  const current = state.idx >= 0 ? state.history[state.idx] : null

  return { push, back, forward, canGoBack, canGoForward, current, state }
}
