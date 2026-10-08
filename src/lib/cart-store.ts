import { useSyncExternalStore } from 'react'
import type { CartItem } from '@/types/cart'

const storageKey = 'kurio:guest-cart:v1'
const listeners = new Set<() => void>()

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.nftId === 'string' &&
    typeof item.editionId === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 100
  )
}

function readCart(): CartItem[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? '[]',
    )

    if (!Array.isArray(stored)) {
      return []
    }

    const merged = new Map<string, CartItem>()

    for (const item of stored.filter(isCartItem)) {
      const key = `${item.nftId}:${item.editionId}`
      const previous = merged.get(key)

      merged.set(key, {
        ...item,
        quantity: Math.min(
          100,
          item.quantity + (previous?.quantity ?? 0),
        ),
      })
    }

    return [...merged.values()]
  } catch {
    return []
  }
}

let items = readCart()

function notify() {
  listeners.forEach((listener) => listener())
}

function saveCart(nextItems: CartItem[]) {
  // Salva primeiro: se o navegador bloquear o armazenamento,
  // a interface poderá mostrar o erro sem afirmar que salvou.
  localStorage.setItem(storageKey, JSON.stringify(nextItems))
  items = nextItems
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return items
}

window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    items = readCart()
    notify()
  }
})

export function useCartItems() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function addCartItem(
  item: CartItem,
  availableQuantity: number,
) {
  if (
    !isCartItem(item) ||
    !Number.isSafeInteger(availableQuantity) ||
    availableQuantity <= 0
  ) {
    throw new Error('Esta edição está indisponível.')
  }

  const existing = items.find(
    (entry) =>
      entry.nftId === item.nftId &&
      entry.editionId === item.editionId,
  )

  const nextQuantity = (existing?.quantity ?? 0) + item.quantity

  if (nextQuantity > Math.min(availableQuantity, 100)) {
    throw new Error('A quantidade supera o estoque disponível.')
  }

  saveCart(
    existing
      ? items.map((entry) =>
          entry.nftId === item.nftId &&
          entry.editionId === item.editionId
            ? { ...entry, quantity: nextQuantity }
            : entry,
        )
      : [...items, item],
  )
}

export function setCartQuantity(
  nftId: string,
  editionId: string,
  quantity: number,
) {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 100
  ) {
    throw new Error('Informe uma quantidade entre 1 e 100.')
  }

  saveCart(
    items.map((item) =>
      item.nftId === nftId && item.editionId === editionId
        ? { ...item, quantity }
        : item,
    ),
  )
}

export function removeCartItem(nftId: string, editionId: string) {
  saveCart(
    items.filter(
      (item) =>
        item.nftId !== nftId || item.editionId !== editionId,
    ),
  )
}