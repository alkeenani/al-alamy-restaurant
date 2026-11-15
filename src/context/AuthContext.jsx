import { createContext, useContext, useEffect, useReducer } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
// status      : 'initializing' | 'authenticated' | 'unauthenticated'
// user        : Supabase Auth user object | null
// isAdmin     : boolean
// accessDenied: boolean — true when a user authenticated but is not in admin_users
// ---------------------------------------------------------------------------

const initialState = {
  status: 'initializing',
  user: null,
  isAdmin: false,
  accessDenied: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_ADMIN':
      return { status: 'authenticated', user: action.user, isAdmin: true, accessDenied: false }
    case 'SET_UNAUTHENTICATED':
      return { status: 'unauthenticated', user: null, isAdmin: false, accessDenied: false }
    case 'SET_ACCESS_DENIED':
      return { status: 'unauthenticated', user: null, isAdmin: false, accessDenied: true }
    default:
      return state
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verify whether the given Supabase user is in admin_users.
  // Returns true if admin, false otherwise.
  async function checkAdmin(user) {
    if (!user) return false

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Admin check error:', error.message)
      return false
    }

    return data !== null
  }

  useEffect(() => {
    // Restore session on mount and listen for auth state changes.
    // onAuthStateChange fires immediately with the current session,
    // so we don't need a separate getSession() call.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        dispatch({ type: 'SET_UNAUTHENTICATED' })
        return
      }

      const admin = await checkAdmin(session.user)

      if (admin) {
        dispatch({ type: 'SET_ADMIN', user: session.user })
      } else {
        // Authenticated but not an admin — sign out silently and signal denial.
        await supabase.auth.signOut()
        dispatch({ type: 'SET_ACCESS_DENIED' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    // onAuthStateChange will dispatch SET_UNAUTHENTICATED automatically.
  }

  function clearAccessDenied() {
    if (state.accessDenied) {
      dispatch({ type: 'SET_UNAUTHENTICATED' })
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, clearAccessDenied }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
