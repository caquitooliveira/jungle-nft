import { nfts } from './nft-db'
import { ethToWei, weiToEth } from '@/lib/eth'
import type { CartQuote, CartQuoteLine } from '@/types/cart'

export class MockApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function calculateCartQuote(body: unknown): CartQuote {
  if (!body || typeof body !== 'object') {
    throw new MockApiError(400, 'INVALID_CART', 'Carrinho inválido.')
  }

  const payload = body as Record<string, unknown>

  if (
    !Array.isArray(payload.items) ||
    payload.items.length > 100
  ) {
    throw new MockApiError(
      400,
      'INVALID_CART',
      'Informe uma lista válida de itens.',
    )
  }

  if (
    payload.coupon !== undefined &&
    typeof payload.coupon !== 'string'
  ) {
    throw new MockApiError(
      400,
      'INVALID_COUPON',
      'Informe um código promocional válido.',
    )
  }

  const coupon =
    typeof payload.coupon === 'string'
      ? payload.coupon.trim().toUpperCase()
      : ''

  if (coupon && coupon !== 'KURIO10') {
    throw new MockApiError(
      400,
      'INVALID_COUPON',
      'Código promocional inválido.',
    )
  }

  const lines: CartQuoteLine[] = []
  const seen = new Set<string>()
  let subtotal = 0n

  for (const rawItem of payload.items) {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new MockApiError(
        400,
        'INVALID_CART',
        'Um dos itens é inválido.',
      )
    }

    const item = rawItem as Record<string, unknown>

    if (
      typeof item.nftId !== 'string' ||
      typeof item.editionId !== 'string' ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100
    ) {
      throw new MockApiError(
        400,
        'INVALID_CART',
        'Um dos itens possui dados inválidos.',
      )
    }

    const key = `${item.nftId}:${item.editionId}`

    if (seen.has(key)) {
      throw new MockApiError(
        400,
        'INVALID_CART',
        'O carrinho contém edições duplicadas.',
      )
    }

    seen.add(key)

    const nft = nfts.find((entry) => entry.id === item.nftId)
    const edition = nft?.editions.find(
      (entry) => entry.id === item.editionId,
    )

    if (!nft || !edition) {
      throw new MockApiError(
        409,
        'CART_ITEM_NOT_FOUND',
        'Um NFT ou uma edição não está mais disponível.',
      )
    }

    if (item.quantity > edition.availableQuantity) {
      throw new MockApiError(
        409,
        'INSUFFICIENT_STOCK',
        `A edição ${edition.name} de ${nft.name} possui ` +
          `${edition.availableQuantity} unidades disponíveis.`,
      )
    }

    const lineTotal =
      ethToWei(edition.priceEth) * BigInt(item.quantity)

    subtotal += lineTotal

    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      quantity: item.quantity,
      name: nft.name,
      imageUrl: nft.imageUrl,
      editionName: edition.name,
      unitPriceEth: edition.priceEth,
      totalEth: weiToEth(lineTotal),
      availableQuantity: edition.availableQuantity,
    })
  }

  const discount = coupon ? subtotal / 10n : 0n
  const networkFee = lines.length ? ethToWei('0.016') : 0n

  return {
    items: lines,
    subtotalEth: weiToEth(subtotal),
    discountEth: weiToEth(discount),
    networkFeeEth: weiToEth(networkFee),
    totalEth: weiToEth(subtotal - discount + networkFee),
    coupon: coupon || null,
  }
}