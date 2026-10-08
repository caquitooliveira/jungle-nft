import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AuthContext } from '@/lib/auth-context'
import {
  activateGuestCart,
  activateUserCart,
} from '@/lib/cart-store'
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
  const activeToken = useRef(token)

  const endLocalSession = useCallback(() => {
    operationVersion.current += 1
    activeToken.current = null

    clearSessionToken()
    activateGuestCart()
    setToken(null)

    void queryClient.cancelQueries({ queryKey: ['private'] })
    queryClient.removeQueries({ queryKey: ['private'] })

    void queryClient.cancelQueries({ queryKey: ['cart-quote'] })
    queryClient.removeQueries({ queryKey: ['cart-quote'] })
  }, [queryClient])

  const sessionQuery = useQuery({
    queryKey: ['session', token],
    queryFn: async ({ signal }) => {
      let recoveredSession: AuthSession | null

      try {
        recoveredSession = await getSession(signal)
      } catch (error) {
        if (
          isAxiosError(error) &&
          error.response?.status === 401
        ) {
          recoveredSession = null
        } else {
          throw error
        }
      }

      // Uma resposta antiga não pode restaurar uma conta - depois de sair ou entrar como outro usuário.
      if (signal.aborted || activeToken.current !== token) {
        return null
      }

      if (
        !recoveredSession ||
        recoveredSession.expiresAt <= Date.now()
      ) {
        endLocalSession()
        return null
      }

      activateUserCart(recoveredSession.user.id)

      return recoveredSession
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
      endLocalSession()
    }, Math.max(0, session.expiresAt - Date.now()))

    return () => window.clearTimeout(timer)
  }, [session, endLocalSession])

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

    // A mesclagem limpa o visitante na mesma gravação. - Recarregar ou recuperar a sessão não duplica os itens.
    activateUserCart(nextSession.user.id)
    saveSessionToken(nextSession.token)
    activeToken.current = nextSession.token

    queryClient.removeQueries({ queryKey: ['private'] })
    queryClient.removeQueries({ queryKey: ['session'] })
    queryClient.removeQueries({ queryKey: ['cart-quote'] })

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
    const version = ++operationVersion.current

    await logout()

    if (version !== operationVersion.current) {
      return
    }

    await queryClient.cancelQueries()

    if (version !== operationVersion.current) {
      return
    }

    endLocalSession()
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