import { api } from '@/lib/api'
import { getSessionToken } from '@/services/auth-service'
import type {
  SavedWallet,
  SaveWalletRequest,
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

export async function getWallets(
  signal?: AbortSignal,
): Promise<SavedWallet[]> {
  const response = await api.get<SavedWallet[]>('/wallets', {
    signal,
    headers: authorizationHeaders(),
  })

  return response.data
}

export async function saveWallet(
  payload: SaveWalletRequest,
): Promise<SavedWallet> {
  const response = await api.put<SavedWallet>(
    '/wallets',
    payload,
    { headers: authorizationHeaders() },
  )

  return response.data
}