export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
}

export interface CartQuoteRequest {
  items: CartItem[]
  coupon?: string
}

export interface CartQuoteLine extends CartItem {
  name: string
  imageUrl: string
  editionName: string
  unitPriceEth: string
  totalEth: string
  availableQuantity: number
}

export interface CartQuote {
  items: CartQuoteLine[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: string | null
}