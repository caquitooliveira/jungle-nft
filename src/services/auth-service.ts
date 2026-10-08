import { api } from '@/lib/api'
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth'

const tokenStorageKey = 'kurio:session-token:v1'

export function getSessionToken() {
  return localStorage.getItem(tokenStorageKey)
}

export function saveSessionToken(token: string) {
  localStorage.setItem(tokenStorageKey, token)
}

export function clearSessionToken() {
  localStorage.removeItem(tokenStorageKey)
}

export async function login(
  payload: LoginRequest,
): Promise<AuthSession> {
  const response = await api.post<AuthSession>(
    '/auth/login',
    payload,
  )

  return response.data
}

export async function register(
  payload: RegisterRequest,
): Promise<AuthSession> {
  const response = await api.post<AuthSession>(
    '/auth/register',
    payload,
  )

  return response.data
}

export async function getSession(
  signal?: AbortSignal,
): Promise<AuthSession | null> {
  const token = getSessionToken()

  if (!token) {
    return null
  }

  const response = await api.get<AuthSession>('/auth/session', {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data
}

export async function logout() {
  const token = getSessionToken()

  if (!token) {
    return
  }

  await api.post('/auth/logout', null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}