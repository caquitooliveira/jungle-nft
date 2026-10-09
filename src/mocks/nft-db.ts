import { createNftFixtures } from './nft-fixtures'
import { ethToWei } from '@/lib/eth'
import type { Nft } from '@/types/nft'
import type { CartItem } from '@/types/cart'

interface InventoryDatabase {
  nfts: Nft[]
  processedOrders: Record<string, 'confirmed' | 'refused'>
}

interface EditionUpdate {
  priceEth?: string
  availableQuantity?: number
}

type NftListener = (nft: Nft) => void

const storageKey = 'kurio:mock-inventory:v1'
const listeners = new Set<NftListener>()

function readDatabase(): InventoryDatabase {
  const saved = localStorage.getItem(storageKey)

  if (!saved) {
    return {
      nfts: createNftFixtures(),
      processedOrders: {},
    }
  }

  const parsed: unknown = JSON.parse(saved)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('A base de estoque é inválida.')
  }

  const value = parsed as Record<string, unknown>

  if (
    !Array.isArray(value.nfts) ||
    !value.processedOrders ||
    typeof value.processedOrders !== 'object' ||
    Array.isArray(value.processedOrders)
  ) {
    throw new Error('A base de estoque é inválida.')
  }

  for (const raw of value.nfts) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('NFT salvo inválido.')
    }

    const nft = raw as Nft

    if (
      typeof nft.id !== 'string' ||
      !Number.isSafeInteger(nft.version) ||
      nft.version < 1 ||
      !Array.isArray(nft.editions)
    ) {
      throw new Error('NFT salvo inválido.')
    }

    for (const edition of nft.editions) {
      if (
        !edition ||
        typeof edition.id !== 'string' ||
        typeof edition.priceEth !== 'string' ||
        !Number.isSafeInteger(edition.availableQuantity) ||
        edition.availableQuantity < 0
      ) {
        throw new Error('Edição salva inválida.')
      }

      ethToWei(edition.priceEth)
    }
  }

  if (
    Object.values(value.processedOrders).some(
      (status) => status !== 'confirmed' && status !== 'refused',
    )
  ) {
    throw new Error('O histórico de estoque é inválido.')
  }

  return {
    nfts: value.nfts as Nft[],
    processedOrders: value.processedOrders as InventoryDatabase['processedOrders'],
  }
}

export const nfts: Nft[] = readDatabase().nfts

function applyDatabase(database: InventoryDatabase) {
  const previousVersions = new Map(
    nfts.map((nft) => [nft.id, nft.version]),
  )

  // Preserva a referência importada pelos handlers da API.
  nfts.splice(0, nfts.length, ...database.nfts)

  for (const nft of nfts) {
    if (previousVersions.get(nft.id) !== nft.version) {
      listeners.forEach((listener) => listener(nft))
    }
  }
}

function saveDatabase(database: InventoryDatabase) {
  // Só avisa a interface depois de salvar.
  localStorage.setItem(storageKey, JSON.stringify(database))
  applyDatabase(database)
}

export function subscribeNftUpdates(listener: NftListener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function updateNftEdition(
  nftId: string,
  editionId: string,
  changes: EditionUpdate,
): Nft {
  const database = readDatabase()
  const index = database.nfts.findIndex((nft) => nft.id === nftId)
  const current = database.nfts[index]
  const edition = current?.editions.find(
    (item) => item.id === editionId,
  )

  if (!current || !edition) {
    throw new Error('NFT ou edição não encontrado.')
  }

  const priceEth = changes.priceEth ?? edition.priceEth
  const availableQuantity =
    changes.availableQuantity ?? edition.availableQuantity

  ethToWei(priceEth)

  if (
    !Number.isSafeInteger(availableQuantity) ||
    availableQuantity < 0
  ) {
    throw new Error('Informe um estoque inteiro e não negativo.')
  }

  if (
    priceEth === edition.priceEth &&
    availableQuantity === edition.availableQuantity
  ) {
    return current
  }

  const updated: Nft = {
    ...current,
    version: current.version + 1,
    editions: current.editions.map((item) =>
      item.id === editionId
        ? { ...item, priceEth, availableQuantity }
        : item,
    ),
  }

  database.nfts[index] = updated
  saveDatabase(database)

  return updated
}

export function processOrderInventory(
  orderId: string,
  purchasedItems: CartItem[],
): 'confirmed' | 'refused' {
  const database = readDatabase()

  if (Object.hasOwn(database.processedOrders, orderId)) {
    return database.processedOrders[orderId]
  }

  const quantities = new Map<string, CartItem>()

  for (const item of purchasedItems) {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error('Quantidade inválida no pedido.')
    }

    const key = JSON.stringify([item.nftId, item.editionId])
    const previous = quantities.get(key)

    quantities.set(key, {
      ...item,
      quantity: item.quantity + (previous?.quantity ?? 0),
    })
  }

  const items = [...quantities.values()]

  const hasStock = items.length > 0 && items.every((item) => {
    const nft = database.nfts.find(
      (entry) => entry.id === item.nftId,
    )
    const edition = nft?.editions.find(
      (entry) => entry.id === item.editionId,
    )

    return Boolean(
      edition && edition.availableQuantity >= item.quantity,
    )
  })

  const status = hasStock ? 'confirmed' : 'refused'

  if (hasStock) {
    database.nfts = database.nfts.map((nft) => {
      const purchased = items.filter(
        (item) => item.nftId === nft.id,
      )

      if (!purchased.length) {
        return nft
      }

      return {
        ...nft,
        version: nft.version + 1,
        editions: nft.editions.map((edition) => {
          const item = purchased.find(
            (entry) => entry.editionId === edition.id,
          )

          return item
            ? {
                ...edition,
                availableQuantity:
                  edition.availableQuantity - item.quantity,
              }
            : edition
        }),
      }
    })
  }

  // Estoque e registro da baixa são salvos juntos.
  database.processedOrders[orderId] = status
  saveDatabase(database)

  return status
}

window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    try {
      applyDatabase(readDatabase())
    } catch (error) {
      console.error('[MSW] Não foi possível recuperar o estoque:', error)
    }
  }
})