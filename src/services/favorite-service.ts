import { api } from '@/lib/api'

export async function getFavorites(
  token: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await api.get<string[]>('/favorites', {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}

export async function setFavorite(
  token: string,
  nftId: string,
  favorite: boolean,
): Promise<string[]> {
  const response = await api.put<string[]>(
    `/favorites/${encodeURIComponent(nftId)}`,
    { favorite },
    { headers: { Authorization: `Bearer ${token}` } },
  )

  return response.data
}