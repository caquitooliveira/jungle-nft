import { api } from '@/lib/api'
import type { CartQuote, CartQuoteRequest } from '@/types/cart'

export async function getCartQuote(
  payload: CartQuoteRequest,
  signal?: AbortSignal,
): Promise<CartQuote> {
  const response = await api.post<CartQuote>(
    '/cart/quote',
    payload,
    { signal },
  )

  return response.data
}