import { api } from '@/lib/api'
import type { Nft, NftListResponse } from '@/types/nft'

export interface NftListParams {
  search?: string
  category?: string[]
  network?: string[]
  sort?: 'newest' | 'name'
  page?: number
  pageSize?: number
}

export async function getNfts(
  params: NftListParams,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const response = await api.get<NftListResponse>('/nfts', {
    params,
    signal,
    paramsSerializer: {
      indexes: null,
    },
  })

  return response.data
}

export async function getNft(
  id: string,
  signal?: AbortSignal,
): Promise<Nft> {
  const response = await api.get<Nft>(
    `/nfts/${encodeURIComponent(id)}`,
    { signal },
  )

  return response.data
}