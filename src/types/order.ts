import type { CartQuote, CartQuoteRequest } from './cart'
import type { Network } from './nft'

export type WalletProvider =
  | 'metamask'
  | 'walletconnect'
  | 'coinbase'

export interface CollectorProfile {
  displayName: string
  username: string
  profileName: string
  email: string
  referralCode: string
  ensName: string
  secondaryWallet: string
  observation: string
}

export interface CheckoutWallet {
  provider: WalletProvider
  network: Network
  address: string
}

export interface CreateOrderRequest extends CartQuoteRequest {
  acceptedQuote: CartQuote
  profile: CollectorProfile
  wallet: CheckoutWallet
}

export interface Order {
  id: string
  userId: string
  idempotencyKey: string
  status: 'pending' | 'confirmed' | 'refused'
  createdAt: string
  updatedAt: string
  readyAt: number
  version: number
  transactionId: string
  quote: CartQuote
  profile: CollectorProfile
  wallet: CheckoutWallet
}