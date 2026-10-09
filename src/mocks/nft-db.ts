import { createNftFixtures } from './nft-fixtures'
import { ethToWei } from '@/lib/eth'
import type { Nft } from '@/types/nft'

export const nfts = createNftFixtures()

type NftListener = (nft: Nft) => void

interface EditionUpdate {
  priceEth?: string
  availableQuantity?: number
}

const listeners = new Set<NftListener>()

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
  const index = nfts.findIndex((nft) => nft.id === nftId)
  const current = nfts[index]

  if (!current) {
    throw new Error('NFT não encontrado.')
  }

  const edition = current.editions.find(
    (item) => item.id === editionId,
  )

  if (!edition) {
    throw new Error('Edição não encontrada.')
  }

  const priceEth = changes.priceEth ?? edition.priceEth
  const availableQuantity =
    changes.availableQuantity ?? edition.availableQuantity

  // Valida o preço sem converter ETH para número decimal.
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

  nfts[index] = updated

  listeners.forEach((listener) => listener(updated))

  return updated
}