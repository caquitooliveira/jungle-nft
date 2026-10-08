export type Network = 'ethereum' | 'polygon' | 'solana'

export interface NftEdition {
  id: string
  name: string
  priceEth: string
  availableQuantity: number
}

export interface NftReview {
  id: string
  collector: string
  rating: number
  comment: string
}

export interface Nft {
  id: string
  name: string
  description: string
  details: string[]
  imageUrl: string
  gallery: string[]
  category: string
  collection: string
  attributes: string[]
  network: Network
  networkDescription: string
  contractAddress: string
  contractDescription: string
  royaltyPercent: number
  reviews: NftReview[]
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