import type { Network } from '@/types/nft'
import type { WalletProvider } from '@/types/order'

export interface UserProfile {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SavedWallet {
  id: string
  displayName: string
  nickname: string
  network: Network
  profileName: string
  address: string
  secondaryAddress: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
  isPrimary: boolean
}

export type SaveWalletRequest = Omit<SavedWallet, 'id'>