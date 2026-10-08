import { api } from '@/lib/api'
import { getSessionToken } from './auth-service'
import type { CreateOrderRequest, Order } from '@/types/order'

function sessionHeaders() {
  const token = getSessionToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createOrder(
  payload: CreateOrderRequest,
  idempotencyKey: string,
): Promise<Order> {
  const response = await api.post<Order>('/orders', payload, {
    headers: {
      ...sessionHeaders(),
      'Idempotency-Key': idempotencyKey,
    },
  })

  return response.data
}

export async function getOrder(
  id: string,
  signal?: AbortSignal,
): Promise<Order> {
  const response = await api.get<Order>(
    `/orders/${encodeURIComponent(id)}`,
    {
      signal,
      headers: sessionHeaders(),
    },
  )

  return response.data
}

export async function getOrderByKey(
  key: string,
  signal?: AbortSignal,
): Promise<Order> {
  const response = await api.get<Order>(
    `/orders/by-key/${encodeURIComponent(key)}`,
    {
      signal,
      headers: sessionHeaders(),
    },
  )

  return response.data
}