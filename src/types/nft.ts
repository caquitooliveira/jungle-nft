export type Network = 'ethereum' | 'polygon' | 'solana'

export interface NftEdition {
  id: string
  name: string
  priceEth: string
  availableQuantity: number
}

export interface Nft {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  network: Network
  creator: string
  createdAt: string
  editions: NftEdition[]
  version: number
}

export interface NftListResponse {
  items: Nft[]
  total: number
  page: number
  pageSize: number
}