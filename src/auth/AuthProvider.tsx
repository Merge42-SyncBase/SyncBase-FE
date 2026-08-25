import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { APIError, api } from '../api/client'
import type { Session } from '../types'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  login(username: string, password: string): Promise<Session>
  logout(): Promise<void>
  refresh(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setSession(await api.session())
    } catch (error) {
      if (!(error instanceof APIError) || error.code !== 'SESSION_EXPIRED') throw error
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const next = await api.login(username, password)
    setSession(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    if (session) await api.logout(session.csrfToken)
    setSession(null)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({ session, loading, login, logout, refresh }),
    [loading, login, logout, refresh, session],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
