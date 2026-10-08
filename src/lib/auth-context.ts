import { createContext, useContext } from 'react'
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth'

export interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
  isAuthOpen: boolean
  openAuth: () => void
  closeAuth: () => void
  signIn: (payload: LoginRequest) => Promise<void>
  signUp: (payload: RegisterRequest) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider.')
  }

  return context
}