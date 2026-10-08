import { api } from '@/lib/api'
import { getSessionToken } from '@/services/auth-service'
import type {
  ChangePasswordRequest,
  UserProfile,
} from '@/types/profile'

function authorizationHeaders() {
  const token = getSessionToken()

  if (!token) {
    throw new Error('Entre na sua conta para continuar.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getProfile(
  signal?: AbortSignal,
): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/profile', {
    signal,
    headers: authorizationHeaders(),
  })

  return response.data
}

export async function saveProfile(
  profile: UserProfile,
): Promise<UserProfile> {
  const response = await api.put<UserProfile>(
    '/profile',
    profile,
    { headers: authorizationHeaders() },
  )

  return response.data
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await api.put('/profile/password', payload, {
    headers: authorizationHeaders(),
  })
}