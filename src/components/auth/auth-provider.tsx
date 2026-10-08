import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AuthContext } from '@/lib/auth-context'
import {
  clearSessionToken,
  getSession,
  getSessionToken,
  login,
  logout,
  register,
  saveSessionToken,
} from '@/services/auth-service'
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(getSessionToken)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const operationVersion = useRef(0)

  const sessionQuery = useQuery({
    queryKey: ['session', token],
    queryFn: async ({ signal }) => {
      try {
        return await getSession(signal)
      } catch (error) {
        if (
          isAxiosError(error) &&
          error.response?.status === 401
        ) {
          return null
        }

        throw error
      }
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: token ? 15_000 : false,
  })

  const session =
    token && sessionQuery.isSuccess
      ? sessionQuery.data ?? null
      : null

  useEffect(() => {
    if (!session) {
      return
    }

    const timer = window.setTimeout(() => {
      operationVersion.current += 1
      clearSessionToken()
      setToken(null)
      queryClient.removeQueries({ queryKey: ['private'] })
      queryClient.removeQueries({ queryKey: ['session'] })
    }, Math.max(0, session.expiresAt - Date.now()))

    return () => window.clearTimeout(timer)
  }, [session, queryClient])

  async function acceptSession(
    nextSession: AuthSession,
    version: number,
  ) {
    if (version !== operationVersion.current) {
      return
    }

    await queryClient.cancelQueries()

    if (version !== operationVersion.current) {
      return
    }

    saveSessionToken(nextSession.token)
    queryClient.removeQueries({ queryKey: ['private'] })
    queryClient.removeQueries({ queryKey: ['session'] })
    queryClient.setQueryData(
      ['session', nextSession.token],
      nextSession,
    )
    setToken(nextSession.token)
    setIsAuthOpen(false)
  }

  async function signIn(payload: LoginRequest) {
    const version = ++operationVersion.current
    const nextSession = await login(payload)
    await acceptSession(nextSession, version)
  }

  async function signUp(payload: RegisterRequest) {
    const version = ++operationVersion.current
    const nextSession = await register(payload)
    await acceptSession(nextSession, version)
  }

  async function signOut() {
    operationVersion.current += 1

    // Revoga a sessão antes de concluir a saída.
    await logout()
    await queryClient.cancelQueries()

    clearSessionToken()
    setToken(null)
    queryClient.removeQueries({ queryKey: ['private'] })
    queryClient.removeQueries({ queryKey: ['session'] })
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: Boolean(token) && sessionQuery.isPending,
        isAuthOpen,
        openAuth: () => setIsAuthOpen(true),
        closeAuth: () => setIsAuthOpen(false),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}