import { useSyncExternalStore } from 'react'
import type { CartItem } from '@/types/cart'

interface CartDatabase {
  guest: CartItem[]
  users: Record<string, CartItem[]>
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
    const key = `${item.nftId}:${item.editionId}`
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
    }
  }

  const value: unknown = JSON.parse(stored)

  if (!value || typeof value !== 'object') {
    throw new Error('Os dados salvos do carrinho são inválidos.')
  }

  const database = value as Record<string, unknown>
  const users: Record<string, CartItem[]> = {}

  if (
    database.users &&
    typeof database.users === 'object' &&
    !Array.isArray(database.users)
  ) {
    for (const [userId, userItems] of Object.entries(database.users)) {
      users[userId] = parseItems(userItems)
    }
  }

  return {
    guest: parseItems(database.guest),
    users,
  }
}

let activeUserId: string | null = null
let isLocked = Boolean(localStorage.getItem(tokenStorageKey))
let items: CartItem[] = []

try {
  items = isLocked ? [] : readDatabase().guest
} catch {
  // Mantém os dados originais salvos. Uma operação posterior
  // informa o erro em vez de sobrescrever um carrinho corrompido.
}

function notify() {
  listeners.forEach((listener) => listener())
}

function persist(database: CartDatabase) {
  // Visitante e contas são gravados juntos para que a mesclagem
  // não seja repetida após recarregar.
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
  const database = readDatabase()

  if (!userId) {
    throw new Error('Não foi possível identificar a conta.')
  }

  // Só o carrinho do visitante entra na mesclagem.
  // O carrinho de outra conta permanece separado.
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
    // A sessão pode ter mudado em outra aba.
    // Recarrega para validar a identidade antes de mostrar itens.
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
      // Não substitui o estado atual por dados inválidos.
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