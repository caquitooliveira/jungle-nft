import { useSyncExternalStore } from 'react'
import type { CartItem } from '@/types/cart'

interface CartDatabase {
  guest: CartItem[]
  users: Record<string, CartItem[]>
  completedOrders: Record<string, string[]>
}

const storageKey = 'kurio:carts:v2'
const legacyStorageKey = 'kurio:guest-cart:v1'
const tokenStorageKey = 'kurio:session-token:v1'
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

function parseItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  const merged = new Map<string, CartItem>()

  for (const item of value.filter(isCartItem)) {
    const key = JSON.stringify([item.nftId, item.editionId])
    const previous = merged.get(key)
    const quantity = item.quantity + (previous?.quantity ?? 0)

    if (quantity > 100) {
      throw new Error(
        'Uma edição supera o limite de 100 unidades no carrinho.',
      )
    }

    merged.set(key, {
      nftId: item.nftId,
      editionId: item.editionId,
      quantity,
    })
  }

  return [...merged.values()]
}

function readDatabase(): CartDatabase {
  const stored = localStorage.getItem(storageKey)

  if (!stored) {
    const legacy = localStorage.getItem(legacyStorageKey)

    return {
      guest: legacy ? parseItems(JSON.parse(legacy)) : [],
      users: {},
      completedOrders: {},
    }
  }

  const value: unknown = JSON.parse(stored)

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Os dados salvos do carrinho são inválidos.')
  }

  const database = value as Record<string, unknown>
  const users: Record<string, CartItem[]> = {}
  const completedOrders: Record<string, string[]> = {}

  if (
    database.users &&
    typeof database.users === 'object' &&
    !Array.isArray(database.users)
  ) {
    for (const [userId, userItems] of Object.entries(database.users)) {
      users[userId] = parseItems(userItems)
    }
  }

  if (
    database.completedOrders &&
    typeof database.completedOrders === 'object' &&
    !Array.isArray(database.completedOrders)
  ) {
    for (const [userId, orderIds] of Object.entries(
      database.completedOrders,
    )) {
      if (
        !Array.isArray(orderIds) ||
        !orderIds.every(
          (orderId) =>
            typeof orderId === 'string' && orderId.length > 0,
        )
      ) {
        throw new Error(
          'O registro de compras do carrinho é inválido.',
        )
      }

      completedOrders[userId] = [...new Set<string>(orderIds)]
    }
  }

  return {
    guest: parseItems(database.guest),
    users,
    completedOrders,
  }
}

let activeUserId: string | null = null
let isLocked = Boolean(localStorage.getItem(tokenStorageKey))
let items: CartItem[] = []

try {
  items = isLocked ? [] : readDatabase().guest
} catch {
  // Preserva os dados salvos para não sobrescrever um carrinho inválido.
}

function notify() {
  listeners.forEach((listener) => listener())
}

function persist(database: CartDatabase) {
  localStorage.setItem(storageKey, JSON.stringify(database))
}

function ensureReady() {
  if (isLocked) {
    throw new Error('Aguarde a recuperação da sua sessão.')
  }
}

function saveCart(nextItems: CartItem[]) {
  ensureReady()

  const database = readDatabase()

  if (activeUserId) {
    database.users[activeUserId] = nextItems
  } else {
    database.guest = nextItems
  }

  persist(database)
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

export function useCartItems() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function activateUserCart(userId: string) {
  if (!userId) {
    throw new Error('Não foi possível identificar a conta.')
  }

  const database = readDatabase()

  const nextItems = parseItems([
    ...(database.users[userId] ?? []),
    ...database.guest,
  ])

  database.users[userId] = nextItems
  database.guest = []

  persist(database)

  activeUserId = userId
  isLocked = false
  items = nextItems
  notify()
}

export function activateGuestCart() {
  activeUserId = null
  isLocked = false

  try {
    items = readDatabase().guest
  } catch {
    items = []
  }

  notify()
}

window.addEventListener('storage', (event) => {
  if (event.key === tokenStorageKey || event.key === null) {
    window.location.reload()
    return
  }

  if (event.key === storageKey && !isLocked) {
    try {
      const database = readDatabase()

      items = activeUserId
        ? database.users[activeUserId] ?? []
        : database.guest

      notify()
    } catch {
      // Mantém o estado atual quando os dados recebidos são inválidos.
    }
  }
})

export function addCartItem(
  item: CartItem,
  availableQuantity: number,
) {
  ensureReady()

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
  ensureReady()

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
  ensureReady()

  saveCart(
    items.filter(
      (item) =>
        item.nftId !== nftId || item.editionId !== editionId,
    ),
  )
}

function applyConfirmedOrder(
  userId: string,
  orderId: string,
  purchasedItems: CartItem[],
) {
  ensureReady()

  if (!userId || activeUserId !== userId) {
    throw new Error(
      'Entre na conta do pedido para atualizar o carrinho.',
    )
  }

  if (
    !orderId ||
    !purchasedItems.length ||
    !purchasedItems.every(isCartItem)
  ) {
    throw new Error('Os itens do pedido são inválidos.')
  }

  const database = readDatabase()
  const completed = database.completedOrders[userId] ?? []

  if (completed.includes(orderId)) {
    return
  }

  const purchased = parseItems(purchasedItems)
  const quantities = new Map(
    purchased.map((item) => [
      JSON.stringify([item.nftId, item.editionId]),
      item.quantity,
    ]),
  )

  const nextItems = (database.users[userId] ?? [])
    .map((item) => {
      const purchasedQuantity =
        quantities.get(
          JSON.stringify([item.nftId, item.editionId]),
        ) ?? 0

      return {
        ...item,
        quantity: Math.max(0, item.quantity - purchasedQuantity),
      }
    })
    .filter((item) => item.quantity > 0)

  database.users[userId] = nextItems
  database.completedOrders[userId] = [...completed, orderId]

  // Grava a retirada e seu registro na mesma operação.
  persist(database)

  items = nextItems
  notify()
}

export async function completeCartOrder(
  userId: string,
  orderId: string,
  purchasedItems: CartItem[],
) {
  // Serializa a confirmação entre abas quando o navegador oferece
  // Web Locks. A marcação persistida também protege atualizações.
  if (navigator.locks) {
    await navigator.locks.request(storageKey, () => {
      applyConfirmedOrder(userId, orderId, purchasedItems)
    })
    return
  }

  applyConfirmedOrder(userId, orderId, purchasedItems)
}